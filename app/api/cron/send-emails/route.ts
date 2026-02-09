import { NextRequest, NextResponse } from 'next/server';
// Import to ensure cron is initialized
import '@/lib/cron-init';

// This endpoint can be called by external cron services
// For Vercel: Use Vercel Cron Jobs (configured in vercel.json)
// For other platforms: Use their cron service to call this endpoint
// The cron job also auto-starts on server initialization

export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended for external cron services)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Only require auth if CRON_SECRET is set (for external cron services)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Call the send-emails API internally
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/send-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed',
      result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
