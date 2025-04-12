import { rbacService, Permission } from '@/lib/auth/rbac';
import { auth } from '@/lib/firebase/config';
import { NextRequest, NextResponse } from 'next/server';

// AOP yaklaşımı için metot etrafına kesişim noktaları (interception points) ekleyen dekoratörler

// İzleme (Logging) dekoratörü - metodun çalışma süresini ve sonuçlarını izler
export function Logger(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const start = performance.now();
    console.log(`${propertyKey} metodu çağrıldı.`);
    
    try {
      const result = await originalMethod.apply(this, args);
      const end = performance.now();
      console.log(`${propertyKey} metodu ${end - start}ms sürede tamamlandı.`);
      return result;
    } catch (error) {
      console.error(`${propertyKey} metodu hata ile sonuçlandı:`, error);
      throw error;
    }
  };
  
  return descriptor;
}

// Önbellek (Caching) dekoratörü - metot sonuçlarını önbelleğe alır
export function Cache(ttl: number = 60000) { // Varsayılan olarak 1 dakika
  const cache = new Map<string, { value: any, timestamp: number }>();
  
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const key = `${propertyKey}-${JSON.stringify(args)}`;
      const now = Date.now();
      
      // Önbellekte varsa ve süresi dolmamışsa, önbellekten döndür
      if (cache.has(key)) {
        const cachedItem = cache.get(key)!;
        if (now - cachedItem.timestamp < ttl) {
          console.log(`${key} önbellekten alındı.`);
          return cachedItem.value;
        }
      }
      
      // Metodu çalıştır ve sonucu önbelleğe al
      const result = await originalMethod.apply(this, args);
      cache.set(key, { value: result, timestamp: now });
      return result;
    };
    
    return descriptor;
  };
}

// Yetkilendirme (Authorization) dekoratörü - RBAC ile entegre çalışır
export function RequirePermission(permission: Permission) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const user = auth.currentUser;
      const hasPermission = await rbacService.hasPermission(user, permission);
      
      if (!hasPermission) {
        throw new Error('Bu işlem için yetkiniz bulunmuyor.');
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// API Routes için yetkilendirme (Authorization) middleware'i
export function withPermission(permission: Permission) {
  return async (request: NextRequest) => {
    try {
      const user = auth.currentUser;
      const hasPermission = await rbacService.hasPermission(user, permission);
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Bu işlem için yetkiniz bulunmuyor.' },
          { status: 403 }
        );
      }
      
      // İsteğe devam et
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama hatası' },
        { status: 401 }
      );
    }
  };
} 