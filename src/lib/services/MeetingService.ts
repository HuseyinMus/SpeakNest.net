import { db, collections } from '@/lib/firebase/config';
import { collection, doc, getDoc, updateDoc, query, where, orderBy, getDocs, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { ZoomService } from './ZoomService';

// Toplantı durumu türleri
export type MeetingStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

// Toplantı veri modeli
export interface MeetingData {
  id?: string;
  title: string;
  description: string;
  startTime: Date | Timestamp;
  endTime?: Date | Timestamp;
  level: string;
  topic: string;
  participantCount: number;
  keywords: string[];
  questions: string[];
  hostId: string;
  hostName: string;
  hostPhotoURL: string | null;
  status: MeetingStatus;
  participants: string[];
  meetUrl?: string;
  zoomMeetingId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MeetingResponse {
  joinUrl: string;
  meetingId: string;
}

export class MeetingService {
  private static MEETINGS_COLLECTION = collections.meetings;
  
  /**
   * Yeni bir toplantı oluşturur
   * 
   * @param title Toplantı başlığı
   * @param description Toplantı açıklaması
   * @param startTime Toplantı başlangıç zamanı
   * @param duration Toplantı süresi (varsayılan: 60 dakika)
   * @returns Oluşturulan toplantı bilgileri
   */
  static async createMeeting(
    title: string,
    description: string,
    startTime: Date,
    duration: number = 60
  ): Promise<MeetingResponse> {
    try {
      const { joinUrl, meetingId } = await ZoomService.createMeeting(
        title,
        description,
        startTime,
        duration
      );

      return {
        joinUrl,
        meetingId,
      };
    } catch (error) {
      console.error('Toplantı oluşturma hatası:', error);
      throw new Error('Toplantı oluşturulurken bir hata oluştu');
    }
  }
  
  /**
   * Toplantıyı ID'ye göre getirir
   * 
   * @param meetingId Toplantı ID'si
   * @returns Toplantı bilgileri
   */
  static async getMeetingById(meetingId: string): Promise<MeetingData | null> {
    try {
      const docRef = doc(db, this.MEETINGS_COLLECTION, meetingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MeetingData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw error;
    }
  }
  
  /**
   * Kullanıcının tüm toplantılarını duruma göre getirir
   * 
   * @param userId Kullanıcı ID'si
   * @param status İstenilen toplantı durumu (opsiyonel)
   * @returns Toplantı listesi
   */
  static async getUserMeetings(userId: string, status?: MeetingStatus): Promise<MeetingData[]> {
    try {
      let meetingsQuery;
      
      if (status) {
        // Duruma göre filtreleme yap
        meetingsQuery = query(
          collection(db, this.MEETINGS_COLLECTION),
          where('hostId', '==', userId),
          where('status', '==', status),
          orderBy('startTime', 'asc')
        );
      } else {
        // Tüm toplantıları getir
        meetingsQuery = query(
          collection(db, this.MEETINGS_COLLECTION),
          where('hostId', '==', userId),
          orderBy('startTime', 'asc')
        );
      }
      
      const snapshot = await getDocs(meetingsQuery);
      const meetings: MeetingData[] = [];
      
      snapshot.forEach((doc) => {
        meetings.push({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as MeetingData);
      });
      
      return meetings;
    } catch (error) {
      console.error('Error getting user meetings:', error);
      throw error;
    }
  }
  
  /**
   * Toplantı durumunu günceller
   * 
   * @param meetingId Toplantı ID'si
   * @param status Yeni toplantı durumu
   */
  static async updateMeetingStatus(meetingId: string, status: MeetingStatus): Promise<void> {
    try {
      const docRef = doc(db, this.MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw error;
    }
  }
  
  /**
   * Toplantıya katılımcı ekler
   * 
   * @param meetingId Toplantı ID'si
   * @param userId Katılımcı ID'si
   */
  static async addParticipant(meetingId: string, userId: string): Promise<void> {
    try {
      const meeting = await this.getMeetingById(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Katılımcı zaten ekli mi kontrol et
      if (meeting.participants.includes(userId)) {
        return;
      }
      
      // Toplantı kapasitesi dolu mu kontrol et
      if (meeting.participants.length >= meeting.participantCount) {
        throw new Error('Meeting is at full capacity');
      }
      
      // Katılımcıyı ekle
      const docRef = doc(db, this.MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        participants: [...meeting.participants, userId],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }
  
  /**
   * Toplantıdan katılımcı çıkarır
   * 
   * @param meetingId Toplantı ID'si
   * @param userId Katılımcı ID'si
   */
  static async removeParticipant(meetingId: string, userId: string): Promise<void> {
    try {
      const meeting = await this.getMeetingById(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Katılımcıyı kaldır
      const docRef = doc(db, this.MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        participants: meeting.participants.filter(id => id !== userId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }
  
  /**
   * Zamanlanmış toplantıları aktif duruma getirmek için dinleyici başlatır
   * 
   * @param onMeetingActivated Toplantı aktif olduğunda çağrılacak fonksiyon
   * @returns Dinleyiciyi durdurmak için fonksiyon
   */
  static listenToScheduledMeetings(onMeetingActivated: (meeting: MeetingData) => void): () => void {
    // Şu anda "scheduled" durumundaki toplantıları dinle
    const scheduledMeetingsQuery = query(
      collection(db, this.MEETINGS_COLLECTION),
      where('status', '==', 'scheduled')
    );
    
    // Firestore dinleyicisini başlat
    const unsubscribe = onSnapshot(scheduledMeetingsQuery, (snapshot) => {
      const now = new Date();
      
      snapshot.forEach(async (doc) => {
        const meeting = { id: doc.id, ...doc.data() } as MeetingData;
        const startTime = meeting.startTime instanceof Date 
          ? meeting.startTime 
          : (meeting.startTime as Timestamp).toDate();
        
        // Başlangıç zamanı geldi mi kontrol et (15 dakika kaldıysa aktif et)
        if (startTime.getTime() - now.getTime() <= 15 * 60 * 1000) {
          // Toplantıyı aktif duruma getir
          await this.updateMeetingStatus(doc.id, 'active');
          onMeetingActivated(meeting);
        }
      });
    });
    
    return unsubscribe;
  }
} 