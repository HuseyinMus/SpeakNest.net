'use client';

import { useState } from 'react';
import { ZoomMeeting } from '@/components/ZoomMeeting';

export default function ZoomTestPage() {
  const [meetingData, setMeetingData] = useState<{
    joinUrl: string;
    meetingId: string;
  } | null>(null);

  const createMeeting = async () => {
    try {
      const response = await fetch('/api/zoom/test');
      const data = await response.json();
      
      if (data.status === 'success') {
        setMeetingData(data.data);
      } else {
        console.error('Toplantı oluşturma hatası:', data.message);
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Zoom Test Sayfası</h1>
      
      {!meetingData ? (
        <button
          onClick={createMeeting}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Yeni Toplantı Oluştur
        </button>
      ) : (
        <ZoomMeeting
          meetingNumber={meetingData.meetingId}
          joinUrl={meetingData.joinUrl}
          userName="Test Kullanıcı"
          userEmail="test@example.com"
        />
      )}
    </div>
  );
} 