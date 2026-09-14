import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RecordAuditParams {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/** Central write path for the immutable audit trail required by the
 * administrator "Audit Log" screen and compliance reporting. Every
 * security-relevant event in the system should call `record()`. */
@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async record(params: RecordAuditParams) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    action?: AuditAction;
    userId?: string;
    entityType?: string;
    from?: Date;
    to?: Date;
  }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 50, 200);

    const where: Prisma.AuditLogWhereInput = {
      action: params.action,
      userId: params.userId,
      entityType: params.entityType,
      createdAt:
        params.from || params.to
          ? { gte: params.from, lte: params.to }
          : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, email: true, role: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
