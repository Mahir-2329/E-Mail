// Auto-start cron job on server initialization
// This runs automatically when the server starts

import { startEmailCron } from './cron';

// Only run in server environment (not in browser)
if (typeof window === 'undefined') {
  // Get schedule from environment variable or use default (every 3 days at 8 AM)
  const schedule = process.env.CRON_SCHEDULE || '0 8 */3 * *';
  
  // Start the cron job automatically
  try {
    startEmailCron(schedule);
    console.log(`[Auto-start] Cron job initialized with schedule: ${schedule}`);
  } catch (error: any) {
    console.error('[Auto-start] Failed to initialize cron job:', error.message);
  }
}
