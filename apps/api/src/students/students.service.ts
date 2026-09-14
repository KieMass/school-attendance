import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import { LeaveRequestStatus } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
  ) {}

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  /** Regenerates/fetches the current active QR image for an approved leave
   * request belonging to this student — used by the "View / Download / Print
   * QR code" screen. */
  async getQrForLeaveRequest(studentId: string, leaveRequestId: string) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: { qrTokens: { orderBy: { issuedAt: 'desc' }, take: 1 } },
    });
    if (!leaveRequest) throw new NotFoundException('Leave request not found');
    if (leaveRequest.studentId !== studentId) {
      throw new ForbiddenException('Not your leave request');
    }
    if (leaveRequest.status !== LeaveRequestStatus.APPROVED) {
      throw new ForbiddenException(
        'A QR code is only available for approved leave requests',
      );
    }

    const latest = leaveRequest.qrTokens[0];
    // The QR image itself is not persisted (only its encrypted payload &
    // hash are), so we regenerate the PNG deterministically from the
    // existing active token rather than issuing a new one on every view.
    if (latest && latest.status === 'ACTIVE' && latest.expiresAt > new Date()) {
      const QRCode = await import('qrcode');
      const qrContent = `${latest.publicId}.${latest.encryptedPayload}`;
      const qrImageDataUrl = await QRCode.toDataURL(qrContent, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 400,
      });
      return { qrToken: latest, qrImageDataUrl };
    }

    // Expired/missing — issue a fresh one (still gated on APPROVED status).
    return this.qrService.generateForLeaveRequest(leaveRequestId);
  }
}
