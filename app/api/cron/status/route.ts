import { NextResponse } from 'next/server';
import { getCronStatus } from '@/lib/cron';
import { getIntervalCronStatus } from '@/lib/cron-interval';

export async function GET() {
  try {
    // Check which mode is active
    const useInterval = process.env.CRON_INTERVAL_MODE === 'true';
    
    if (useInterval) {
      const intervalStatus = getIntervalCronStatus();
      return NextResponse.json({
        success: true,
        isRunning: intervalStatus.isRunning,
        autoStart: true, // Always auto-starts on server
        mode: 'interval',
        lastRun: intervalStatus.lastRun,
        schedule: `Every ${process.env.CRON_INTERVAL_DAYS || 3} days at ${process.env.CRON_HOUR || 8}:${String(process.env.CRON_MINUTE || 0).padStart(2, '0')}`,
      });
    } else {
      const status = getCronStatus();
      return NextResponse.json({
        success: true,
        ...status,
        autoStart: true, // Always auto-starts on server
        mode: 'standard',
      });
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
