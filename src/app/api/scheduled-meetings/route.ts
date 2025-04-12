import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Bu API, zamanlanmış toplantıları kontrol eder ve başlama zamanına yaklaştığında durumlarını "active" olarak günceller.
 * Heroku Scheduler ya da benzer bir servis ile düzenli olarak çağrılmalıdır (ör. her 5 dakikada bir).
 * 
 * - startTime < now + 15 dakika => Toplantıyı aktif duruma geçir
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.nextUrl.searchParams.get('apiKey');
    
    // Basit API anahtarı doğrulaması (daha güvenli bir yöntem kullanılmalı)
    if (apiKey !== process.env.SCHEDULED_MEETINGS_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + (15 * 60 * 1000));
    
    // "scheduled" durumundaki toplantıları sorgula
    const meetingsQuery = query(
      collection(db, 'meetings'),
      where('status', '==', 'scheduled')
    );
    
    const snapshot = await getDocs(meetingsQuery);
    
    let activatedCount = 0;
    const updates: Promise<void>[] = [];
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const startTime = data.startTime instanceof Date 
        ? data.startTime 
        : (data.startTime as Timestamp).toDate();
      
      // Toplantı başlangıç zamanı 15 dakika içinde mi?
      if (startTime <= fifteenMinutesFromNow) {
        // Durumu "active" olarak güncelle
        const updatePromise = updateDoc(doc(db, 'meetings', docSnapshot.id), {
          status: 'active',
          updatedAt: serverTimestamp()
        });
        
        updates.push(updatePromise);
        activatedCount++;
      }
    });
    
    // Tüm güncellemeleri bekle
    await Promise.all(updates);
    
    return NextResponse.json({
      success: true,
      totalChecked: snapshot.size,
      activated: activatedCount,
      timestamp: now.toISOString()
    });
    
  } catch (error) {
    console.error('Error activating scheduled meetings:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Cron işi için POST endpoint'ini de destekleyelim
export async function POST(req: NextRequest) {
  return GET(req);
} 