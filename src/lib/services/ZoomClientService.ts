import { ZoomMtg } from '@zoomus/websdk';

export class ZoomClientService {
  /**
   * Zoom toplantısına katılma
   */
  static async joinMeeting(
    signature: string,
    meetingNumber: string,
    userName: string,
    userEmail: string,
    password: string = ''
  ): Promise<void> {
    // Bu fonksiyon sadece tarayıcıda çalışır
    if (typeof window === 'undefined') {
      throw new Error('Bu fonksiyon sadece tarayıcıda çalışır');
    }

    try {
      // Zoom SDK'yı başlat
      ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.2/lib', '/av');
      await ZoomMtg.preLoadWasm();
      await ZoomMtg.prepareWebSDK();

      // Zoom toplantısına katıl
      ZoomMtg.init({
        leaveUrl: window.location.origin,
        success: () => {
          ZoomMtg.join({
            signature: signature,
            meetingNumber: meetingNumber,
            userName: userName,
            userEmail: userEmail,
            passWord: password,
            sdkKey: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
          });
        },
        error: (error: any) => {
          console.error('Zoom başlatma hatası:', error);
          throw error;
        },
      });
    } catch (error) {
      console.error('Zoom toplantısına katılma hatası:', error);
      throw error;
    }
  }
} 