'use client';

import { useState } from 'react';
import { Meeting } from '../hooks/useMeetings';
import MeetingCard from './MeetingCard';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';

interface MeetingListProps {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onJoinMeeting: (meetingId: string) => void;
  onEditMeeting: (meeting: Meeting) => void;
}

export default function MeetingList({
  meetings,
  loading,
  error,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onJoinMeeting,
  onEditMeeting
}: MeetingListProps) {
  const { t } = useLanguage();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Toplantıya katılma işlemi
  const handleJoinMeeting = async (meetingId: string) => {
    setJoiningId(meetingId);
    setIsJoining(true);
    
    try {
      await onJoinMeeting(meetingId);
    } finally {
      setIsJoining(false);
      setJoiningId(null);
    }
  };

  // Toplantı düzenleme işlemi
  const handleEditMeeting = (meeting: Meeting) => {
    onEditMeeting(meeting);
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && meetings.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded-lg text-center">
        <p className="text-lg">{t('noMeetingsFound', 'Hiç toplantı bulunamadı')}</p>
        <p className="text-sm text-gray-500 mt-2">
          {t('tryCreatingAMeeting', 'Yeni bir toplantı oluşturmayı deneyin.')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onJoinMeeting={handleJoinMeeting}
            onEditMeeting={handleEditMeeting}
            isJoining={isJoining}
            joiningId={joiningId}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('loading', 'Yükleniyor...')}
              </span>
            ) : (
              t('loadMore', 'Daha Fazla Yükle')
            )}
          </button>
        </div>
      )}
    </div>
  );
} 