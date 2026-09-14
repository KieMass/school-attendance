import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditAction, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LoginDto } from './dto/login.dto';

export interface JwtAccessPayload {
  sub: string; // userId
  role: Role;
  profileId?: string;
  email?: string | null;
}

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

const sha256 = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private auditLog: AuditLogService,
  ) {}

  async login(dto: LoginDto, meta: RequestMeta = {}) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
      // Opt back into the passwordHash the global PrismaService omit config
      // hides everywhere else — this is the one place that legitimately
      // needs it, to verify the submitted password.
      omit: { passwordHash: false },
      include: {
        student: true,
        parent: true,
        securityOfficer: true,
        staff: true,
        admin: true,
      },
    });

    if (!user || !user.isActive) {
      await this.auditLog.record({
        action: AuditAction.LOGIN_FAILED,
        metadata: { identifier: dto.identifier, reason: 'not_found_or_inactive' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      await this.auditLog.record({
        userId: user.id,
        action: AuditAction.LOGIN_FAILED,
        metadata: { reason: 'bad_password' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const profileId = this.resolveProfileId(user);
    const tokens = await this.issueTokenPair(
      { sub: user.id, role: user.role, profileId, email: user.email },
      meta,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditLog.record({
      userId: user.id,
      action: AuditAction.LOGIN,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileId,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta = {}) {
    const tokenHash = sha256(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt) {
      // Reuse of a revoked/rotated token indicates possible theft — revoke
      // every session for this user as a precaution.
      if (stored?.revokedAt) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: stored.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    const userId = stored.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        parent: true,
        securityOfficer: true,
        staff: true,
        admin: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is no longer active');
    }

    // Rotate: revoke the used token and issue a brand new pair.
    const profileId = this.resolveProfileId(user);
    const tokens = await this.issueTokenPair(
      { sub: user.id, role: user.role, profileId, email: user.email },
      meta,
    );

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: tokens.refreshTokenId },
    });

    await this.auditLog.record({
      userId: user.id,
      action: AuditAction.TOKEN_REFRESHED,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async logout(userId: string, rawRefreshToken: string) {
    const tokenHash = sha256(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.auditLog.record({ userId, action: AuditAction.LOGOUT });
    return { success: true };
  }

  async logoutAllSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokenPair(
    payload: JwtAccessPayload,
    meta: RequestMeta,
  ) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('jwt.accessSecret'),
      expiresIn: this.config.get('jwt.accessExpiresIn'),
    });

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const refreshExpiresInDays = this.parseDaysFromDuration(
      this.config.get<string>('jwt.refreshExpiresIn', '30d'),
    );
    const expiresAt = new Date(
      Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000,
    );

    const stored = await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: sha256(rawRefreshToken),
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      refreshTokenId: stored.id,
    };
  }

  private parseDaysFromDuration(duration: string): number {
    const match = /^(\d+)d$/.exec(duration);
    return match ? parseInt(match[1], 10) : 30;
  }

  private resolveProfileId(user: {
    role: Role;
    student?: { id: string } | null;
    parent?: { id: string } | null;
    securityOfficer?: { id: string } | null;
    staff?: { id: string } | null;
    admin?: { id: string } | null;
  }): string | undefined {
    switch (user.role) {
      case Role.STUDENT:
        return user.student?.id;
      case Role.PARENT:
        return user.parent?.id;
      case Role.SECURITY:
        return user.securityOfficer?.id;
      case Role.STAFF:
        return user.staff?.id;
      case Role.ADMIN:
        return user.admin?.id;
      default:
        return undefined;
    }
  }
}
