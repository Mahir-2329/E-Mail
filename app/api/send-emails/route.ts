import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import pool from '@/lib/db';
// Import to ensure cron is initialized on server startup
import '@/lib/cron-init';

export async function POST(request: NextRequest) {
  try {
    // Read environment variables
    const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
    const EMAIL_PASSWORD = process.env.EMAIL_APP_PASSWORD;

    if (!EMAIL_ADDRESS || !EMAIL_PASSWORD) {
      return NextResponse.json(
        { error: 'Email credentials not configured' },
        { status: 500 }
      );
    }

    const client = await pool.connect();

    try {
      // Fetch pending emails
      // Note: We select 'Pending' but we DO NOT change their status after sending
      // This means they will remain 'Pending' for the next run unless manually changed
      const result = await client.query(`
        SELECT * FROM recipients 
        WHERE status = 'Pending'
      `);

      const pendingRows = result.rows;

      if (pendingRows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No pending emails found',
          sent: 0,
          failed: 0,
        });
      }

      // Setup SMTP transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: EMAIL_ADDRESS,
          pass: EMAIL_PASSWORD,
        },
      });

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Send emails
      for (const row of pendingRows) {
        const company = row.company?.trim();
        const to_email = row.contact_email?.trim();
        const target_role = row.target_role?.trim();

        // Validate required fields
        if (!company || !to_email || !target_role) {
          results.failed++;
          results.errors.push(
            `Skipping row ${row.id} - missing fields (Company: ${company}, Email: ${to_email}, Role: ${target_role})`
          );
          // STRICT: Do not update status even on missing fields
          continue;
        }

        const subject = `Application for ${target_role}`;

        const body = `Hello ${company} team,

I'm Mahir Pansuriya, a cybersecurity professional focused on cloud identity and security operations.

I've been following your company's work in cybersecurity, and I admire your approach to threat detection and operational security ,it aligns closely with how I work.

My experience includes:

Azure Entra ID (Azure AD): RBAC, SSO, secure access configurations

SIEM / Splunk: alert tuning, basic detection logic, false-positive reduction

SOC workflows: alert monitoring and incident documentation

I believe my skills and mindset align well with your mission, and I'm confident I can contribute to teams working in identity, monitoring, or security operations.

Portfolio: https://mahir-pansuriya.vercel.app/

Best,
Mahir Pansuriya
Toronto, Canada
📧 pansuriyamahir@gmail.com

LinkedIn: https://www.linkedin.com/in/mahir-pansuriya/
`;

        try {
          await transporter.sendMail({
            from: EMAIL_ADDRESS,
            to: to_email,
            subject: subject,
            text: body,
          });

          // Update last_contacted_at to show activity, but keep status 'Pending'
          await client.query(
            'UPDATE recipients SET last_contacted_at = CURRENT_TIMESTAMP WHERE id = $2',
            [row.id]
          );

          // Log success
          await client.query(
            'INSERT INTO email_logs (recipient_id, status) VALUES ($1, $2)',
            [row.id, 'sent']
          );

          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Failed to send to ${to_email}: ${error.message}`);

          // Log failure
          await client.query(
            'INSERT INTO email_logs (recipient_id, status, error_message) VALUES ($1, $2, $3)',
            [row.id, 'failed', error.message]
          );

          // STRICT: Do not update status on failure
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${pendingRows.length} pending emails`,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors,
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
