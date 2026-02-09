import { NextRequest, NextResponse } from 'next/server';
import { startEmailCron } from '@/lib/cron';
import cron from 'node-cron';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Use env variable or provided schedule, default to every 3 days at 8 AM
    const defaultSchedule = process.env.CRON_SCHEDULE || '0 8 */3 * *';
    const schedule = body.schedule || defaultSchedule;

    // Validate cron schedule format
    if (!cron.validate(schedule)) {
      return NextResponse.json(
        { error: 'Invalid cron schedule format' },
        { status: 400 }
      );
    }

    const job = startEmailCron(schedule);
    
    return NextResponse.json({
      success: true,
      message: 'Cron job started',
      schedule: schedule,
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
