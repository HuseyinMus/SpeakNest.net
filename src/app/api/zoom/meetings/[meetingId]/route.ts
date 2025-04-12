import { NextResponse } from 'next/server';

// Dynamic API route yapılandırması
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const meetingId = params.meetingId;
    
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID gerekli' }, { status: 400 });
    }
    
    // Token al
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: process.env.NEXT_PUBLIC_ZOOM_ACCOUNT_ID || '',
        client_id: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID || '',
        client_secret: process.env.NEXT_PUBLIC_ZOOM_CLIENT_SECRET || '',
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.json();
      throw new Error(`Token alınamadı: ${JSON.stringify(tokenError)}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token alındı');

    // Toplantı bilgilerini getir
    const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!meetingResponse.ok) {
      const errorData = await meetingResponse.json();
      throw new Error(`Toplantı bilgileri alınamadı: ${JSON.stringify(errorData)}`);
    }

    const meetingData = await meetingResponse.json();
    
    return NextResponse.json(meetingData);
  } catch (error: any) {
    console.error('Toplantı bilgileri alma hatası:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Toplantı bilgileri alınamadı',
        details: error.stack 
      },
      { status: 500 }
    );
  }
} 