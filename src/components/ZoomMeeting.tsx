import React from 'react';
import { ZoomClientService } from '@/lib/services/ZoomClientService';

interface ZoomMeetingProps {
  meetingNumber: string;
  joinUrl: string;
  userName?: string;
  userEmail?: string;
}

export const ZoomMeeting: React.FC<ZoomMeetingProps> = ({
  meetingNumber,
  joinUrl,
  userName = 'Misafir',
  userEmail = 'misafir@example.com'
}) => {
  const handleJoinMeeting = () => {
    // Toplantı URL'sini yeni sekmede aç
    window.open(joinUrl, '_blank');
  };

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Zoom Toplantısı</h2>
      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Toplantı ID:</span> {meetingNumber}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Katılımcı:</span> {userName}
        </p>
        <button
          onClick={handleJoinMeeting}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Toplantıya Katıl
        </button>
      </div>
    </div>
  );
}; 