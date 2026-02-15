import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // 1. Fetch all recipients
      const recipientsResult = await client.query('SELECT * FROM recipients ORDER BY created_at DESC');
      const recipients = recipientsResult.rows;

      // 2. Fetch all email logs
      const logsResult = await client.query('SELECT * FROM email_logs ORDER BY sent_at ASC');
      const logs = logsResult.rows;

      // 3. Identify unique send sessions (group by minute)
      // Map: "YYYY-MM-DD HH:mm" -> Column Name "Sent YYYY-MM-DD HH:mm"
      const timeColumnMap = new Map<string, string>();
      const logMap = new Map<string, string>(); // Key: "recipientId-timestampStr", Value: status

      logs.forEach(log => {
        const date = new Date(log.sent_at);
        // Format: YYYY-MM-DD HH:mm
        const timeStr = date.toISOString().slice(0, 16).replace('T', ' ');
        const columnName = `Sent ${timeStr}`;

        timeColumnMap.set(timeStr, columnName);

        // Store status for this recipient at this time
        // Use '✓' for sent, '✗' for failed
        const symbol = log.status === 'sent' ? '✓' : '✗';
        logMap.set(`${log.recipient_id}-${timeStr}`, symbol);
      });

      // Sort columns chronologically
      const sortedTimeStrs = Array.from(timeColumnMap.keys()).sort();
      const historyColumns = sortedTimeStrs.map(t => timeColumnMap.get(t)!);

      // 4. Transform rows
      const formattedRows = recipients.map(row => {
        const rowObj: any = {
          'Company': row.company,
          'Contact Email': row.contact_email,
          'Target Role': row.target_role,
          'Status': row.status,
          'Last Contacted': row.last_contacted_at ? new Date(row.last_contacted_at).toLocaleString() : '',
          'id': row.id
        };

        // Add history columns
        sortedTimeStrs.forEach(timeStr => {
          const colName = timeColumnMap.get(timeStr)!;
          const status = logMap.get(`${row.id}-${timeStr}`);
          rowObj[colName] = status || ''; // Empty string if no log for this time
        });

        return rowObj;
      });

      return NextResponse.json({
        success: true,
        data: formattedRows,
        totalRows: formattedRows.length,
        pendingCount: formattedRows.filter((row: any) => row.Status === 'Pending').length,
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
