import { NextResponse } from 'next/server';

// Dynamic API route yapılandırması
export const runtime = 'nodejs';

// Zoom OAuth credentials - Sadece ortam değişkenlerinden okuma
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID || '';
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET || '';
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID || '';

// Zoom OAuth token alma fonksiyonu
async function getZoomAccessToken(): Promise<string> {
  try {
    console.log('Zoom OAuth token alınıyor...');
    
    // Kimlik bilgileri kontrolü
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      throw new Error('Zoom API kimlik bilgileri eksik. Lütfen ortam değişkenlerini kontrol edin.');
    }
    
    // Tam URL'yi logla
    const url = 'https://zoom.us/oauth/token';
    console.log('Token isteği URL:', url);
    
    // URL encoded form data hazırla
    const formData = new URLSearchParams({
      'grant_type': 'account_credentials',
      'account_id': ZOOM_ACCOUNT_ID
    });
    
    console.log('Token isteği parametreleri:', formData.toString());
    
    // Token isteği yap
    const tokenResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
      },
      body: formData.toString()
    });
    
    console.log('Token yanıt durumu:', tokenResponse.status);
    
    // Yanıt metnini al
    const responseText = await tokenResponse.text();
    
    // Hassas bilgileri maskeleyerek logla
    if (responseText.includes('access_token')) {
      console.log('Token yanıt metni: [Hassas bilgiler - loglanmadı]');
    } else {
      console.log('Token yanıt metni:', responseText);
    }
    
    if (!tokenResponse.ok) {
      console.error('Zoom token alınamadı, status:', tokenResponse.status);
      throw new Error(`Token alınamadı: ${tokenResponse.status} - ${responseText}`);
    }
    
    // JSON'a dönüştür
    const tokenData = JSON.parse(responseText);
    console.log('Token bilgileri alındı, expires_in:', tokenData.expires_in);
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Token alma hatası:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    console.log('Zoom toplantı oluşturma isteği alındı');
    
    const requestBody = await request.json();
    console.log('İstek gövdesi:', JSON.stringify(requestBody));
    
    const { title, description, startTime, duration = 60 } = requestBody;

    if (!title || !startTime) {
      console.log('Eksik parametre:', { title, startTime });
      return NextResponse.json(
        { error: 'Başlık ve başlangıç zamanı gerekli' },
        { status: 400 }
      );
    }
    
    // OAuth 2.0 ile token alınıyor
    const accessToken = await getZoomAccessToken();

    // Zoom API'ye gönderilecek veri
    const zoomMeetingData = {
      topic: title,
      type: 2, // Scheduled meeting
      start_time: new Date(startTime).toISOString(),
      duration: duration,
      timezone: 'Europe/Istanbul',
      agenda: description || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        waiting_room: false,
        auto_recording: 'none',
      }
    };
    
    console.log('Zoom API\'ye gönderilecek veri:', JSON.stringify(zoomMeetingData));

    // Zoom API'ye istek at
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(zoomMeetingData),
    });
    
    console.log('Zoom API yanıt status:', response.status);

    // Yanıt başarılı değilse
    if (!response.ok) {
      let errorMessage = `HTTP Hata: ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('Zoom API hata yanıtı:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        console.error('Hata yanıtı JSON olarak ayrıştırılamadı:', jsonError);
      }
      
      return NextResponse.json(
        { error: `Toplantı oluşturulamadı: ${errorMessage}` },
        { status: response.status }
      );
    }

    // Yanıt başarılıysa
    try {
      const meetingData = await response.json();
      console.log('Zoom API başarılı yanıt:', meetingData);
      
      return NextResponse.json({
        id: meetingData.id,
        join_url: meetingData.join_url,
        start_url: meetingData.start_url,
        password: meetingData.password,
      });
    } catch (jsonError) {
      console.error('Başarılı yanıt JSON olarak ayrıştırılamadı:', jsonError);
      return NextResponse.json(
        { error: 'Toplantı yanıtı işlenirken hata oluştu' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Genel hata:', error);
    return NextResponse.json(
      { error: `Toplantı oluşturulurken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');
    console.log('Toplantı bilgisi istendi, ID:', meetingId);

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID gerekli' },
        { status: 400 }
      );
    }

    // OAuth 2.0 ile token alınıyor
    const accessToken = await getZoomAccessToken();

    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    console.log('Zoom API yanıt status:', response.status);

    if (!response.ok) {
      let errorMessage = `HTTP Hata: ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('Zoom API hata yanıtı:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        console.error('Hata yanıtı JSON olarak ayrıştırılamadı:', jsonError);
      }
      
      return NextResponse.json(
        { error: `Toplantı bilgileri alınamadı: ${errorMessage}` },
        { status: response.status }
      );
    }

    try {
      const meetingData = await response.json();
      console.log('Zoom API başarılı yanıt:', meetingData);
      return NextResponse.json(meetingData);
    } catch (jsonError) {
      console.error('Başarılı yanıt JSON olarak ayrıştırılamadı:', jsonError);
      return NextResponse.json(
        { error: 'Toplantı bilgisi yanıtı işlenirken hata oluştu' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Genel hata:', error);
    return NextResponse.json(
      { error: `Toplantı bilgileri alınırken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` },
      { status: 500 }
    );
  }
} 