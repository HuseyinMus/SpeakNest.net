'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Dil türleri için tip tanımı
type Language = 'tr' | 'en' | 'es' | 'ar';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: any) => string; // Translation function
  languages: { code: Language; name: string }[];
}

const defaultLanguage: Language = 'tr';

// Çeviri işlevi - basit bir implementasyon
function translateKey(key: string, language: Language, params?: any): string {
  // Bu fonksiyon, gerçek bir çeviri kütüphanesi eklenene kadar basit bir geçici çözüm olarak işlev görecek
  const translations: Record<Language, Record<string, string>> = {
    tr: {
      'appName': 'İngilizce Pratik Platformu',
      'welcome': 'Hoş Geldiniz',
      'login': 'Giriş Yap',
      'register': 'Kaydol',
      'dashboard': 'Gösterge Paneli',
      'home': 'Ana Sayfa',
      'profile': 'Profil',
      'logout': 'Çıkış Yap',
      'settings': 'Ayarlar',
      'statistics': 'İstatistikler',
      'student': 'Öğrenci',
      'welcomeMessage': 'Hoş geldin, {name}!',
      'todayMessage': 'Bugün İngilizce pratik yapmak için harika bir gün!',
      'findMeeting': 'Toplantı Bul',
      'quickMatch': 'Hızlı Eşleşme',
      'upcomingMeetings': 'Yaklaşan Toplantılar',
      'noUpcomingMeetings': 'Yaklaşan toplantınız bulunmamaktadır.',
      'findConversationMeeting': 'Konuşma Toplantısı Bul',
      'viewAllUpcomingPractices': 'Tüm Yaklaşan Pratikleri Görüntüle',
      'conversationMeetings': 'Konuşma Toplantıları',
      'practiceRooms': 'Pratik Odaları',
      'upcomingPractices': 'Yaklaşan Pratikler',
      'assignments': 'Ödevler',
      'popularPracticeRooms': 'Popüler Pratik Odaları',
      'host': 'Sunucu',
      'notSpecified': 'Belirtilmemiş',
      'joinRoom': 'Odaya Katıl',
      'noPracticeRooms': 'Henüz aktif pratik odası bulunmamaktadır.',
      'viewAllPracticeRooms': 'Tüm Pratik Odalarını Görüntüle',
      'conversationHost': 'Konuşma Sunucusu',
      'myMeetings': 'Toplantılarım',
      'createMeeting': 'Toplantı Oluştur',
      'participants': 'Katılımcılar',
      'evaluations': 'Değerlendirmeler',
      'loading': 'Yükleniyor...',
      'error': 'Hata',
      'returnToLogin': 'Giriş Sayfasına Dön',
      'selectLanguage': 'Dil seçin',
      'hostDayMessage': 'Bugün İngilizce pratik yapmak isteyenlere yardımcı olma günü!',
      'createNewMeeting': 'Yeni Toplantı Oluştur',
      'viewParticipants': 'Katılımcıları Görüntüle',
      'activeMeetings': 'Aktif Toplantılarım',
      'intermediateLevel': 'Orta Seviye',
      'dailyConversation': 'Günlük Konuşma',
      'date': 'Tarih',
      'goToMeeting': 'Toplantıya Git',
      'noActiveMeetings': 'Henüz aktif toplantınız bulunmamaktadır.',
      'viewAllMeetings': 'Tüm Toplantılarımı Görüntüle',
      'noUpcomingMeetingsScheduled': 'Henüz planlanmış yaklaşan toplantınız bulunmamaktadır.',
      'scheduleMeeting': 'Toplantı Planla',
      'sectionComingSoon': 'Bu bölüm yakında hazır olacak.',
      'userProfileNotFound': 'Kullanıcı profili bulunamadı.',
      'profileDataError': 'Profil bilgileri alınırken bir hata oluştu.',
      'meetingsAccessError': 'Toplantı bilgilerinize erişim sağlanamıyor. Yöneticiye başvurun.',
      'meetingsDataError': 'Toplantı bilgileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      'sessionCheckError': 'Toplantı kontrolü sırasında bir hata oluştu.',
      'meetingTitle': 'Toplantı Başlığı',
      'meetingTitlePlaceholder': 'Örn: Günlük Konuşma Pratiği',
      'meetingDescription': 'Toplantı Açıklaması',
      'meetingDescriptionPlaceholder': 'Bu toplantıda neler konuşulacak?',
      'meetingDate': 'Toplantı Tarihi',
      'meetingTime': 'Toplantı Saati',
      'level': 'Seviye',
      'topic': 'Konu',
      'minParticipants': 'Minimum Katılımcı',
      'maxParticipants': 'Maksimum Katılımcı',
      'keywords': 'Anahtar Kelimeler',
      'keywordPlaceholder': 'Yeni anahtar kelime ekle',
      'topicQuestions': 'Konu Soruları',
      'questionPlaceholder': 'Toplantıda sorulacak bir soru ekle',
      'creating': 'Oluşturuluyor...',
      'titleRequired': 'Başlık alanı zorunludur.',
      'dateTimeRequired': 'Tarih ve saat seçimi zorunludur.',
      'futureDateRequired': 'Toplantı tarihi gelecekte olmalıdır.',
      'meetingCreateSuccess': 'Toplantı başarıyla oluşturuldu!',
      'meetingCreateError': 'Toplantı oluşturulurken bir hata oluştu.',
      'createMeetingDescription': 'Yeni bir İngilizce pratik toplantısı oluşturun ve konuşma sunucusu olarak katılımcılara yardımcı olun.',
      'beginnerLevel': 'Başlangıç Seviyesi',
      'advancedLevel': 'İleri Seviye',
      'anyLevel': 'Tüm Seviyeler',
      'business': 'İş Dünyası',
      'education': 'Eğitim/Okul',
      'science': 'Bilim',
      'technology': 'Teknoloji',
      'arts': 'Sanat ve Kültür',
      'travel': 'Seyahat',
      'food': 'Yemek ve Mutfak',
      'sports': 'Spor',
      'health': 'Sağlık ve Wellness',
      'environment': 'Çevre',
      'entertainment': 'Eğlence ve Hobiler',
      'participantCount': 'Katılımcı Sayısı',
      'participantCountHelp': 'Toplantıya katılabilecek kişi sayısı (3-6 arası)',
      'participantCountError': 'Katılımcı sayısı 3 ile 6 arasında olmalıdır.',
      'myMeetingsDescription': 'Oluşturduğunuz ve katıldığınız tüm toplantıları görüntüleyin.',
      'level_beginner': 'Başlangıç Seviyesi',
      'level_intermediate': 'Orta Seviye',
      'level_advanced': 'İleri Seviye',
      'level_any': 'Tüm Seviyeler',
      'topic_daily': 'Günlük Konuşma',
      'topic_business': 'İş Dünyası',
      'topic_education': 'Eğitim/Okul',
      'topic_science': 'Bilim',
      'topic_technology': 'Teknoloji',
      'topic_arts': 'Sanat ve Kültür',
      'topic_travel': 'Seyahat',
      'topic_food': 'Yemek ve Mutfak',
      'topic_sports': 'Spor',
      'topic_health': 'Sağlık ve Wellness',
      'topic_environment': 'Çevre',
      'topic_entertainment': 'Eğlence ve Hobiler',
      'edit': 'Düzenle',
      'noMeetingsYet': 'Henüz toplantınız bulunmuyor.',
      'scheduledStatus': 'Zamanlanmış',
      'activeStatus': 'Aktif',
      'completedStatus': 'Tamamlandı',
      'cancelledStatus': 'İptal Edildi',
      'meetingStatusPrefix': 'Durum',
      'meetUrl': 'Toplantı Bağlantısı',
      'meetingLinkCopied': 'Toplantı bağlantısı panoya kopyalandı',
      'googleMeetIntegration': 'Google Meet Entegrasyonu',
      'meetingWillBeActive': 'Toplantı, başlangıç zamanından 15 dakika önce aktif olacak',
      'meetingActiveNow': 'Bu toplantı şu anda aktif',
      'copyMeetingLink': 'Toplantı Bağlantısını Kopyala',
      'joinMeeting': 'Toplantıya Katıl'
    },
    en: {
      'appName': 'English Practice Platform',
      'welcome': 'Welcome',
      'login': 'Login',
      'register': 'Register',
      'dashboard': 'Dashboard',
      'home': 'Home',
      'profile': 'Profile',
      'logout': 'Logout',
      'settings': 'Settings',
      'statistics': 'Statistics',
      'student': 'Student',
      'welcomeMessage': 'Welcome, {name}!',
      'todayMessage': 'Today is a great day to practice English!',
      'findMeeting': 'Find Meeting',
      'quickMatch': 'Quick Match',
      'upcomingMeetings': 'Upcoming Meetings',
      'noUpcomingMeetings': 'You have no upcoming meetings.',
      'findConversationMeeting': 'Find Conversation Meeting',
      'viewAllUpcomingPractices': 'View All Upcoming Practices',
      'conversationMeetings': 'Conversation Meetings',
      'practiceRooms': 'Practice Rooms',
      'upcomingPractices': 'Upcoming Practices',
      'assignments': 'Assignments',
      'popularPracticeRooms': 'Popular Practice Rooms',
      'host': 'Host',
      'notSpecified': 'Not Specified',
      'joinRoom': 'Join Room',
      'noPracticeRooms': 'No active practice rooms available yet.',
      'viewAllPracticeRooms': 'View All Practice Rooms',
      'conversationHost': 'Conversation Host',
      'myMeetings': 'My Meetings',
      'createMeeting': 'Create Meeting',
      'participants': 'Participants',
      'evaluations': 'Evaluations',
      'loading': 'Loading...',
      'error': 'Error',
      'returnToLogin': 'Return to Login',
      'selectLanguage': 'Select language',
      'hostDayMessage': 'Today is a great day to help others practice English!',
      'createNewMeeting': 'Create New Meeting',
      'viewParticipants': 'View Participants',
      'activeMeetings': 'My Active Meetings',
      'intermediateLevel': 'Intermediate Level',
      'dailyConversation': 'Daily Conversation',
      'date': 'Date',
      'goToMeeting': 'Go to Meeting',
      'noActiveMeetings': 'You don\'t have any active meetings yet.',
      'viewAllMeetings': 'View All My Meetings',
      'noUpcomingMeetingsScheduled': 'You don\'t have any upcoming meetings scheduled.',
      'scheduleMeeting': 'Schedule Meeting',
      'sectionComingSoon': 'This section will be available soon.',
      'userProfileNotFound': 'User profile not found.',
      'profileDataError': 'An error occurred while retrieving profile information.',
      'meetingsAccessError': 'Unable to access your meeting information. Please contact your administrator.',
      'meetingsDataError': 'An error occurred while retrieving meeting information. Please try again later.',
      'sessionCheckError': 'An error occurred during the meeting check.',
      'meetingTitle': 'Meeting Title',
      'meetingTitlePlaceholder': 'Ex: Daily Conversation Practice',
      'meetingDescription': 'Meeting Description',
      'meetingDescriptionPlaceholder': 'What will be discussed in this meeting?',
      'meetingDate': 'Meeting Date',
      'meetingTime': 'Meeting Time',
      'level': 'Level',
      'topic': 'Topic',
      'minParticipants': 'Minimum Participants',
      'maxParticipants': 'Maximum Participants',
      'keywords': 'Keywords',
      'keywordPlaceholder': 'Add a new keyword',
      'topicQuestions': 'Topic Questions',
      'questionPlaceholder': 'Add a question to be asked in the meeting',
      'creating': 'Creating...',
      'titleRequired': 'Title field is required.',
      'dateTimeRequired': 'Date and time selection is required.',
      'futureDateRequired': 'Meeting date must be in the future.',
      'meetingCreateSuccess': 'Meeting successfully created!',
      'meetingCreateError': 'An error occurred while creating the meeting.',
      'createMeetingDescription': 'Create a new English practice meeting and help participants as a conversation host.',
      'beginnerLevel': 'Beginner Level',
      'advancedLevel': 'Advanced Level',
      'anyLevel': 'Any Level',
      'business': 'Business',
      'education': 'Education/School',
      'science': 'Science',
      'technology': 'Technology',
      'arts': 'Arts and Culture',
      'travel': 'Travel',
      'food': 'Food and Cuisine',
      'sports': 'Sports',
      'health': 'Health and Wellness',
      'environment': 'Environment',
      'entertainment': 'Entertainment and Hobbies',
      'participantCount': 'Participant Count',
      'participantCountHelp': 'Number of people who can join the meeting (between 3-6)',
      'participantCountError': 'Participant count must be between 3 and 6.',
      'myMeetingsDescription': 'View all meetings you created and participated in.',
      'level_beginner': 'Beginner Level',
      'level_intermediate': 'Intermediate Level',
      'level_advanced': 'Advanced Level',
      'level_any': 'Any Level',
      'topic_daily': 'Daily Conversation',
      'topic_business': 'Business',
      'topic_education': 'Education/School',
      'topic_science': 'Science',
      'topic_technology': 'Technology',
      'topic_arts': 'Arts and Culture',
      'topic_travel': 'Travel',
      'topic_food': 'Food and Cuisine',
      'topic_sports': 'Sports',
      'topic_health': 'Health and Wellness',
      'topic_environment': 'Environment',
      'topic_entertainment': 'Entertainment and Hobbies',
      'edit': 'Edit',
      'noMeetingsYet': 'You don\'t have any meetings yet.',
      'scheduledStatus': 'Scheduled',
      'activeStatus': 'Active',
      'completedStatus': 'Completed',
      'cancelledStatus': 'Cancelled',
      'meetingStatusPrefix': 'Status',
      'meetUrl': 'Meeting Link',
      'meetingLinkCopied': 'Meeting link copied to clipboard',
      'googleMeetIntegration': 'Google Meet Integration',
      'meetingWillBeActive': 'The meeting will be active 15 minutes before the start time',
      'meetingActiveNow': 'This meeting is currently active',
      'copyMeetingLink': 'Copy Meeting Link',
      'joinMeeting': 'Join Meeting'
    },
    es: {
      'appName': 'Plataforma de Práctica de Inglés',
      'welcome': 'Bienvenido',
      'login': 'Iniciar Sesión',
      'register': 'Registrarse',
      'dashboard': 'Panel',
      'home': 'Inicio',
      'profile': 'Perfil',
      'logout': 'Cerrar Sesión',
      'settings': 'Configuración',
      'statistics': 'Estadísticas',
      'student': 'Estudiante',
      'welcomeMessage': '¡Bienvenido, {name}!',
      'todayMessage': '¡Hoy es un gran día para practicar inglés!',
      'findMeeting': 'Buscar Reunión',
      'quickMatch': 'Emparejamiento Rápido',
      'upcomingMeetings': 'Próximas Reuniones',
      'noUpcomingMeetings': 'No tienes reuniones próximas.',
      'findConversationMeeting': 'Buscar Reunión de Conversación',
      'viewAllUpcomingPractices': 'Ver Todas las Prácticas Próximas',
      'conversationMeetings': 'Reuniones de Conversación',
      'practiceRooms': 'Salas de Práctica',
      'upcomingPractices': 'Prácticas Próximas',
      'assignments': 'Tareas',
      'popularPracticeRooms': 'Salas de Práctica Populares',
      'host': 'Anfitrión',
      'notSpecified': 'No Especificado',
      'joinRoom': 'Unirse a la Sala',
      'noPracticeRooms': 'Aún no hay salas de práctica activas disponibles.',
      'viewAllPracticeRooms': 'Ver Todas las Salas de Práctica',
      'conversationHost': 'Anfitrión de Conversación',
      'myMeetings': 'Mis Reuniones',
      'createMeeting': 'Crear Reunión',
      'participants': 'Participantes',
      'evaluations': 'Evaluaciones',
      'loading': 'Cargando...',
      'error': 'Error',
      'returnToLogin': 'Volver a Iniciar Sesión',
      'selectLanguage': 'Seleccionar idioma',
      'hostDayMessage': '¡Hoy es un gran día para ayudar a otros a practicar inglés!',
      'createNewMeeting': 'Crear Nueva Reunión',
      'viewParticipants': 'Ver Participantes',
      'activeMeetings': 'Mis Reuniones Activas',
      'intermediateLevel': 'Nivel Intermedio',
      'dailyConversation': 'Conversación Diaria',
      'date': 'Fecha',
      'goToMeeting': 'Ir a la Reunión',
      'noActiveMeetings': 'Aún no tienes reuniones activas.',
      'viewAllMeetings': 'Ver Todas Mis Reuniones',
      'noUpcomingMeetingsScheduled': 'No tienes próximas reuniones programadas.',
      'scheduleMeeting': 'Programar Reunión',
      'sectionComingSoon': 'Esta sección estará disponible pronto.',
      'userProfileNotFound': 'Perfil de usuario no encontrado.',
      'profileDataError': 'Se produjo un error al recuperar la información del perfil.',
      'meetingsAccessError': 'No se puede acceder a su información de reuniones. Póngase en contacto con su administrador.',
      'meetingsDataError': 'Se produjo un error al recuperar la información de la reunión. Por favor, inténtelo de nuevo más tarde.',
      'sessionCheckError': 'Se produjo un error durante la verificación de la reunión.',
      'meetingTitle': 'Título de la Reunión',
      'meetingTitlePlaceholder': 'Ej: Práctica de Conversación Diaria',
      'meetingDescription': 'Descripción de la Reunión',
      'meetingDescriptionPlaceholder': '¿Qué se discutirá en esta reunión?',
      'meetingDate': 'Fecha de la Reunión',
      'meetingTime': 'Hora de la Reunión',
      'level': 'Nivel',
      'topic': 'Tema',
      'minParticipants': 'Participantes Mínimos',
      'maxParticipants': 'Participantes Máximos',
      'keywords': 'Palabras Clave',
      'keywordPlaceholder': 'Añadir una nueva palabra clave',
      'topicQuestions': 'Preguntas del Tema',
      'questionPlaceholder': 'Añadir una pregunta para hacer en la reunión',
      'creating': 'Creando...',
      'titleRequired': 'El campo de título es obligatorio.',
      'dateTimeRequired': 'Se requiere selección de fecha y hora.',
      'futureDateRequired': 'La fecha de la reunión debe ser en el futuro.',
      'meetingCreateSuccess': '¡Reunión creada con éxito!',
      'meetingCreateError': 'Ocurrió un error al crear la reunión.',
      'createMeetingDescription': 'Crea una nueva reunión de práctica de inglés y ayuda a los participantes como anfitrión de conversación.',
      'beginnerLevel': 'Nivel Principiante',
      'advancedLevel': 'Nivel Avanzado',
      'anyLevel': 'Cualquier Nivel',
      'business': 'Negocios',
      'education': 'Educación/Escuela',
      'science': 'Ciencia',
      'technology': 'Tecnología',
      'arts': 'Arte y Cultura',
      'travel': 'Viajes',
      'food': 'Comida y Cocina',
      'sports': 'Deportes',
      'health': 'Salud y Bienestar',
      'environment': 'Medio Ambiente',
      'entertainment': 'Entretenimiento y Pasatiempos',
      'participantCount': 'Número de Participantes',
      'participantCountHelp': 'Número de personas que pueden unirse a la reunión (entre 3-6)',
      'participantCountError': 'El número de participantes debe estar entre 3 y 6.',
      'myMeetingsDescription': 'View all meetings you created and participated in.',
      'level_beginner': 'Nivel Principiante',
      'level_intermediate': 'Nivel Intermedio',
      'level_advanced': 'Nivel Avanzado',
      'level_any': 'Cualquier Nivel',
      'topic_daily': 'Conversación Diaria',
      'topic_business': 'Negocios',
      'topic_education': 'Educación/Escuela',
      'topic_science': 'Ciencia',
      'topic_technology': 'Tecnología',
      'topic_arts': 'Arte y Cultura',
      'topic_travel': 'Viajes',
      'topic_food': 'Comida y Cocina',
      'topic_sports': 'Deportes',
      'topic_health': 'Salud y Bienestar',
      'topic_environment': 'Medio Ambiente',
      'topic_entertainment': 'Entretenimiento y Pasatiempos',
      'edit': 'Editar',
      'noMeetingsYet': 'Aún no tienes reuniones.',
      'scheduledStatus': 'Programada',
      'activeStatus': 'Activa',
      'completedStatus': 'Completada',
      'cancelledStatus': 'Cancelada',
      'meetingStatusPrefix': 'Estado',
      'meetUrl': 'Enlace de la Reunión',
      'meetingLinkCopied': 'Enlace de la reunión copiado al portapapeles',
      'googleMeetIntegration': 'Integración con Google Meet',
      'meetingWillBeActive': 'La reunión estará activa 15 minutos antes de la hora de inicio',
      'meetingActiveNow': 'Esta reunión está activa actualmente',
      'copyMeetingLink': 'Copiar Enlace de la Reunión',
      'joinMeeting': 'Unirse a la Reunión'
    },
    ar: {
      'appName': 'منصة ممارسة اللغة الإنجليزية',
      'welcome': 'مرحبا',
      'login': 'تسجيل الدخول',
      'register': 'التسجيل',
      'dashboard': 'لوحة المعلومات',
      'home': 'الصفحة الرئيسية',
      'profile': 'الملف الشخصي',
      'logout': 'تسجيل الخروج',
      'settings': 'الإعدادات',
      'statistics': 'الإحصائيات',
      'student': 'طالب',
      'welcomeMessage': 'أهلا بك، {name}!',
      'todayMessage': 'اليوم هو يوم رائع لممارسة اللغة الإنجليزية!',
      'findMeeting': 'البحث عن اجتماع',
      'quickMatch': 'مطابقة سريعة',
      'upcomingMeetings': 'الاجتماعات القادمة',
      'noUpcomingMeetings': 'ليس لديك اجتماعات قادمة.',
      'findConversationMeeting': 'البحث عن اجتماع محادثة',
      'viewAllUpcomingPractices': 'عرض جميع الممارسات القادمة',
      'conversationMeetings': 'اجتماعات المحادثة',
      'practiceRooms': 'غرف الممارسة',
      'upcomingPractices': 'الممارسات القادمة',
      'assignments': 'الواجبات',
      'popularPracticeRooms': 'غرف الممارسة الشعبية',
      'host': 'مضيف',
      'notSpecified': 'غير محدد',
      'joinRoom': 'انضم إلى الغرفة',
      'noPracticeRooms': 'لا توجد غرف ممارسة نشطة متاحة بعد.',
      'viewAllPracticeRooms': 'عرض جميع غرف الممارسة',
      'conversationHost': 'مضيف المحادثة',
      'myMeetings': 'اجتماعاتي',
      'createMeeting': 'إنشاء اجتماع',
      'participants': 'المشاركون',
      'evaluations': 'التقييمات',
      'loading': 'جاري التحميل...',
      'error': 'خطأ',
      'returnToLogin': 'العودة إلى تسجيل الدخول',
      'selectLanguage': 'اختر اللغة',
      'hostDayMessage': 'اليوم هو يوم رائع لمساعدة الآخرين على ممارسة اللغة الإنجليزية!',
      'createNewMeeting': 'إنشاء اجتماع جديد',
      'viewParticipants': 'عرض المشاركين',
      'activeMeetings': 'اجتماعاتي النشطة',
      'intermediateLevel': 'المستوى المتوسط',
      'dailyConversation': 'المحادثة اليومية',
      'date': 'التاريخ',
      'goToMeeting': 'الذهاب إلى الاجتماع',
      'noActiveMeetings': 'ليس لديك أي اجتماعات نشطة حتى الآن.',
      'viewAllMeetings': 'عرض جميع اجتماعاتي',
      'noUpcomingMeetingsScheduled': 'ليس لديك أي اجتماعات قادمة مجدولة.',
      'scheduleMeeting': 'جدولة اجتماع',
      'sectionComingSoon': 'سيكون هذا القسم متاحًا قريبًا.',
      'userProfileNotFound': 'لم يتم العثور على ملف المستخدم.',
      'profileDataError': 'حدث خطأ أثناء استرداد معلومات الملف الشخصي.',
      'meetingsAccessError': 'غير قادر على الوصول إلى معلومات الاجتماع الخاصة بك. يرجى الاتصال بالمسؤول.',
      'meetingsDataError': 'حدث خطأ أثناء استرداد معلومات الاجتماع. يرجى المحاولة مرة أخرى لاحقًا.',
      'sessionCheckError': 'حدث خطأ أثناء التحقق من الاجتماع.',
      'meetingTitle': 'عنوان الاجتماع',
      'meetingTitlePlaceholder': 'مثال: ممارسة المحادثة اليومية',
      'meetingDescription': 'وصف الاجتماع',
      'meetingDescriptionPlaceholder': 'ما الذي سيتم مناقشته في هذا الاجتماع؟',
      'meetingDate': 'تاريخ الاجتماع',
      'meetingTime': 'وقت الاجتماع',
      'level': 'المستوى',
      'topic': 'الموضوع',
      'minParticipants': 'الحد الأدنى للمشاركين',
      'maxParticipants': 'الحد الأقصى للمشاركين',
      'keywords': 'الكلمات الرئيسية',
      'keywordPlaceholder': 'أضف كلمة رئيسية جديدة',
      'topicQuestions': 'أسئلة الموضوع',
      'questionPlaceholder': 'أضف سؤالاً ليتم طرحه في الاجتماع',
      'creating': 'جاري الإنشاء...',
      'titleRequired': 'حقل العنوان مطلوب.',
      'dateTimeRequired': 'مطلوب تحديد التاريخ والوقت.',
      'futureDateRequired': 'يجب أن يكون تاريخ الاجتماع في المستقبل.',
      'meetingCreateSuccess': 'تم إنشاء الاجتماع بنجاح!',
      'meetingCreateError': 'حدث خطأ أثناء إنشاء الاجتماع.',
      'createMeetingDescription': 'قم بإنشاء اجتماع جديد لممارسة اللغة الإنجليزية ومساعدة المشاركين كمضيف للمحادثة.',
      'beginnerLevel': 'مستوى المبتدئين',
      'advancedLevel': 'مستوى متقدم',
      'anyLevel': 'أي مستوى',
      'business': 'الأعمال',
      'education': 'التعليم/المدرسة',
      'science': 'العلوم',
      'technology': 'التكنولوجيا',
      'arts': 'الفن والثقافة',
      'travel': 'السفر',
      'food': 'الطعام والمطبخ',
      'sports': 'الرياضة',
      'health': 'الصحة والعافية',
      'environment': 'البيئة',
      'entertainment': 'الترفيه والهوايات',
      'participantCount': 'عدد المشاركين',
      'participantCountHelp': 'عدد الأشخاص الذين يمكنهم الانضمام إلى الاجتماع (بين 3-6)',
      'participantCountError': 'يجب أن يكون عدد المشاركين بين 3 و 6.',
      'myMeetingsDescription': 'View all meetings you created and participated in.',
      'level_beginner': 'مستوى المبتدئين',
      'level_intermediate': 'المستوى المتوسط',
      'level_advanced': 'مستوى متقدم',
      'level_any': 'أي مستوى',
      'topic_daily': 'المحادثة اليومية',
      'topic_business': 'الأعمال',
      'topic_education': 'التعليم/المدرسة',
      'topic_science': 'العلوم',
      'topic_technology': 'التكنولوجيا',
      'topic_arts': 'الفن والثقافة',
      'topic_travel': 'السفر',
      'topic_food': 'الطعام والمطبخ',
      'topic_sports': 'الرياضة',
      'topic_health': 'الصحة والعافية',
      'topic_environment': 'البيئة',
      'topic_entertainment': 'الترفيه والهوايات',
      'edit': 'تعديل',
      'noMeetingsYet': 'ليس لديك أي اجتماعات حتى الآن.',
      'scheduledStatus': 'مجدولة',
      'activeStatus': 'نشطة',
      'completedStatus': 'مكتملة',
      'cancelledStatus': 'ملغاة',
      'meetingStatusPrefix': 'الحالة',
      'meetUrl': 'رابط الاجتماع',
      'meetingLinkCopied': 'تم نسخ رابط الاجتماع إلى الحافظة',
      'googleMeetIntegration': 'تكامل مع Google Meet',
      'meetingWillBeActive': 'سيكون الاجتماع نشطًا قبل 15 دقيقة من وقت البدء',
      'meetingActiveNow': 'هذا الاجتماع نشط حاليًا',
      'copyMeetingLink': 'نسخ رابط الاجتماع',
      'joinMeeting': 'الانضمام إلى الاجتماع'
    }
  };

  // Anahtar için çeviri varsa döndür, yoksa anahtarın kendisini döndür
  if (params) {
    let translatedText = translations[language][key] || key;
    // Parametreleri işleme
    Object.keys(params).forEach(paramKey => {
      translatedText = translatedText.replace(`{${paramKey}}`, params[paramKey]);
    });
    return translatedText;
  }
  
  return translations[language][key] || key;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);

  const languages = [
    { code: 'tr' as Language, name: 'Türkçe' },
    { code: 'en' as Language, name: 'English' },
    { code: 'es' as Language, name: 'Español' },
    { code: 'ar' as Language, name: 'العربية' },
  ];

  // Çeviri fonksiyonu
  const t = (key: string, params?: any): string => {
    return translateKey(key, currentLanguage, params);
  };

  // Dil değiştirme fonksiyonu
  const changeLanguage = async (language: Language) => {
    try {
      setCurrentLanguage(language);
      
      // Dil tercihini localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLanguage', language);
      }
      
      // Kullanıcı oturum açmışsa, veritabanında kullanıcının tercih dil ayarını güncelle
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          preferredLanguage: language,
          updatedAt: new Date()
        });
      }
      
      // URL'yi güncelle veya yeniden yönlendir
      if (pathname) {
        router.refresh(); // Sayfayı yenile
      }
      
    } catch (error) {
      console.error('Dil değiştirme hatası:', error);
    }
  };

  // Kullanıcının tercih ettiği dili kontrol et
  useEffect(() => {
    const checkUserLanguagePreference = async () => {
      let preferredLanguage: Language | null = null;
      
      // 1. Önce localStorage'dan kontrol et
      if (typeof window !== 'undefined') {
        const storedLanguage = localStorage.getItem('preferredLanguage') as Language | null;
        if (storedLanguage && languages.find(lang => lang.code === storedLanguage)) {
          preferredLanguage = storedLanguage;
        }
      }
      
      // 2. localStorage'da yoksa, kimlik doğrulaması yapılmış kullanıcı varsa onun dil tercihini kontrol et
      if (!preferredLanguage) {
        const user = auth.currentUser;
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().preferredLanguage) {
              preferredLanguage = userDoc.data().preferredLanguage as Language;
            }
          } catch (error) {
            console.error('Kullanıcı dil tercihi alınamadı:', error);
          }
        }
      }
      
      // 3. Hala bir dil belirlenmediyse tarayıcı dilini kontrol et
      if (!preferredLanguage) {
        const browserLang = navigator.language.split('-')[0];
        const supportedBrowserLang = languages.find(lang => lang.code === browserLang)?.code;
        
        if (supportedBrowserLang) {
          preferredLanguage = supportedBrowserLang;
        }
      }
      
      // Eğer bir dil belirlediyse ve mevcut dilden farklıysa değiştir
      if (preferredLanguage && preferredLanguage !== currentLanguage) {
        setCurrentLanguage(preferredLanguage);
      }
    };
    
    checkUserLanguagePreference();
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 