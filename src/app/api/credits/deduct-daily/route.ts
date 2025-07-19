import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserStatus, CreditLogType } from '@prisma/client';

interface DeductionResult {
  totalProcessed: number;
  totalBlocked: number;
  errors: string[];
  processedUsers: {
    id: string;
    email: string;
    previousCredits: number;
    newCredits: number;
    blocked: boolean;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you might want to add API key validation)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting daily credit deduction process...');
    
    const result = await performDailyDeduction();
    
    console.log('Daily credit deduction completed:', {
      totalProcessed: result.totalProcessed,
      totalBlocked: result.totalBlocked,
      errorCount: result.errors.length
    });

    return NextResponse.json({
      success: true,
      message: 'Daily credit deduction completed successfully',
      data: result
    });

  } catch (error) {
    console.error('Daily credit deduction failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during credit deduction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function performDailyDeduction(): Promise<DeductionResult> {
  const result: DeductionResult = {
    totalProcessed: 0,
    totalBlocked: 0,
    errors: [],
    processedUsers: []
  };

  try {
    // Get all approved users with credits > 0
    const eligibleUsers = await prisma.user.findMany({
      where: {
        status: UserStatus.APPROVED,
        credits: {
          gt: 0
        }
      },
      select: {
        id: true,
        email: true,
        credits: true,
        lastCreditDeduction: true
      }
    });

    console.log(`Found ${eligibleUsers.length} eligible users for credit deduction`);

    // Process each user individually with error handling
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

    return result;

  } catch (error) {
    console.error('Error fetching eligible users:', error);
    result.errors.push(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

async function processUserDeduction(
  user: { id: string; email: string; credits: number; lastCreditDeduction: Date | null },
  result: DeductionResult
) {
  const previousCredits = user.credits;
  const newCredits = Math.max(0, user.credits - 1);
  const willBeBlocked = newCredits === 0;
  const newStatus = willBeBlocked ? UserStatus.BLOCKED : UserStatus.APPROVED;

  // Use transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // Update user credits and status
    await tx.user.update({
      where: { id: user.id },
      data: {
        credits: newCredits,
        status: newStatus,
        lastCreditDeduction: new Date(),
        updatedAt: new Date()
      }
    });

    // Create credit log entry
    await tx.creditLog.create({
      data: {
        userId: user.id,
        amount: -1,
        type: CreditLogType.DAILY_DEDUCTION,
        reason: 'Daily automatic credit deduction',
        createdAt: new Date()
      }
    });
  });

  // Track the result
  result.processedUsers.push({
    id: user.id,
    email: user.email,
    previousCredits,
    newCredits,
    blocked: willBeBlocked
  });

  if (willBeBlocked) {
    result.totalBlocked++;
    console.log(`User ${user.email} blocked due to zero credits`);
  }

  console.log(`Processed user ${user.email}: ${previousCredits} -> ${newCredits} credits`);
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