import { NextRequest, NextResponse } from 'next/server';

/**
 * Suno API Callback Handler
 * Receives notifications when music generation is complete
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Suno Callback] Received:', JSON.stringify(body, null, 2));

    // The callback data contains the completed tracks
    // We can use this to update the generation status in real-time
    // For now, we just log it since we're polling for status anyway

    return NextResponse.json({
      success: true,
      message: 'Callback received',
    });
  } catch (error) {
    console.error('[Suno Callback] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

// Also handle GET for verification if needed
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Suno callback endpoint is active',
  });
}
