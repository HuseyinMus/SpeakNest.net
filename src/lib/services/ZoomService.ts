// JWT işlemleri kaldırıldı - server-side'da yapılacak
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://speak-nest-app.vercel.app';
const API_PATH = '/api/zoom';

// URL oluşturma yardımcı fonksiyonu
function createApiUrl(path: string): string {
  // URL sınıfı kullanmadan string birleştirme ile URL oluştur
  // URL sınıfı client-side'da bazen sorunlara neden olabilir
  // BASE_URL sonunda / olup olmadığını kontrol et
  const baseWithSlash = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  // API_PATH başında / olup olmadığını kontrol et
  const apiPath = API_PATH.startsWith('/') ? API_PATH.substring(1) : API_PATH;
  // path başında / olup olmadığını kontrol et
  const pathWithoutSlash = path.startsWith('/') ? path.substring(1) : path;
  
  // URL'yi oluştur
  return `${baseWithSlash}${apiPath}/${pathWithoutSlash}`;
}

export class ZoomService {
  /**
   * Zoom toplantısı oluşturur
   */
  static async createMeeting(params: {
    title: string;
    description?: string;
    startTime: Date | string;
    duration?: number;
  }): Promise<ZoomMeetingResponse> {
    try {
      // Güvenli URL oluşturma fonksiyonunu kullan
      const apiUrl = createApiUrl('meetings');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Zoom toplantısı oluşturulamadı: ${error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Zoom toplantısı oluşturma hatası:', error);
      throw error;
    }
  }

  /**
   * Zoom toplantı bilgilerini getirir
   */
  static async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
    if (!meetingId) {
      throw new Error('Meeting ID gerekli');
    }

    try {
      // Güvenli URL oluşturma fonksiyonunu kullan
      const apiUrl = createApiUrl(`meetings/${meetingId}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Toplantı bilgisi alınamadı: ${error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Toplantı bilgisi alma hatası:', error);
      throw error;
    }
  }
}

// Zoom toplantı yanıt tipi
interface ZoomMeetingResponse {
  id?: string;
  topic?: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
  agenda?: string;
  join_url?: string;
  // Diğer olası alanlar için spesifik tip tanımları
  host_email?: string;
  status?: string;
  type?: number;
  start_url?: string;
  password?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
    [key: string]: boolean | string | number | undefined;
  };
} 