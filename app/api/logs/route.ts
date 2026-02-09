import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();

        try {
            const result = await client.query(`
        SELECT 
          l.id,
          l.sent_at,
          l.status,
          l.error_message,
          r.company,
          r.contact_email AS contact_email,
          r.target_role
        FROM email_logs l
        JOIN recipients r ON l.recipient_id = r.id
        ORDER BY l.sent_at DESC
        LIMIT 1000
      `);

            return NextResponse.json({
                success: true,
                logs: result.rows,
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
