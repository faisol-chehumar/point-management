import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const totalUsers = await prisma.user.count();
    const totalCreditLogs = await prisma.creditLog.count();
    const totalAuditLogs = await prisma.auditLog.count();

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCreditLogs,
        totalAuditLogs,
      },
    });
  } catch (error) {
    console.error('Error fetching system integrity data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
