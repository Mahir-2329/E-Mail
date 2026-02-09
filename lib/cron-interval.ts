// Custom cron implementation for "every N days" interval
// This runs the job, then schedules the next run N days later

import { startEmailCron as startStandardCron } from './cron';

let intervalJob: NodeJS.Timeout | null = null;
let lastRunDate: Date | null = null;

export function startIntervalCron(intervalDays: number = 3, hour: number = 8, minute: number = 0) {
  // Stop existing job if running
  if (intervalJob) {
    clearTimeout(intervalJob);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin);

  const runEmailJob = async () => {
    console.log(`[Interval Cron] Running email job at ${new Date().toISOString()}`);
    lastRunDate = new Date();
    
    try {
      const response = await fetch(`${baseUrl}/api/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`[Interval Cron] Email job completed:`, data);
      
      // Schedule next run
      scheduleNextRun(intervalDays, hour, minute);
    } catch (error: any) {
      console.error(`[Interval Cron] Email job failed:`, error.message);
      // Retry in 1 hour if failed
      setTimeout(() => scheduleNextRun(intervalDays, hour, minute), 60 * 60 * 1000);
    }
  };

  const scheduleNextRun = (days: number, h: number, m: number) => {
    const now = new Date();
    let nextRun = new Date();
    
    // Set to the specified time (hour:minute)
    nextRun.setHours(h, m, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    // If we have a last run date, calculate from that + interval days
    if (lastRunDate) {
      nextRun = new Date(lastRunDate);
      nextRun.setDate(nextRun.getDate() + days);
      nextRun.setHours(h, m, 0, 0);
      
      // If calculated time is in the past, add another interval
      while (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + days);
      }
    }
    
    const msUntilNextRun = nextRun.getTime() - now.getTime();
    
    console.log(`[Interval Cron] Next run scheduled for: ${nextRun.toISOString()} (in ${Math.round(msUntilNextRun / 1000 / 60 / 60)} hours)`);
    
    intervalJob = setTimeout(() => {
      runEmailJob();
    }, msUntilNextRun);
  };

  // Start the first run
  scheduleNextRun(intervalDays, hour, minute);
  
  console.log(`[Interval Cron] Interval cron started: every ${intervalDays} days at ${hour}:${minute.toString().padStart(2, '0')}`);
  
  return intervalJob;
}

export function stopIntervalCron() {
  if (intervalJob) {
    clearTimeout(intervalJob);
    intervalJob = null;
    lastRunDate = null;
    console.log('[Interval Cron] Interval cron stopped');
  }
}

export function getIntervalCronStatus() {
  return {
    isRunning: intervalJob !== null,
    lastRun: lastRunDate,
  };
}
