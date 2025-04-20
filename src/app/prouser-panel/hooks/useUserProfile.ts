'use client';

import { useState, useEffect } from 'react';
import { dataService } from '@/lib/services/DataService';
import { useAuth } from '@/lib/context/AuthContext';

export interface UserProfile {
  id: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  role?: string;
  email?: string;
  createdAt?: any;
  updatedAt?: any;
}

export function useUserProfile(userId?: string) {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const targetUserId = userId || currentUser?.uid;
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserProfile = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const userData = await dataService.getDocument<UserProfile>('users', targetUserId);
        
        if (isMounted) {
          setProfile(userData ? { ...userData, id: targetUserId } : null);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Kullanıcı profili alınamadı:', err);
        
        if (isMounted) {
          setLoading(false);
          setError('Kullanıcı profili alınamadı');
        }
      }
    };
    
    fetchUserProfile();
    
    return () => {
      isMounted = false;
    };
  }, [targetUserId]);
  
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!targetUserId) {
      throw new Error('Güncellenecek kullanıcı ID bulunamadı');
    }
    
    try {
      await dataService.setDocument<UserProfile>('users', targetUserId, data);
      
      // Yerel durumu güncelle
      setProfile(prev => prev ? { ...prev, ...data } : null);
      
      return true;
    } catch (err) {
      console.error('Profil güncellenemedi:', err);
      setError('Profil güncellenemedi');
      throw err;
    }
  };
  
  return { profile, loading, error, updateProfile };
} 