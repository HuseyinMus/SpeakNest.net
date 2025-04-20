'use client';

import { useState } from 'react';
import { Clock, Users, Calendar, Edit, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Meeting } from '../hooks/useMeetings';

interface MeetingCardProps {
  meeting: Meeting;
  onEditMeeting: (meeting: Meeting) => void;
  onJoinMeeting: (meetingId: string) => void;
}

export default function MeetingCard({ 
  meeting, 
  onEditMeeting, 
  onJoinMeeting 
}: MeetingCardProps) {
  const { t } = useLanguage();
  const [isJoining, setIsJoining] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Toplantı başlama zamanı
  const startDate = meeting.startTime ? new Date(meeting.startTime) : new Date();
  const formattedStartDate = formatDate(startDate);

  // Katılım işlemi
  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await onJoinMeeting(meeting.id);
    } catch (error) {
      console.error('Error joining meeting:', error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="px-6 py-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{meeting.title}</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => onEditMeeting(meeting)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
              aria-label={t('edit', 'Düzenle')}
            >
              <Edit size={16} />
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {meeting.description || t('noDescription', 'Açıklama bulunmuyor')}
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-xs text-gray-600">
            <Calendar size={14} className="mr-1.5 text-gray-400" />
            <span>{formattedStartDate}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <Clock size={14} className="mr-1.5 text-gray-400" />
            <span>{meeting.duration} {t('minutes', 'dakika')}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <Users size={14} className="mr-1.5 text-gray-400" />
            <span>
              {meeting.participantCount || 0} / {meeting.maxParticipants || '-'}
            </span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600 capitalize">
            <span>{meeting.status || 'active'}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 flex justify-end">
        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isJoining ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {t('joining', 'Katılınıyor...')}
            </>
          ) : (
            <>
              <ExternalLink size={14} className="mr-1.5" />
              {t('joinMeeting', 'Toplantıya Katıl')}
            </>
          )}
        </button>
      </div>
    </div>
  );
} 