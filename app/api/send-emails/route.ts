import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
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

    // Read CSV file from public folder
    const csvPath = path.join(process.cwd(), 'public', 'data.csv');
    let csvContent = fs.readFileSync(csvPath, 'utf8');
    // Remove BOM if present
    if (csvContent.charCodeAt(0) === 0xfeff) {
      csvContent = csvContent.slice(1);
    }

    // Parse CSV
    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Filter out empty rows
    const validRows = rows.filter((row: any) => 
      Object.values(row).some((val: any) => val && val.toString().trim())
    );

    // Create a new timestamp column for this send session
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
    const newColumnName = `Sent ${dateStr} ${timeStr}`;
    
    // Add the new column to all rows (initialize as empty)
    validRows.forEach((row: any) => {
      row[newColumnName] = '';
    });

    // Count pending rows
    const pendingRows = validRows.filter(
      (row: any) => row.Status?.trim() === 'Pending'
    );

    if (pendingRows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No rows with "Pending" status found',
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
      const company = row.Company?.trim();
      const to_email = row['Contact Email']?.trim();
      const target_role = row['Target Role']?.trim();

      // Validate required fields
      if (!company || !to_email || !target_role) {
        results.failed++;
        results.errors.push(
          `Skipping row - missing fields (Company: ${company}, Email: ${to_email}, Role: ${target_role})`
        );
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

        // Mark as sent in the new history column
        row[newColumnName] = '✓';
        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to send to ${to_email}: ${error.message}`);
        // Mark as failed in the new history column
        row[newColumnName] = '✗';
      }
    }

    // Write updated rows back to CSV (with new history column, but Status unchanged)
    if (validRows.length > 0) {
      // Get all fieldnames, including the new history column
      const allFieldnames = new Set<string>();
      validRows.forEach((row: any) => {
        Object.keys(row).forEach(key => allFieldnames.add(key));
      });
      
      // Ensure the new column is included
      allFieldnames.add(newColumnName);
      
      // Sort columns: keep original columns first, then history columns
      const originalColumns = ['Company', 'Contact Email', 'Target Role', 'Status'];
      const historyColumns = Array.from(allFieldnames)
        .filter(col => !originalColumns.includes(col))
        .sort(); // Sort history columns chronologically
      
      const fieldnames = [
        ...originalColumns.filter(col => allFieldnames.has(col)),
        ...historyColumns
      ];
      
      const csvLines = [
        fieldnames.join(','),
        ...validRows.map((row: any) =>
          fieldnames.map((field) => {
            const value = row[field] || '';
            // Escape commas and quotes in CSV values
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        ),
      ];

      // Write with BOM for Excel compatibility
      const BOM = '\uFEFF';
      fs.writeFileSync(csvPath, BOM + csvLines.join('\n'), 'utf8');
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingRows.length} pending emails`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
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
