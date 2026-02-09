import cron from 'node-cron';

let emailCronJob: cron.ScheduledTask | null = null;
let currentSchedule: string = '';

export function startEmailCron(cronSchedule?: string) {
  // Default: Every 3 days at 8 AM (configurable via CRON_SCHEDULE env)
  const defaultSchedule = process.env.CRON_SCHEDULE || '0 8 */3 * *';
  const schedule = cronSchedule || defaultSchedule;
  
  // Format: 'minute hour day month weekday'
  // Examples:
  // '0 8 */3 * *' - Every 3 days at 8 AM (default)
  // '0 8 * * *' - Every day at 8 AM
  // '55 23 * * *' - Every day at 11:55 PM
  // '0 */6 * * *' - Every 6 hours
  // '0 9 * * 1-5' - Every weekday at 9 AM
  // '*/30 * * * *' - Every 30 minutes

  if (emailCronJob) {
    emailCronJob.stop();
  }

  currentSchedule = schedule;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin);

  emailCronJob = cron.schedule(schedule, async () => {
    console.log(`[Cron] Running scheduled email job at ${new Date().toISOString()}`);
    
    try {
      // Use native fetch (available in Node.js 18+)
      const response = await fetch(`${baseUrl}/api/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`[Cron] Email job completed:`, data);
    } catch (error: any) {
      console.error(`[Cron] Email job failed:`, error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/Toronto', // Adjust to your timezone
  });

  console.log(`[Cron] Email cron job started with schedule: ${schedule}`);
  return emailCronJob;
}

export function stopEmailCron() {
  if (emailCronJob) {
    emailCronJob.stop();
    emailCronJob = null;
    currentSchedule = '';
    console.log('[Cron] Email cron job stopped');
  }
}

export function getCronStatus() {
  return {
    isRunning: emailCronJob !== null,
    schedule: currentSchedule,
  };
}
