
import cron from 'node-cron';

const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN;
const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

if (!CRON_SECRET_TOKEN) {
  console.error('CRON_SECRET_TOKEN is not set. Cron jobs will not be scheduled.');
  process.exit(1);
}

async function triggerDailyDeduction(retryCount = 0): Promise<boolean> {
  const maxRetries = 3;
  
  try {
    console.log(`Triggering daily credit deduction (attempt ${retryCount + 1})...`);
    
    const response = await fetch(`${API_BASE_URL}/api/credits/deduct-daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('Daily credit deduction completed successfully:', {
        processed: result.data.totalProcessed,
        blocked: result.data.totalBlocked,
        errors: result.data.errorCount,
        timestamp: result.data.timestamp,
      });

      if (result.data.errorCount > 0) {
        console.error('Some errors occurred during deduction:', result.data.errors);
      }
      
      return true;
    } else {
      throw new Error('API returned unsuccessful result');
    }
    
  } catch (error) {
    console.error(`Daily deduction attempt ${retryCount + 1} failed:`, error);
    
    // Retry logic
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return triggerDailyDeduction(retryCount + 1);
    } else {
      console.error(`Daily deduction failed after ${maxRetries + 1} attempts. Manual intervention required.`);
      // In production, you might want to send an alert here
      return false;
    }
  }
}

// Schedule to run at midnight every day
cron.schedule('0 0 * * *', async () => {
  console.log('Starting daily credit deduction cron job...');
  const success = await triggerDailyDeduction();
  
  if (success) {
    console.log('Daily credit deduction cron job completed successfully.');
  } else {
    console.error('Daily credit deduction cron job failed. Check logs for details.');
  }
});

// Health check endpoint - run every hour to verify cron is running
cron.schedule('0 * * * *', () => {
  console.log('Cron health check: System is running at', new Date().toISOString());
});

console.log('Cron jobs scheduled:');
console.log('- Daily credit deduction: Every day at midnight (0 0 * * *)');
console.log('- Health check: Every hour (0 * * * *)');
console.log('Waiting for scheduled runs...');
