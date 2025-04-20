'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useLanguage } from '@/lib/context/LanguageContext';

/**
 * Belirli bir rol veya roller için kimlik doğrulama gerektiren hook
 * @param requiredRoles İzin verilen roller veya rol
 * @param redirectTo Yetkisiz erişimde yönlendirilecek sayfa
 * @returns İşlem durumu ve kullanıcı bilgileri
 */
export function useRequireAuth(requiredRoles?: string | string[], redirectTo: string = '/login') {
  const { currentUser, userProfile, loading, hasPermission } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Auth yüklemesi bitene kadar bekle
    if (loading) return;

    // Kullanıcı giriş yapmamışsa
    if (!currentUser) {
      toast.info(t('loginRequired', 'Bu sayfaya erişmek için giriş yapmanız gerekiyor.'));
      router.push(redirectTo);
      return;
    }

    // Belirli bir rol gerekiyorsa
    if (requiredRoles) {
      const authorized = hasPermission(requiredRoles);
      setIsAuthorized(authorized);

      if (!authorized) {
        toast.error(t('accessDenied', 'Bu sayfaya erişim izniniz yok.'));
        
        // Rol bazlı yönlendirme
        if (userProfile?.role === 'admin') {
          router.push('/dashboard');
        } else if (userProfile?.role === 'proUser') {
          router.push('/prouser-panel');
        } else if (userProfile?.role === 'teacher') {
          router.push('/teacher-panel');
        } else if (userProfile?.role === 'student') {
          router.push('/student-panel');
        } else {
          router.push('/');
        }
      }
    } else {
      // Özel rol gerektirmiyorsa, sadece giriş yapmış olmak yeterli
      setIsAuthorized(true);
    }
  }, [currentUser, loading, requiredRoles, hasPermission, router, redirectTo, toast, t, userProfile]);

  return {
    isAuthorized,
    isLoading: loading,
    currentUser,
    userProfile
  };
} 