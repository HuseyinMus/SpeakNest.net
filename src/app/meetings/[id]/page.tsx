'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// import ChatBox from '@/components/ChatBox';
import { useAuth } from '@/lib/hooks/useAuth';
// import SocketService from '@/lib/services/SocketService';
import { ZoomService } from '@/lib/services/ZoomService';

export default function MeetingPage() {
  const { id } = useParams();
  const meetingId = Array.isArray(id) ? id[0] : id;
  const { user, loading } = useAuth();
  const [meetingData, setMeetingData] = useState<any>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<{ userId: string; userName: string }[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    async function fetchMeetingData() {
      if (!meetingId) return;
      
      try {
        setLoadingMeeting(true);
        const meetingInfo = await ZoomService.getMeeting(meetingId);
        setMeetingData(meetingInfo);
      } catch (err: any) {
        console.error('Toplantı bilgileri alınırken hata oluştu:', err);
        setError(err.message || 'Toplantı bilgileri alınamadı');
      } finally {
        setLoadingMeeting(false);
      }
    }

    fetchMeetingData();
  }, [meetingId]);

  // WebSocket fonksiyonlarını devre dışı bırak
  /* 
  useEffect(() => {
    if (!user || !meetingId) return;
    
    const socketService = SocketService.getInstance();
    
    async function setupSocketListeners() {
      try {
        await socketService.connect(user.uid, user.displayName || 'İsimsiz Kullanıcı');
        socketService.joinRoom(meetingId, user.uid, user.displayName || 'İsimsiz Kullanıcı');
        
        socketService.on('userJoined', (data: any) => {
          setParticipants(prev => {
            if (prev.some(p => p.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, userName: data.userName }];
          });
        });
        
        socketService.on('userLeft', (data: any) => {
          setParticipants(prev => 
            prev.filter(p => p.userId !== data.userId)
          );
        });
      } catch (error) {
        console.error('Socket bağlantı hatası:', error);
      }
    }
    
    setupSocketListeners();
    
    return () => {
      socketService.leaveRoom(meetingId, user.uid, user.displayName || 'İsimsiz Kullanıcı');
      socketService.off('userJoined');
      socketService.off('userLeft');
    };
  }, [user, meetingId]);
  */

  if (loading || loadingMeeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Hata: {error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Bu sayfayı görüntülemek için giriş yapmalısınız.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-3/4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-4">{meetingData?.topic || 'Toplantı'}</h1>
            
            {meetingData?.join_url && (
              <div className="mb-6">
                <a 
                  href={meetingData.join_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Zoom Toplantısına Katıl
                </a>
              </div>
            )}
            
            <div className="border-t pt-4 mt-4">
              <h2 className="text-xl font-semibold mb-3">Toplantı Bilgileri</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Toplantı ID:</span> {meetingData?.id}</p>
                <p><span className="font-medium">Başlangıç:</span> {new Date(meetingData?.start_time).toLocaleString()}</p>
                <p><span className="font-medium">Süre:</span> {meetingData?.duration} dakika</p>
                {meetingData?.agenda && (
                  <p><span className="font-medium">Açıklama:</span> {meetingData.agenda}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/4 space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Katılımcılar</h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {participants.length} kişi
              </span>
            </div>
            
            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-sm">Henüz katılımcı yok</p>
              ) : (
                participants.map((participant) => (
                  <div key={participant.userId} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                      {participant.userName.charAt(0).toUpperCase()}
                    </div>
                    <span>{participant.userName}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Sohbet kısmını devre dışı bırak */}
          {/*
          <div>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)} 
              className="w-full mb-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
            >
              {isChatOpen ? 'Sohbeti Gizle' : 'Sohbeti Göster'}
            </button>
            {isChatOpen && <ChatBox roomId={meetingId} />}
          </div>
          */}
        </div>
      </div>
    </div>
  );
} 