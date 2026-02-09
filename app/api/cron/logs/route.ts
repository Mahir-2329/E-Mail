import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          id,
          executed_at,
          status,
          emails_sent,
          emails_failed,
          error_message,
          execution_time_ms,
          cron_mode
        FROM cron_logs
        ORDER BY executed_at DESC
        LIMIT 500
      `);

      return NextResponse.json({
        success: true,
        logs: result.rows,
        total: result.rows.length,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
