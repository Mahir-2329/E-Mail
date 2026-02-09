import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { id, newStatus } = await request.json();

    if (!id || !newStatus) {
      return NextResponse.json(
        { error: 'Missing id or newStatus' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query(
        'UPDATE recipients SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStatus, id]
      );

      return NextResponse.json({
        success: true,
        message: 'Status updated successfully',
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
