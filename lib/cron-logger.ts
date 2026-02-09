import pool from './db';

export interface CronLogData {
  status: 'success' | 'failed' | 'running';
  emails_sent?: number;
  emails_failed?: number;
  error_message?: string;
  execution_time_ms?: number;
  cron_mode?: 'interval' | 'standard';
}

export async function logCronExecution(data: CronLogData): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO cron_logs (executed_at, status, emails_sent, emails_failed, error_message, execution_time_ms, cron_mode)
         VALUES (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5, $6)`,
        [
          data.status,
          data.emails_sent || 0,
          data.emails_failed || 0,
          data.error_message || null,
          data.execution_time_ms || null,
          data.cron_mode || null,
        ]
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    // Don't throw - logging failures shouldn't break cron execution
    console.error('[Cron Logger] Failed to log cron execution:', error.message);
  }
}
