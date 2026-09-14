import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { LeaveRequestStatus, QrTokenStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QrCrypto, QrPayload } from './qr-crypto.util';

export interface ScannedQrInfo {
  qrTokenId: string;
  leaveRequestId: string;
  studentId: string;
  status: QrTokenStatus;
  expiresAt: Date;
}

const sha256 = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

/**
 * Generates and validates the encrypted, time-limited, single-use QR gate
 * passes described in the leave workflow (step 4 & 7 of the spec).
 *
 * QR image content is the string `${publicId}.${encryptedPayloadBase64}`.
 * `publicId` is an unguessable UUID used purely as a fast DB lookup key —
 * it is never treated as authoritative on its own. The encrypted payload
 * (AES-256-GCM) carries requestId/studentId/tokenId/securityToken/exp, so
 * any edit to the printed/displayed QR content fails the GCM auth-tag
 * check on scan. The raw security token is additionally hashed (SHA-256)
 * and stored on the QrToken row so a scan must match both a valid
 * decryption AND the expected hash — defense in depth if the encryption
 * key were ever compromised without DB access, or vice versa.
 */
@Injectable()
export class QrService {
  private readonly qrCrypto: QrCrypto;
  private readonly defaultValidityMinutes: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.qrCrypto = new QrCrypto(this.config.get<string>('qr.encryptionKey')!);
    this.defaultValidityMinutes = this.config.get<number>(
      'qr.defaultValidityMinutes',
      120,
    );
  }

  /** Issues a new QR token for an approved leave request. Revokes any
   * previously issued (still-active) tokens for the same request first, so
   * only one gate pass is ever valid at a time. */
  async generateForLeaveRequest(leaveRequestId: string) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: { student: true },
    });
    if (!leaveRequest) throw new NotFoundException('Leave request not found');
    if (leaveRequest.status !== LeaveRequestStatus.APPROVED) {
      throw new BadRequestException(
        'QR codes can only be issued for approved leave requests',
      );
    }

    await this.prisma.qrToken.updateMany({
      where: { leaveRequestId, status: QrTokenStatus.ACTIVE },
      data: { status: QrTokenStatus.REVOKED, revokedReason: 'Superseded by new token' },
    });

    const publicId = crypto.randomUUID();
    const rawSecurityToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + this.defaultValidityMinutes * 60_000,
    );

    const payload: QrPayload = {
      requestId: leaveRequest.id,
      studentId: leaveRequest.studentId,
      tokenId: publicId,
      exp: Math.floor(expiresAt.getTime() / 1000),
      securityToken: rawSecurityToken,
    };
    const encryptedPayload = this.qrCrypto.encrypt(payload);

    const qrToken = await this.prisma.qrToken.create({
      data: {
        leaveRequestId,
        publicId,
        encryptedPayload,
        securityToken: sha256(rawSecurityToken),
        expiresAt,
      },
    });

    const qrContent = `${publicId}.${encryptedPayload}`;
    const qrImageDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
    });

    return { qrToken, qrContent, qrImageDataUrl };
  }

  /** Read-only verification used by the security officer's "scan" screen
   * before they commit to a sign-out/sign-in action. Never mutates state. */
  async validate(scannedContent: string): Promise<{
    qrToken: Awaited<ReturnType<typeof this.loadQrTokenWithRelations>>;
  }> {
    const [publicId, encryptedFromScan] = this.splitContent(scannedContent);

    const qrToken = await this.loadQrTokenWithRelations(publicId);
    if (!qrToken) throw new NotFoundException('QR code not recognized');

    let decrypted: QrPayload;
    try {
      decrypted = this.qrCrypto.decrypt(encryptedFromScan);
    } catch {
      throw new BadRequestException(
        'QR code failed integrity check — it may be forged or corrupted',
      );
    }

    if (
      decrypted.requestId !== qrToken.leaveRequestId ||
      decrypted.studentId !== qrToken.leaveRequest.studentId ||
      decrypted.tokenId !== qrToken.publicId ||
      sha256(decrypted.securityToken) !== qrToken.securityToken
    ) {
      throw new BadRequestException('QR code data does not match records');
    }

    if (
      qrToken.status === QrTokenStatus.EXPIRED ||
      new Date() > qrToken.expiresAt
    ) {
      if (qrToken.status === QrTokenStatus.ACTIVE) {
        await this.prisma.qrToken.update({
          where: { id: qrToken.id },
          data: { status: QrTokenStatus.EXPIRED },
        });
      }
      throw new GoneException('QR code has expired');
    }

    if (qrToken.status === QrTokenStatus.USED) {
      throw new ConflictException('QR code has already been used');
    }
    if (qrToken.status === QrTokenStatus.REVOKED) {
      throw new ConflictException('QR code has been revoked');
    }
    if (qrToken.leaveRequest.status !== LeaveRequestStatus.APPROVED) {
      throw new ConflictException(
        'Leave request is no longer in an approved state',
      );
    }

    return { qrToken };
  }

  /** Atomically marks a token USED. Uses a conditional update (status must
   * still be ACTIVE) so two concurrent scans of the same QR can never both
   * succeed — this is what actually enforces "single-use". Returns false
   * if another scan won the race. */
  async markUsed(qrTokenId: string): Promise<boolean> {
    const result = await this.prisma.qrToken.updateMany({
      where: { id: qrTokenId, status: QrTokenStatus.ACTIVE },
      data: { status: QrTokenStatus.USED, usedAt: new Date() },
    });
    return result.count === 1;
  }

  private splitContent(content: string): [string, string] {
    const idx = content.indexOf('.');
    if (idx <= 0) throw new BadRequestException('Malformed QR code');
    return [content.slice(0, idx), content.slice(idx + 1)];
  }

  private loadQrTokenWithRelations(publicId: string) {
    return this.prisma.qrToken.findUnique({
      where: { publicId },
      include: {
        leaveRequest: {
          include: { student: { include: { user: true } } },
        },
      },
    });
  }
}
