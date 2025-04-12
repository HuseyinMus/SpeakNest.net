import { NextResponse } from 'next/server';
import { ZoomService } from '@/lib/services/ZoomService';

// Basit bir test endpoint'i
export async function GET() {
  try {
    // Test için değerler
    const title = "Test Toplantısı " + new Date().toLocaleTimeString();
    const description = "Bu bir test toplantısıdır";
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1); // 1 saat sonra
    
    console.log('Test değerleri:', {
      title,
      description,
      startTime: startTime.toISOString()
    });
    
    // ZoomService'i kullanarak toplantı oluştur
    const result = await ZoomService.createMeeting(
      title,
      description,
      startTime,
      30 // 30 dakikalık test toplantısı
    );
    
    return NextResponse.json({
      success: true,
      message: 'Test toplantısı başarıyla oluşturuldu',
      data: result
    });
  } catch (error: any) {
    console.error('Debug API hatası:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Bir hata oluştu',
      error: error
    }, { status: 500 });
  }
} 