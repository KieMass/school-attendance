import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserWithProfileParams {
  email?: string;
  phone?: string;
  password: string;
  role: Role;
  mustChangePassword?: boolean;
  student?: {
    studentIdCode: string;
    firstName: string;
    lastName: string;
    dormitory?: string;
    gradeLevel?: string;
    dateOfBirth?: Date;
  };
  parent?: {
    firstName: string;
    lastName: string;
    relationship?: string;
  };
  securityOfficer?: {
    firstName: string;
    lastName: string;
    badgeNumber: string;
    postLocation?: string;
  };
  staff?: {
    firstName: string;
    lastName: string;
    department?: string;
  };
  admin?: {
    firstName: string;
    lastName: string;
  };
}

/** Low-level account management shared by the admin module (who owns
 * onboarding every role) and the auth/self-service flows. Keeping user +
 * role-profile creation in one transactional place avoids orphaned rows
 * (e.g. a User with no matching Student profile). */
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async hashPassword(plain: string): Promise<string> {
    const rounds = this.config.get<number>('bcryptSaltRounds', 12);
    return bcrypt.hash(plain, rounds);
  }

  async createUserWithProfile(params: CreateUserWithProfileParams) {
    if (!params.email && !params.phone) {
      throw new ConflictException(
        'At least one of email or phone is required',
      );
    }

    const passwordHash = await this.hashPassword(params.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: params.email,
          phone: params.phone,
          passwordHash,
          role: params.role,
          mustChangePassword: params.mustChangePassword ?? true,
        },
      });

      switch (params.role) {
        case Role.STUDENT:
          if (!params.student) throw new ConflictException('Student profile data required');
          await tx.student.create({
            data: { userId: user.id, ...params.student },
          });
          break;
        case Role.PARENT:
          if (!params.parent) throw new ConflictException('Parent profile data required');
          await tx.parent.create({
            data: { userId: user.id, ...params.parent },
          });
          break;
        case Role.SECURITY:
          if (!params.securityOfficer)
            throw new ConflictException('Security officer profile data required');
          await tx.securityOfficer.create({
            data: { userId: user.id, ...params.securityOfficer },
          });
          break;
        case Role.STAFF:
          if (!params.staff) throw new ConflictException('Staff profile data required');
          await tx.staff.create({ data: { userId: user.id, ...params.staff } });
          break;
        case Role.ADMIN:
          if (!params.admin) throw new ConflictException('Admin profile data required');
          await tx.admin.create({ data: { userId: user.id, ...params.admin } });
          break;
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          student: true,
          parent: true,
          securityOfficer: true,
          staff: true,
          admin: true,
        },
      });
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        parent: true,
        securityOfficer: true,
        staff: true,
        admin: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async list(params: { role?: Role; page?: number; pageSize?: number; search?: string }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 25, 100);

    const where = {
      role: params.role,
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' as const } },
              { phone: { contains: params.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { student: true, parent: true, securityOfficer: true, staff: true, admin: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async setActive(id: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }

  async changePassword(userId: string, newPassword: string) {
    const passwordHash = await this.hashPassword(newPassword);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
  }
}
