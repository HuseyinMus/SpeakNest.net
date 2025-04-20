# SpeakNest Yetkilendirme Sistemi

Bu doküman, SpeakNest uygulamasındaki yetkilendirme sistemini ve rol tabanlı erişim kontrollerini açıklar.

## Kullanıcı Rolleri

Sistemde tanımlanan kullanıcı rolleri şunlardır:

1. **Admin**: Tüm sisteme tam erişim hakkına sahiptir. Kullanıcıları yönetebilir, tüm toplantıları görüntüleyebilir/düzenleyebilir ve sistem ayarlarını değiştirebilir.

2. **ProUser** (Konuşma Sunucusu): Toplantılar oluşturabilir, kendi toplantılarını yönetebilir, katılımcıları değerlendirebilir.

3. **Teacher** (Öğretmen): Kendi sınıfları için toplantılar oluşturabilir, öğrencileri değerlendirebilir, eğitim materyalleri ekleyebilir.

4. **Student** (Öğrenci): Toplantılara katılabilir, kendi profilini yönetebilir, uygulama içi materyallere erişebilir.

5. **User** (Standart Kullanıcı): Temel profil bilgilerini yönetebilir, platformda gezinebilir.

## Yetkilendirme Mimarisi

Uygulama, iki katmanlı bir yetkilendirme sistemi kullanır:

1. **Client-Side Kontroller**:
   - `AuthContext`: Kullanıcı oturumunu ve profil bilgilerini yönetir.
   - `RouteGuard`: Sayfa erişimlerini rol bazlı olarak kısıtlar.
   - `hasPermission` ve `canAccess` metodları: Belirli işlevlere veya sayfalara erişimi kontrol eder.

2. **Server-Side Kontroller**:
   - Firestore Güvenlik Kuralları: Veritabanı düzeyinde erişim kontrolü sağlar.
   - API rotaları güvenliği: Backend işlevleri için kimlik doğrulama kontrolü.

## Sayfa Erişim Kontrolü

Uygulamada tanımlanan sayfaların erişim hakları:

```typescript
export const ROUTE_PERMISSIONS = {
  // Genel rotalar
  'login': ['*'],
  'register': ['*'],
  'reset-password': ['*'],
  '/': ['*'],
  'about': ['*'],
  'pricing': ['*'],
  'contact': ['*'],
  'terms': ['*'],
  'privacy': ['*'],
  
  // Giriş yapan tüm kullanıcılar için
  'profile': ['admin', 'proUser', 'teacher', 'student', 'user'],
  'settings': ['admin', 'proUser', 'teacher', 'student', 'user'],
  
  // Spesifik roller için
  'dashboard': ['admin'],
  'prouser-panel': ['admin', 'proUser'],
  'teacher-panel': ['admin', 'teacher'],
  'student-panel': ['admin', 'student'],
  'meetings': ['admin', 'proUser', 'teacher', 'student'],
  'admin': ['admin'],
};
```

## RouteGuard Kullanımı

RouteGuard bileşeni, herhangi bir sayfanın erişimini kısıtlamak için kullanılabilir:

```jsx
// Belirli rollere erişim kısıtlama
<RouteGuard requiredRoles={['admin', 'proUser']}>
  <AdminPanelContent />
</RouteGuard>

// ROUTE_PERMISSIONS tablosuna göre kısıtlama
<RouteGuard>
  <SomePage />
</RouteGuard>
```

## Firestore Güvenlik Kuralları

Firestore kuralları, veritabanı düzeyinde tutarlı yetkilendirme sağlar:

- Kullanıcılar kendi profillerini okuyabilir ve güncelleyebilir
- Admin tüm kullanıcıları yönetebilir
- ProUser ve Teacher sadece kendi toplantılarını oluşturabilir ve güncelleyebilir
- Student sadece kendisine tanımlı toplantılara katılabilir

## Uygulama Yükleme Akışı

1. Uygulama başlatıldığında, AuthProvider kullanıcının kimlik bilgilerini yükler.
2. Kullanıcı bilgileri yüklenene kadar yükleme ekranı gösterilir.
3. Kullanıcı oturumu açıksa, profile bilgileri Firestore'dan alınır.
4. RouteGuard bileşeni mevcut sayfanın erişim izinlerini kontrol eder.
5. Erişim izni varsa sayfa içeriği gösterilir, yoksa uygun yönlendirme yapılır.

## Yetkilendirme Kontrol Metodları

```typescript
// Rol bazlı yetki kontrolü
const hasPermission = (requiredRoles: string | string[]) => {
  // Kullanıcı rollerini kontrol etme mantığı
};

// Sayfa erişim kontrolü
const canAccess = (path: string) => {
  // Sayfa izinlerini kontrol etme mantığı
};
```

## Best Practices

1. Client-side ve server-side yetkilendirme kontrollerini daima birlikte kullanın.
2. Kullanıcı rollerini Firestore'da tutun ve AuthContext'te saklanmasını sağlayın.
3. Rol değişimleri için admin onayı gerektiren bir iş akışı oluşturun.
4. RouteGuard bileşenini tüm korumalı sayfalarda kullanın.
5. Yetkilendirme kontrolleri için throw/redirect yerine koşullu renderlamayı tercih edin.
6. Hassas işlemler için ek doğrulama adımları ekleyin. 