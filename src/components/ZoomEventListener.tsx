'use client';

import React, { useEffect, useState } from 'react';
import ZoomWebSocketService from '@/lib/services/ZoomWebSocketService';
import { useToast } from '@/lib/context/ToastContext';

interface ZoomEventListenerProps {
  children?: React.ReactNode;
}

/**
 * Zoom WebSocket olaylarını dinleyen ve toplantı olaylarını işleyen bileşen
 */
const ZoomEventListener: React.FC<ZoomEventListenerProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { showToast } = useToast();
  const zoomWs = ZoomWebSocketService.getInstance();

  useEffect(() => {
    // Zoom WebSocket bağlantısını kur
    const connectToZoom = async () => {
      try {
        const connected = await zoomWs.connect();
        setIsConnected(connected);
        
        if (connected) {
          console.log('Zoom WebSocket bağlantısı başarılı!');
        }
      } catch (error) {
        console.error('Zoom WebSocket bağlantı hatası:', error);
      }
    };

    connectToZoom();

    // Olayları dinle
    zoomWs.on('meeting.started', (data: any) => {
      console.log('Toplantı başladı:', data);
      showToast({
        title: 'Toplantı Başladı',
        message: `"${data.payload.object.topic}" toplantısı başladı.`,
        type: 'success',
      });
    });

    zoomWs.on('meeting.ended', (data: any) => {
      console.log('Toplantı sona erdi:', data);
      showToast({
        title: 'Toplantı Sona Erdi',
        message: `"${data.payload.object.topic}" toplantısı sona erdi.`,
        type: 'info',
      });
    });

    zoomWs.on('meeting.participant_joined', (data: any) => {
      console.log('Katılımcı katıldı:', data);
      const participant = data.payload.object.participant;
      showToast({
        title: 'Yeni Katılımcı',
        message: `${participant.user_name} toplantıya katıldı.`,
        type: 'success',
      });
    });

    zoomWs.on('meeting.participant_left', (data: any) => {
      console.log('Katılımcı ayrıldı:', data);
      const participant = data.payload.object.participant;
      showToast({
        title: 'Katılımcı Ayrıldı',
        message: `${participant.user_name} toplantıdan ayrıldı.`,
        type: 'info',
      });
    });

    // Tüm olayları loglama
    zoomWs.on('all', (data: any) => {
      console.log('Zoom olayı alındı:', data);
    });

    // Cleanup
    return () => {
      zoomWs.off('meeting.started');
      zoomWs.off('meeting.ended');
      zoomWs.off('meeting.participant_joined');
      zoomWs.off('meeting.participant_left');
      zoomWs.off('all');
      zoomWs.disconnect();
    };
  }, []);

  // Bu bileşen görsel bir çıktı üretmiyor, sadece olayları dinliyor
  return <>{children}</>;
};

export default ZoomEventListener; 