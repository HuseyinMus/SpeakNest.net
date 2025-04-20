'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { addDoc, collection, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Meeting } from '../hooks/useMeetings';
import { useToast } from '@/components/ui/use-toast';
import { DataService } from '@/lib/services/DataService';

interface MeetingFormData {
  title: string;
  description: string;
  maxParticipants: number;
  startTime: string;
  duration: number;
}

interface CreateMeetingFormProps {
  meetingData?: Meeting;
  isEdit?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateMeetingForm({
  meetingData,
  isEdit = false,
  onSuccess,
  onCancel
}: CreateMeetingFormProps) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form doğrulama şeması
  const formSchema = z.object({
    title: z.string().min(3, t('titleMinLength', 'Başlık en az 3 karakter olmalıdır.')),
    description: z.string().min(10, t('descriptionMinLength', 'Açıklama en az 10 karakter olmalıdır.')),
    maxParticipants: z.coerce.number().min(2, t('minParticipants', 'En az 2 katılımcı olmalıdır.')).max(50, t('maxParticipants', 'En fazla 50 katılımcı olabilir.')),
    startTime: z.string().refine(val => new Date(val) > new Date(), {
      message: t('futureDate', 'Başlangıç zamanı gelecekte bir zaman olmalıdır.')
    }),
    duration: z.coerce.number().min(10, t('minDuration', 'Toplantı en az 10 dakika olmalıdır.')).max(240, t('maxDuration', 'Toplantı en fazla 4 saat olabilir.'))
  });

  // Form oluşturma
  const form = useForm<MeetingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: meetingData?.title || '',
      description: meetingData?.description || '',
      maxParticipants: meetingData?.maxParticipants || 10,
      startTime: meetingData?.startTime ? new Date(meetingData.startTime).toISOString().slice(0, 16) : '',
      duration: meetingData?.duration || 60
    }
  });

  // Toplantı oluşturma/güncelleme işlemi
  const onSubmit = async (data: MeetingFormData) => {
    if (!currentUser) {
      toast({
        title: t('authError', 'Yetkilendirme Hatası'),
        description: t('needLogin', 'Toplantı oluşturmak için giriş yapmalısınız.'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Form verisini Firestore'a kaydetmek için hazırla
      const meetingData = {
        title: data.title,
        description: data.description,
        maxParticipants: data.maxParticipants,
        startTime: Timestamp.fromDate(new Date(data.startTime)),
        duration: data.duration,
        userId: currentUser.uid,
        status: 'scheduled', // scheduled, active, completed, cancelled
        participants: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (isEdit && meetingData?.id) {
        // Mevcut toplantıyı güncelle
        await DataService.setDocument(`meetings/${meetingData.id}`, {
          ...meetingData,
          updatedAt: Timestamp.now()
        });
      } else {
        // Yeni toplantı oluştur
        await DataService.addDocument('meetings', meetingData);
      }

      // Başarı durumunda
      onSuccess();
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({
        title: t('errorOccurred', 'Hata Oluştu'),
        description: isEdit
          ? t('updateMeetingError', 'Toplantı güncellenirken bir hata oluştu.')
          : t('createMeetingError', 'Toplantı oluşturulurken bir hata oluştu.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toplantı silme işlemi
  const handleDelete = async () => {
    if (!meetingData?.id || !currentUser) return;

    if (confirm(t('confirmDelete', 'Bu toplantıyı silmek istediğinize emin misiniz?'))) {
      try {
        setIsSubmitting(true);
        
        // Toplantıyı sil veya durumunu "iptal edildi" olarak işaretle
        await DataService.setDocument(`meetings/${meetingData.id}`, {
          status: 'cancelled',
          updatedAt: Timestamp.now()
        });
        
        toast({
          title: t('meetingCancelled', 'Toplantı İptal Edildi'),
          description: t('meetingCancelledSuccess', 'Toplantı başarıyla iptal edildi.'),
          variant: 'success',
        });
        
        onSuccess();
      } catch (error) {
        console.error('Error deleting meeting:', error);
        toast({
          title: t('errorOccurred', 'Hata Oluştu'),
          description: t('deleteMeetingError', 'Toplantı silinirken bir hata oluştu.'),
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Başlangıç zamanı için minimum değeri ayarla
  const minStartTime = new Date();
  minStartTime.setMinutes(minStartTime.getMinutes() + 10); // En az 10 dakika sonrası
  const minStartTimeString = minStartTime.toISOString().slice(0, 16);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('meetingTitle', 'Toplantı Başlığı')}</FormLabel>
              <FormControl>
                <Input placeholder={t('meetingTitlePlaceholder', 'Toplantı başlığını girin')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('meetingDescription', 'Toplantı Açıklaması')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('meetingDescriptionPlaceholder', 'Toplantı hakkında bilgi verin')} 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('startTime', 'Başlangıç Zamanı')}</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local"
                    min={minStartTimeString}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('meetingDuration', 'Toplantı Süresi (dakika)')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="60" 
                    min={10} 
                    max={240} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maxParticipants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('maxParticipants', 'Maksimum Katılımcı Sayısı')}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="10" 
                  min={2} 
                  max={50} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('cancel', 'İptal')}
          </Button>
          
          {isEdit && meetingData && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {t('delete', 'Sil')}
            </Button>
          )}
          
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('saving', 'Kaydediliyor...')}
              </span>
            ) : isEdit ? (
              t('update', 'Güncelle')
            ) : (
              t('create', 'Oluştur')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 