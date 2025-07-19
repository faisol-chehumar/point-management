import { prisma } from './prisma';
import { CreditLogType, CreditSource } from '@prisma/client';

export class CreditLogger {
  static async logCreditChange(params: {
    userId: string;
    amount: number;
    previousBalance: number;
    newBalance: number;
    type: CreditLogType;
    source: CreditSource;
    adminId?: string;
    reason?: string;
    context: { sessionId?: string; ipAddress?: string };
  }) {
    return await prisma.creditLog.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        type: params.type,
        source: params.source,
        previousBalance: params.previousBalance,
        newBalance: params.newBalance,
        reason: params.reason,
        adminId: params.adminId,
        sessionId: params.context.sessionId,
        ipAddress: params.context.ipAddress,
        createdAt: new Date(),
      },
    });
  }
}
