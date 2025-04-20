'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Meeting, useMeetings } from './hooks/useMeetings';
import MeetingList from './components/MeetingList';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CreateMeetingForm from './components/CreateMeetingForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export default function ProUserPanelPage() {
  const { t } = useLanguage();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  // useMeetings hook'unu kullanarak toplantı verilerini çek
  const {
    meetings,
    loading: meetingsLoading,
    error: meetingsError,
    refresh: refreshMeetings,
    isRefreshing,
    hasMore,
    loadMore,
    isLoadingMore
  } = useMeetings();

  // Yeni toplantı oluşturulduğunda toplantı listesini yenile
  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false);
    refreshMeetings();
    toast({
      title: t('meetingCreated', 'Toplantı Oluşturuldu'),
      description: t('meetingCreatedSuccess', 'Yeni toplantı başarıyla oluşturuldu.'),
      variant: 'success',
    });
  }, [refreshMeetings, toast, t]);

  // Toplantı düzenleme işlemi tamamlandığında listesini yenile
  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedMeeting(null);
    refreshMeetings();
    toast({
      title: t('meetingUpdated', 'Toplantı Güncellendi'),
      description: t('meetingUpdatedSuccess', 'Toplantı bilgileri başarıyla güncellendi.'),
      variant: 'success',
    });
  }, [refreshMeetings, toast, t]);

  // Toplantı düzenleme işlemini başlat
  const handleEditMeeting = useCallback((meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsEditDialogOpen(true);
  }, []);

  // Toplantıya katılma işlemi
  const handleJoinMeeting = useCallback((meetingId: string) => {
    router.push(`/meeting/${meetingId}`);
  }, [router]);

  // Eğer kullanıcı oturum açmadıysa ve yükleme tamamlandıysa, login sayfasına yönlendir
  if (!authLoading && !currentUser) {
    router.push('/login');
    return null;
  }

  // Eğer kullanıcı profili yoksa veya kullanıcı pro değilse, home sayfasına yönlendir
  if (!authLoading && userProfile && userProfile.role !== 'pro') {
    router.push('/');
    toast({
      title: t('accessDenied', 'Erişim Reddedildi'),
      description: t('proUserOnly', 'Bu sayfa sadece pro kullanıcılar içindir.'),
      variant: 'destructive',
    });
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('proUserPanel', 'Pro Kullanıcı Paneli')}
        </h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle size={18} />
          {t('createMeeting', 'Yeni Toplantı Oluştur')}
        </Button>
      </div>

      {/* Toplantı Listesi */}
      <MeetingList 
        meetings={meetings}
        isLoading={authLoading || meetingsLoading}
        error={meetingsError}
        onEditMeeting={handleEditMeeting}
        onJoinMeeting={handleJoinMeeting}
        onRefresh={refreshMeetings}
        isRefreshing={isRefreshing}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoadingMore={isLoadingMore}
      />

      {/* Yeni Toplantı Oluşturma Dialog'u */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('createNewMeeting', 'Yeni Toplantı Oluştur')}</DialogTitle>
            <DialogDescription>
              {t('createMeetingDescription', 'Yeni bir toplantı oluşturmak için aşağıdaki formu doldurun.')}
            </DialogDescription>
          </DialogHeader>
          
          <CreateMeetingForm 
            onSuccess={handleCreateSuccess} 
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Toplantı Düzenleme Dialog'u */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('editMeeting', 'Toplantıyı Düzenle')}</DialogTitle>
            <DialogDescription>
              {t('editMeetingDescription', 'Toplantı bilgilerini güncellemek için aşağıdaki formu düzenleyin.')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeeting && (
            <CreateMeetingForm 
              onSuccess={handleEditSuccess} 
              onCancel={() => setIsEditDialogOpen(false)}
              meetingData={selectedMeeting}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 