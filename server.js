// Server initialization script
// This ensures cron jobs start automatically when the server starts
// Used for non-Vercel deployments

if (typeof require !== 'undefined') {
  // Initialize cron job on server startup
  try {
    const { startEmailCron } = require('./lib/cron.ts');
    const schedule = process.env.CRON_SCHEDULE || '55 23 * * *';
    startEmailCron(schedule);
    console.log(`[Server Init] Cron job started with schedule: ${schedule}`);
  } catch (error) {
    console.error('[Server Init] Failed to start cron job:', error.message);
  }
}
