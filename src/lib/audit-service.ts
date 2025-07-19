import { prisma } from './prisma';
import { AuditAction } from '@prisma/client';

export class AuditService {
  static async logAction(params: {
    action: AuditAction;
    entityType: string;
    entityId?: string;
    adminId?: string;
    details?: any;
    context: { sessionId?: string; ipAddress?: string };
  }) {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        adminId: params.adminId,
        sessionId: params.context.sessionId,
        ipAddress: params.context.ipAddress,
        details: params.details,
        createdAt: new Date(),
      },
    });
  }
}
