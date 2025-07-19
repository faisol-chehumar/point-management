import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserStatus } from '@prisma/client';

interface DeductionResult {
  totalProcessed: number;
  totalBlocked: number;
  errors: string[];
}

// GET endpoint for manual testing/monitoring
export async function GET() {
  try {
    // Get statistics about eligible users
    const stats = await prisma.user.groupBy({
      by: ['status'],
      where: {
        status: {
          in: [UserStatus.APPROVED, UserStatus.BLOCKED]
        }
      },
      _count: {
        id: true
      },
      _sum: {
        credits: true
      }
    });

    const eligibleCount = await prisma.user.count({
      where: {
        status: UserStatus.APPROVED,
        credits: {
          gt: 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        eligibleForDeduction: eligibleCount,
        statusBreakdown: stats,
        lastRun: 'Check logs for last execution time'
      }
    });

  } catch (error) {
    console.error('Error fetching deduction stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// POST endpoint for triggering daily credit deduction
export async function POST(request: Request) {
  try {
    // Verify authorization token for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET_TOKEN;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await performDailyDeduction();
    
    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: result.totalProcessed,
        totalBlocked: result.totalBlocked,
        errorCount: result.errors.length,
        errors: result.errors,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error performing daily credit deduction:', error);
    return NextResponse.json(
      { error: 'Failed to perform daily deduction' },
      { status: 500 }
    );
  }
}

async function performDailyDeduction(): Promise<DeductionResult> {
  const result: DeductionResult = {
    totalProcessed: 0,
    totalBlocked: 0,
    errors: [],
  };

  try {
    // Find all approved users with credits > 0
    const eligibleUsers = await prisma.user.findMany({
      where: {
        status: UserStatus.APPROVED,
        credits: { gt: 0 },
      },
      select: {
        id: true,
        email: true,
        credits: true,
      },
    });

    console.log(`Found ${eligibleUsers.length} eligible users for credit deduction.`);

    // Process each user
    for (const user of eligibleUsers) {
      try {
        await processUserDeduction(user, result);
        result.totalProcessed++;
      } catch (error) {
        const errorMessage = `Failed to process user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        result.errors.push(errorMessage);
      }
    }
  } catch (error) {
    const dbErrorMessage = `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('Error fetching eligible users:', dbErrorMessage);
    result.errors.push(dbErrorMessage);
  }

  return result;
}

async function processUserDeduction(
  user: { id: string; email: string; credits: number },
  result: DeductionResult
) {
  const newCredits = Math.max(0, user.credits - 1);
  const willBeBlocked = newCredits === 0;
  const newStatus = willBeBlocked ? UserStatus.BLOCKED : UserStatus.APPROVED;

  // Use transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // Update user credits and status
    await tx.user.update({
      where: { id: user.id },
      data: {
        credits: newCredits,
        status: newStatus,
        lastCreditDeduction: new Date(),
      },
    });

    // Log the credit deduction
    await tx.creditLog.create({
      data: {
        userId: user.id,
        amount: -1,
        type: 'DAILY_DEDUCTION',
        reason: 'Daily automatic credit deduction',
      },
    });
  });

  if (willBeBlocked) {
    result.totalBlocked++;
    console.log(`User ${user.email} has been blocked due to zero credits.`);
  }
}
