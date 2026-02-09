import { NextResponse } from 'next/server';
import { stopEmailCron } from '@/lib/cron';

export async function POST() {
  try {
    stopEmailCron();
    
    return NextResponse.json({
      success: true,
      message: 'Cron job stopped',
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
