import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET() {
  try {
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

    // Filter out completely empty rows
    const validRows = rows.filter((row: any) => 
      Object.values(row).some((val: any) => val && val.toString().trim())
    );

    return NextResponse.json({
      success: true,
      data: validRows,
      totalRows: validRows.length,
      pendingCount: validRows.filter((row: any) => row.Status?.trim() === 'Pending').length,
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
