import { NextResponse } from 'next/server';

// Statik dışa aktarım için gerekli yapılandırma
export const dynamic = 'force-static';
export const revalidate = false;

export async function POST() {
  try {
    console.log('Token isteği başlatılıyor...');
    
    const response = await fetch('https://zoom.us/oauth/token', {
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

    console.log('Token yanıt durumu:', response.status);
    const responseData = await response.json();
    console.log('Token yanıt verisi:', responseData);

    if (!response.ok) {
      throw new Error(`Token alınamadı: ${JSON.stringify(responseData)}`);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Token alma detaylı hata:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return NextResponse.json(
      { 
        error: error.message || 'Bir hata oluştu',
        details: error.stack
      },
      { status: 500 }
    );
  }
} 