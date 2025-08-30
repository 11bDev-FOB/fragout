import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - you can add more sophisticated checks here
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      error: 'Health check failed'
    }, { status: 500 });
  }
}
