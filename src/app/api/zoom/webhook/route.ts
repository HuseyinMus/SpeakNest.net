import { NextResponse } from 'next/server';

// Force dynamic API route for webhook
export const dynamic = 'force-dynamic';

// DEBUG mode - console.log eklemeleri için
const DEBUG = true;

export async function GET(request: Request) {
  try {
    // URL parametrelerini al
    const url = new URL(request.url);
    const challenge = url.searchParams.get('challenge');

    if (DEBUG) {
      console.log('[DEBUG] Webhook GET request url:', request.url);
      console.log('[DEBUG] Webhook challenge value:', challenge);
    }

    // Challenge varsa sadece düz metin olarak döndür
    if (challenge) {
      if (DEBUG) console.log('[DEBUG] Returning challenge as plain text:', challenge);
      
      // Düz metin olarak challenge değerini döndür - content-type önemli
      return new Response(challenge, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Normal durum - JSON yanıt
    return NextResponse.json({ message: 'Zoom Webhook Endpoint' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Zoom webhook event received:', body.event);
    
    // Webhook olayına göre işlem yap
    switch (body.event) {
      case 'meeting.started':
      case 'meeting.ended':
      case 'meeting.participant_joined':
      case 'meeting.participant_left':
        console.log(`${body.event} event:`, body.payload.object);
        break;
      default:
        console.log('Unknown webhook event:', body.event);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 