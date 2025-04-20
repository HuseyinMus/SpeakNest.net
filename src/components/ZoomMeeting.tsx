import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { zoomService } from '@/lib/services/ZoomService';

interface ZoomMeetingProps {
  meetingId: string;
  userName: string;
  userEmail: string;
  isHost?: boolean;
  onMeetingEnd?: () => void;
}

export default function ZoomMeeting({
  meetingId,
  userName,
  userEmail,
  isHost = false,
  onMeetingEnd,
}: ZoomMeetingProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const zoomClientRef = useRef<any>(null);

  useEffect(() => {
    const initializeZoom = async () => {
      try {
        // Zoom SDK'yı dinamik olarak yükle
        const { ZoomMtg } = await import('@zoomus/websdk');
        zoomClientRef.current = ZoomMtg;

        // Zoom SDK yapılandırması
        ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.2/lib', '/av');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        // Toplantı bilgilerini al
        const meetingInfo = await zoomService.getMeeting(meetingId);
        
        // Toplantı parametrelerini hazırla
        const meetingConfig = {
          sdkKey: process.env.NEXT_PUBLIC_ZOOM_SDK_KEY,
          sdkSecret: process.env.NEXT_PUBLIC_ZOOM_SDK_SECRET,
          meetingNumber: meetingId,
          userName,
          userEmail,
          passWord: meetingInfo.password || '',
          leaveUrl: window.location.origin,
          role: isHost ? 1 : 0, // 1: Host, 0: Participant
        };

        // Toplantıyı başlat
        await ZoomMtg.init({
          leaveUrl: meetingConfig.leaveUrl,
          success: () => {
            ZoomMtg.join({
              ...meetingConfig,
              signature: generateSignature(meetingConfig),
              success: () => {
                setIsLoading(false);
                toast.success(t('meetingJoined', 'Toplantıya başarıyla katıldınız'));
              },
              error: (err: any) => {
                setError(t('meetingJoinError', 'Toplantıya katılırken bir hata oluştu'));
                console.error('Zoom join error:', err);
              },
            });
          },
          error: (err: any) => {
            setError(t('meetingInitError', 'Toplantı başlatılırken bir hata oluştu'));
            console.error('Zoom init error:', err);
          },
        });
      } catch (err) {
        setError(t('meetingError', 'Toplantı sırasında bir hata oluştu'));
        console.error('Zoom error:', err);
      }
    };

    initializeZoom();

    return () => {
      // Toplantıdan ayrıl
      if (zoomClientRef.current) {
        zoomClientRef.current.leaveMeeting();
      }
    };
  }, [meetingId, userName, userEmail, isHost, t, toast]);

  // Zoom imzası oluştur
  const generateSignature = (meetingConfig: any) => {
    const { ZoomMtg } = zoomClientRef.current;
    return ZoomMtg.generateSignature({
      meetingNumber: meetingConfig.meetingNumber,
      role: meetingConfig.role,
      sdkKey: meetingConfig.sdkKey,
      sdkSecret: meetingConfig.sdkSecret,
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t('retry', 'Tekrar Dene')}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <div className="text-gray-600">{t('loadingMeeting', 'Toplantı yükleniyor...')}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div
        ref={meetingContainerRef}
        id="zoom-meeting-container"
        className="w-full h-full min-h-[600px] bg-gray-100 rounded-lg"
      />
    </div>
  );
} 