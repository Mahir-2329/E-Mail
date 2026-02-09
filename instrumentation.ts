// Next.js instrumentation file
// This runs on server startup and initializes the cron job automatically

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run in Node.js runtime (server-side)
    try {
      // Check if using interval-based cron (every N days from start)
      const useInterval = process.env.CRON_INTERVAL_MODE === 'true';
      
      if (useInterval) {
        // Use interval-based cron (runs tomorrow, then every N days)
        const { startIntervalCron } = await import('./lib/cron-interval');
        const intervalDays = parseInt(process.env.CRON_INTERVAL_DAYS || '3');
        const hour = parseInt(process.env.CRON_HOUR || '8');
        const minute = parseInt(process.env.CRON_MINUTE || '0');
        startIntervalCron(intervalDays, hour, minute);
        console.log(`[Instrumentation] Interval cron job auto-started: every ${intervalDays} days at ${hour}:${minute.toString().padStart(2, '0')}`);
      } else {
        // Use standard cron (fixed days of month)
        const { startEmailCron } = await import('./lib/cron');
        const schedule = process.env.CRON_SCHEDULE || '0 8 */3 * *'; // Default: Every 3 days at 8 AM
        startEmailCron(schedule);
        console.log(`[Instrumentation] Cron job auto-started with schedule: ${schedule}`);
      }
    } catch (error: any) {
      console.error('[Instrumentation] Failed to auto-start cron job:', error.message);
    }
  }
}
