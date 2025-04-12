# SpeakNest - Eğitim Platformu

Bu proje, Next.js ve Firebase kullanarak Nesne Yönelimli Programlama (OOP), Görünüş Odaklı Programlama (AOP) ve Rol Tabanlı Erişim Kontrolü (RBAC) prensiplerine uygun bir eğitim platformu web uygulamasıdır.

## Özellikler

- **Next.js 14**: App Router, Server Components, React Server Components (RSC)
- **Firebase**: Authentication, Firestore, Storage
- **OOP Prensipleri**: Sınıflar, Inheritance, Encapsulation, Singleton Pattern
- **AOP Prensipleri**: TypeScript Dekoratörleri, Cross-Cutting Concerns, Method Interception
- **RBAC Prensipleri**: Rol tabanlı erişim kontrolü, İzin yönetimi
- **Kullanıcı Rolleri**: Admin, Öğretmen, Öğrenci, Editor, Pro Kullanıcı
- **Öğrenci Paneli**: Kurslar, ödevler ve profil yönetimi

## Proje Yapısı

```
src/
├── app/                     # Next.js App Router
│   ├── dashboard/           # Admin ve yönetici paneli
│   ├── student-panel/       # Öğrenci paneli
│   ├── login/               # Giriş sayfası
│   └── register/            # Kayıt sayfası
├── components/              # React bileşenleri
├── lib/
│   ├── aop/                 # AOP dekoratörleri ve middleware'ler
│   ├── auth/                # RBAC ve kimlik doğrulama işlemleri
│   ├── firebase/            # Firebase yapılandırması
│   └── services/            # Servis sınıfları
```

## Başlangıç

1. Bu repo'yu klonlayın
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Firebase projenizi oluşturun ve `.env.local.example` dosyasını `.env.local` olarak kopyalayıp Firebase projenize ait bilgileri girin:
   ```bash
   cp .env.local.example .env.local
   ```
4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın

## OOP Özellikleri

Bu projede şu OOP prensipleri kullanılmıştır:

- **Sınıflar**: Veri modellemesi için kullanıcı sınıfı
- **Encapsulation**: Private değişkenler ve metodlar
- **Inheritance**: Model sınıflarında miras alma
- **Singleton Pattern**: Servis sınıfları için tekil örnekleme

## AOP Özellikleri

Bu projede şu AOP prensipleri kullanılmıştır:

- **Dekoratörler**: Metot çağrılarını sarmak için
- **Cross-Cutting Concerns**: Loglama, önbellekleme, yetkilendirme
- **Method Interception**: Metot öncesi/sonrası işlemler

## RBAC Özellikleri

Bu projede şu RBAC prensipleri kullanılmıştır:

- **Roller**: Admin, Öğretmen, Öğrenci, Editor, Pro Kullanıcı
- **İzinler**: Create, Read, Update, Delete
- **Yetkilendirme**: Dekoratörler ve middleware'ler ile

## Öğrenci Paneli

Öğrenci paneli şu özelliklere sahiptir:

- Profil bilgilerine erişim ve düzenleme
- Kayıtlı kursların listesi
- Bekleyen ödevlerin takibi
- Kurs içeriklerine erişim
- Ödev teslimi

## Google Meet API Entegrasyonu

Uygulama, toplantılar için otomatik Google Meet bağlantıları oluşturmaktadır. Bu özelliğin çalışması için aşağıdaki adımları izlemeniz gerekmektedir:

## Gerekli Ayarlar

1. **Google Cloud Console'da Proje Oluşturun**:
   - [Google Cloud Console](https://console.cloud.google.com/)'a gidin
   - Yeni bir proje oluşturun veya mevcut bir projeyi seçin
   - API ve Servisler > Kütüphane bölümüne gidin
   - Aşağıdaki API'leri etkinleştirin:
     - Google Calendar API
     - Google Meet API

2. **OAuth 2.0 İstemci Kimliği Oluşturun**:
   - API ve Servisler > Kimlik Bilgileri bölümüne gidin
   - "Kimlik Bilgisi Oluştur" > "OAuth istemci kimliği" seçin
   - Uygulama türünü "Web uygulaması" olarak seçin
   - Yetkilendirilmiş JavaScript kökenleri olarak uygulamanızın URL'sini ekleyin (ör. `https://example.com`)
   - Yetkilendirilmiş yönlendirme URI'leri olarak `https://example.com/api/auth/callback/google` ekleyin
   - Oluşturulan OAuth istemci kimliğini (Client ID) ve gizli anahtarı (Client Secret) not alın

3. **API Anahtarı Oluşturun**:
   - API ve Servisler > Kimlik Bilgileri bölümüne gidin
   - "Kimlik Bilgisi Oluştur" > "API Anahtarı" seçin
   - Oluşturulan API anahtarını not alın

4. **Çevre Değişkenlerini Ayarlayın**:
   - `.env.local` dosyasında aşağıdaki değişkenleri güncelleyin:
     ```
     NEXT_PUBLIC_GOOGLE_API_KEY=OLUŞTURDUĞUNUZ_API_ANAHTARI
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=OLUŞTURDUĞUNUZ_CLIENT_ID
     ```

## Zamanlanmış Toplantılar için Otomatik Aktivasyon

Uygulama, zamanlanmış toplantıları başlangıç zamanına yaklaştığında otomatik olarak aktif duruma getiren bir sistem içerir. Bu özelliğin düzgün çalışması için:

1. **API Güvenlik Anahtarı Ayarlayın**:
   - `.env.local` dosyasında aşağıdaki değişkeni güncelleyin:
     ```
     SCHEDULED_MEETINGS_API_KEY=GÜÇLÜ_BİR_RASTGELE_ANAHTAR
     ```

2. **Cron Job Kurun**:
   - Her 5 dakikada bir aşağıdaki API endpoint'ini çağıracak bir cron job oluşturun:
     ```
     https://example.com/api/scheduled-meetings?apiKey=GÜVENLIK_ANAHTARINIZ
     ```
   - Cron job için Vercel Cron Jobs, AWS Lambda, Google Cloud Functions, GitHub Actions veya Heroku Scheduler kullanabilirsiniz.

## Toplantı Statüleri

Toplantılar aşağıdaki durumlardan birinde olabilir:

- **scheduled**: Toplantı zamanlanmış, henüz aktif değil
- **active**: Toplantı aktif, katılımcılar katılabilir (toplantı saatinden 15 dakika önce otomatik olarak aktif hale gelir)
- **completed**: Toplantı tamamlanmış
- **cancelled**: Toplantı iptal edilmiş

## Lisans

MIT
