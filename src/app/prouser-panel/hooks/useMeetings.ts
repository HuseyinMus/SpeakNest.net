'use client';

import { useState, useEffect, useRef } from 'react';
import { where, orderBy, limit, DocumentSnapshot } from 'firebase/firestore';
import { dataService } from '@/lib/services/DataService';
import { useAuth } from '@/lib/context/AuthContext';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  level: string;
  topic: string;
  participantCount: number;
  status: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  meetUrl?: string;
  zoomMeetingId?: string;
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface MeetingsState {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  lastDoc: DocumentSnapshot | null;
}

export function useMeetings(initialPageSize = 10) {
  const { currentUser } = useAuth();
  const [state, setState] = useState<MeetingsState>({
    meetings: [],
    loading: true,
    error: null,
    hasMore: true,
    isLoadingMore: false,
    lastDoc: null
  });
  
  // Temizlik için ref kullan
  const isComponentMounted = useRef(true);
  
  // Toplantıları getir
  const fetchMeetings = async (isLoadMore = false) => {
    if (!currentUser?.uid) return;
    
    try {
      if (isLoadMore) {
        setState(prev => ({ ...prev, isLoadingMore: true }));
      } else {
        setState(prev => ({ ...prev, loading: true }));
      }
      
      const constraints = [
        where('hostId', '==', currentUser.uid),
        where('status', '==', 'active'),
        orderBy('startTime', 'asc'),
      ];
      
      const result = await dataService.getPaginatedDocuments<Meeting>(
        'meetings',
        initialPageSize,
        isLoadMore ? state.lastDoc : null,
        constraints
      );
      
      // Tarih dönüşümü
      const processedMeetings = result.data.map(meeting => ({
        ...meeting,
        startTime: meeting.startTime instanceof Date 
          ? meeting.startTime 
          : new Date(meeting.startTime)
      }));
      
      if (!isComponentMounted.current) return;
      
      setState(prev => ({
        meetings: isLoadMore 
          ? [...prev.meetings, ...processedMeetings] 
          : processedMeetings,
        loading: false,
        isLoadingMore: false,
        error: null,
        hasMore: result.hasMore,
        lastDoc: result.lastDoc
      }));
    } catch (error) {
      console.error('Toplantı verileri alınamadı:', error);
      
      if (!isComponentMounted.current) return;
      
      setState(prev => ({
        ...prev,
        loading: false,
        isLoadingMore: false,
        error: 'Toplantı verileri alınırken bir hata oluştu.'
      }));
    }
  };
  
  // Daha fazla yükle
  const loadMore = () => {
    if (state.hasMore && !state.isLoadingMore) {
      fetchMeetings(true);
    }
  };
  
  // Yenile
  const refresh = () => {
    setState(prev => ({
      ...prev,
      lastDoc: null,
      hasMore: true
    }));
    fetchMeetings(false);
  };
  
  // Kullanıcı değiştiğinde toplantıları getir
  useEffect(() => {
    if (currentUser?.uid) {
      fetchMeetings();
    }
    
    return () => {
      isComponentMounted.current = false;
    };
  }, [currentUser?.uid]);
  
  return {
    ...state,
    loadMore,
    refresh
  };
} 