import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function POST(request: NextRequest) {
  try {
    const { rowIndex, newStatus } = await request.json();

    if (rowIndex === undefined || !newStatus) {
      return NextResponse.json(
        { error: 'Missing rowIndex or newStatus' },
        { status: 400 }
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

    // Filter out completely empty rows
    const validRows = rows.filter((row: any) => 
      Object.values(row).some((val: any) => val && val.toString().trim())
    );

    // Validate row index
    if (rowIndex < 0 || rowIndex >= validRows.length) {
      return NextResponse.json(
        { error: 'Invalid row index' },
        { status: 400 }
      );
    }

    // Update status
    validRows[rowIndex].Status = newStatus;

    // Get all fieldnames
    const allFieldnames = new Set<string>();
    validRows.forEach((row: any) => {
      Object.keys(row).forEach(key => allFieldnames.add(key));
    });

    // Sort columns: keep original columns first, then history columns
    const originalColumns = ['Company', 'Contact Email', 'Target Role', 'Status'];
    const historyColumns = Array.from(allFieldnames)
      .filter(col => !originalColumns.includes(col))
      .sort();
    
    const fieldnames = [
      ...originalColumns.filter(col => allFieldnames.has(col)),
      ...historyColumns
    ];

    // Write back to CSV
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

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
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
