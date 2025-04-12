import { NextResponse } from 'next/server';
import { ZoomService } from '@/lib/services/ZoomService';

// Statik dışa aktarım için gerekli yapılandırma
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  try {
    const meeting = await ZoomService.createMeeting(
      'Test Toplantısı',
      'Bu bir test toplantısıdır',
      new Date(Date.now() + 1000 * 60 * 5), // 5 dakika sonra
      30 // 30 dakika
    );

    return NextResponse.json({
      status: 'success',
      data: meeting
    });
  } catch (error) {
    console.error('Test hatası:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
} 