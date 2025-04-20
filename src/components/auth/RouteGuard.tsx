'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useLanguage } from '@/lib/context/LanguageContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: string | string[];
  fallbackPath?: string;
}

export default function RouteGuard({ 
  children, 
  requiredRoles, 
  fallbackPath = '/login'
}: RouteGuardProps) {
  const { currentUser, userProfile, loading, hasPermission, canAccess } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Auth yüklemesi bitene kadar bekle
    if (loading) return;

    // İzin kontrolü
    let hasAccess = false;
    
    // Eğer belirli roller gerektiriyorsa onları kontrol et
    if (requiredRoles) {
      hasAccess = hasPermission(requiredRoles);
    } else {
      // Aksi halde mevcut yolun izinlerini kontrol et
      hasAccess = canAccess(pathname || '');
    }

    // Erişim izni yoksa yönlendir
    if (!hasAccess) {
      // Giriş yapmadıysa login'e yönlendir
      if (!currentUser) {
        toast.info(t('loginRequired', 'Bu sayfaya erişmek için giriş yapmanız gerekiyor.'));
        router.push(fallbackPath);
        return;
      }

      // Giriş yapmış ama yetkisi yoksa
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
  }, [
    loading, 
    currentUser, 
    userProfile, 
    pathname, 
    requiredRoles, 
    hasPermission, 
    canAccess, 
    router, 
    fallbackPath, 
    toast, 
    t
  ]);

  // Auth yüklemesi devam ediyorsa, yükleme ekranını göster
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // İzin kontrolü yapıldı, erişim varsa içeriği göster
  return <>{children}</>;
} 