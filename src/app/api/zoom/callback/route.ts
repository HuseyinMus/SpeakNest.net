import { NextResponse } from 'next/server';

// Statik dışa aktarım için gerekli yapılandırma
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Zoom API bilgileri
const ZOOM_CLIENT_ID = 'j4qbt1vUQOCJpmwWwaDt8g';
const ZOOM_CLIENT_SECRET = 'SmfLM35kaHUsKDJZWQbXor7j0kt90gUU';

// OAuth callback işleme
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const challenge = searchParams.get('challenge');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');
    
    // Mevcut URL'den origin bilgisini al
    const origin = new URL(request.url).origin;

    console.log('Gelen parametreler:', { code, challenge, error, error_description });
    console.log('Request origin:', origin);

    // Eğer error varsa, hata döndür
    if (error) {
      console.error('OAuth hatası:', { error, error_description });
      throw new Error(`OAuth hatası: ${error_description || error}`);
    }

    // Eğer challenge varsa, webhook doğrulama isteği
    if (challenge) {
      console.log('Challenge isteği alındı:', challenge);
      return new NextResponse(challenge, {
        headers: { 'Content-Type': 'text/plain' },
        status: 200
      });
    }

    // Eğer code yoksa hata döndür
    if (!code) {
      console.error('Authorization code bulunamadı');
      throw new Error('Authorization code bulunamadı');
    }

    console.log('Token almaya çalışılıyor...');
    console.log('Client ID:', ZOOM_CLIENT_ID);
    console.log('Redirect URI:', `${origin}/api/zoom/callback`);

    // Token al
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${origin}/api/zoom/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token alma hatası:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });
      throw new Error(`Token alınamadı: ${JSON.stringify(errorData)}`);
    }

    await tokenResponse.json();
    console.log('Token başarıyla alındı');

    // Başarılı yönlendirme
    return NextResponse.redirect(new URL('/prouser-panel', request.url));

  } catch (error: unknown) {
    console.error('OAuth callback detaylı hata:', {
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    });
    // Hata durumunda ana sayfaya yönlendir
    return NextResponse.redirect(new URL(`/?error=oauth_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Bilinmeyen hata')})`, request.url));
  }
}

// Webhook işleme
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Zoom webhook alındı:', body);

    // Webhook türüne göre işlem yap
    switch (body.event) {
      case 'meeting.started':
        // Toplantı başladığında
        console.log('Toplantı başladı:', body.payload.object);
        break;
        
      case 'meeting.ended':
        // Toplantı bittiğinde
        console.log('Toplantı bitti:', body.payload.object);
        break;
        
      case 'meeting.participant_joined':
        // Katılımcı katıldığında
        console.log('Katılımcı katıldı:', body.payload.object);
        break;
        
      case 'meeting.participant_left':
        // Katılımcı ayrıldığında
        console.log('Katılımcı ayrıldı:', body.payload.object);
        break;
        
      default:
        console.log('Bilinmeyen webhook eventi:', body.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook işleme hatası:', error);
    return NextResponse.json(
      { error: 'Webhook işlenirken hata oluştu' },
      { status: 500 }
    );
  }
} 