'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, User, BarChart, Clock, Settings, LogOut, Calendar, CheckSquare, Plus, MinusCircle } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useToast } from '@/lib/context/ToastContext';
import { Shimmer, ShimmerCard, ShimmerList } from '@/components/ui/Shimmer';

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface UserProfile {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  role?: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  level: string;
  topic: string;
  participantCount: number;
  status: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  meetUrl?: string;
  zoomMeetingId?: string;
}

interface FirebaseError extends Error {
  code: string;
}

export default function ProUserPanel() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeMeetings, setActiveMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const toast = useToast();
  
  // Toplantı verilerini getir
  const fetchMeetingData = useCallback(async (userId: string) => {
    try {
      console.log('ProUser ID:', userId);
      
      // Aktif toplantıları getir
      const meetingsQuery = query(
        collection(db, 'meetings'),
        where('hostId', '==', userId),
        where('status', '==', 'active'),
        orderBy('startTime', 'asc')
      );
      
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetingsData: Meeting[] = [];
      
      meetingsSnapshot.forEach((doc) => {
        const data = doc.data();
        meetingsData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          startTime: data.startTime.toDate(), // Firestore Timestamp'i Date'e çevir
          level: data.level,
          topic: data.topic,
          participantCount: data.participantCount,
          status: data.status,
          participants: data.participants || [],
          meetUrl: data.meetUrl,
          zoomMeetingId: data.zoomMeetingId
        });
      });
      
      setActiveMeetings(meetingsData);
      
    } catch (err: unknown) {
      console.error('Toplantı verileri alınamadı:', err);
      // Hata mesajını daha kullanıcı dostu hale getir
      if (err instanceof Error && 'code' in err && (err as FirebaseError).code === 'permission-denied') {
        console.log('Yetki hatası: Meetings koleksiyonuna erişim izni yok');
        setError(t('meetingsAccessError', 'Toplantılara erişim izniniz yok.'));
      } else {
        setError(t('meetingsDataError', 'Toplantı verileri alınırken bir hata oluştu.'));
      }
    }
  }, [t, setError]);
  
  // Kullanıcı profilini getir
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        
        // Kullanıcı proUser değilse yönlendir
        if (userData.role !== 'proUser') {
          if (userData.role === 'admin') {
            router.push('/dashboard');
          } else if (userData.role === 'teacher') {
            router.push('/teacher-panel');
          } else if (userData.role === 'student') {
            router.push('/student-panel');
          } else {
            router.push('/');
          }
          return;
        }
        
        // Aktif toplantıları getir
        await fetchMeetingData(userId);
      } else {
        setError(t('userProfileNotFound', 'Kullanıcı profili bulunamadı.'));
      }
    } catch (err) {
      console.error('Profil verisi alınamadı:', err);
      setError(t('profileDataError', 'Profil verileri alınırken bir hata oluştu.'));
    }
  }, [router, t, fetchMeetingData, setError]);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
          if (user) {
            setUser(user);
            await fetchUserProfile(user.uid);
          } else {
            // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
            router.push('/login');
          }
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Auth kontrolü sırasında hata:', err);
        setError(t('sessionCheckError', 'Toplantı kontrolü sırasında bir hata oluştu.'));
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router, fetchUserProfile, t]);
  
  // Toplantı seviyesi için çevirileri manuel olarak yapan yardımcı fonksiyon
  const getLevelTranslation = (level: string) => {
    return t(`level_${level}`, getLevelFallback(level));
  };

  // Level için fallback değerlerini döndüren yardımcı fonksiyon
  const getLevelFallback = (level: string) => {
    switch(level) {
      case 'beginner': return 'Başlangıç Seviyesi';
      case 'intermediate': return 'Orta Seviye';
      case 'advanced': return 'İleri Seviye';
      case 'any': return 'Tüm Seviyeler';
      default: return level;
    }
  };

  // Toplantı konusu için çevirileri manuel olarak yapan yardımcı fonksiyon
  const getTopicTranslation = (topic: string) => {
    return t(`topic_${topic}`, getTopicFallback(topic));
  };

  // Topic için fallback değerlerini döndüren yardımcı fonksiyon
  const getTopicFallback = (topic: string) => {
    switch(topic) {
      case 'daily': return 'Günlük Konuşma';
      case 'business': return 'İş Dünyası';
      case 'education': return 'Eğitim/Okul';
      case 'science': return 'Bilim';
      case 'technology': return 'Teknoloji';
      case 'arts': return 'Sanat ve Kültür';
      case 'travel': return 'Seyahat';
      case 'food': return 'Yemek ve Mutfak';
      case 'sports': return 'Spor';
      case 'health': return 'Sağlık ve Wellness';
      case 'environment': return 'Çevre';
      case 'entertainment': return 'Eğlence ve Hobiler';
      default: return topic;
    }
  };
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col gap-6 p-6 bg-slate-50">
        {/* Shimmer yükleme efekti */}
        <div className="bg-white p-6 shadow-md rounded-lg border-l-4 border-emerald-500">
          <Shimmer className="w-3/4" height="1.75rem" />
          <Shimmer className="w-1/2 mt-2" height="1rem" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShimmerCard rows={2} />
          <ShimmerCard rows={1} />
        </div>
        
        <ShimmerList items={3} />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-lg max-w-md shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-red-600">{t('error')}</h2>
          <p className="text-slate-600">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-5 w-full py-2 px-4 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            {t('returnToLogin')}
          </button>
        </div>
      </div>
    );
  }
  
  // Menü öğeleri - ProUser için özelleştirilmiş
  const menuItems = [
    { id: 'dashboard', label: t('home'), icon: <Home size={18} /> },
    { id: 'my-meetings', label: t('myMeetings'), icon: <Calendar size={18} /> },
    { id: 'create-meeting', label: t('createMeeting'), icon: <MessageCircle size={18} /> },
    { id: 'participants', label: t('participants'), icon: <Users size={18} /> },
    { id: 'evaluations', label: t('evaluations'), icon: <CheckSquare size={18} /> },
    { id: 'profile', label: t('profile'), icon: <User size={18} /> },
    { id: 'statistics', label: t('statistics'), icon: <BarChart size={18} /> },
    { id: 'settings', label: t('settings'), icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Mobil menü butonu */}
      <div className="bg-white p-4 flex justify-between items-center md:hidden border-b shadow-sm sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-slate-800">{t('appName')}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Yan menü */}
        <div className={`bg-white border-r shadow-sm fixed md:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center gap-3 pb-2">
              {userProfile?.photoURL ? (
                <Image 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName || t('profile')}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white/30"
                />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-medium border-2 border-white/30">
                  {userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div className="font-medium">
                  {userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}` || t('conversationHost')}
                </div>
                <div className="text-xs text-white/80">
                  {userProfile?.role === 'proUser' ? t('conversationHost') : userProfile?.role}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-md text-sm transition-all duration-200 ${
                      activeTab === item.id 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm border border-blue-100' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full py-2.5 px-3 rounded-md text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              </li>
            </ul>
            
            <div className="mt-6 px-3 py-4 border-t pt-4">
              <p className="text-xs text-slate-500 mb-2">{t('selectLanguage')}</p>
              <LanguageSwitcher variant="select" className="w-full" />
            </div>
          </div>
        </div>
        
        {/* Ana içerik alanı */}
        <div className="flex-1 p-4 md:p-6 md:pt-6 overflow-auto">
          <div className="hidden md:flex md:justify-between md:items-center mb-6">
            <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
              {activeTab === 'dashboard' && <Home size={20} className="text-blue-600" />}
              {activeTab === 'my-meetings' && <Calendar size={20} className="text-blue-600" />}
              {activeTab === 'create-meeting' && <MessageCircle size={20} className="text-blue-600" />}
              {activeTab === 'participants' && <Users size={20} className="text-blue-600" />}
              {activeTab === 'evaluations' && <CheckSquare size={20} className="text-blue-600" />}
              {activeTab === 'profile' && <User size={20} className="text-blue-600" />}
              {activeTab === 'statistics' && <BarChart size={20} className="text-blue-600" />}
              {activeTab === 'settings' && <Settings size={20} className="text-blue-600" />}
              {menuItems.find(item => item.id === activeTab)?.label || t('appName')}
            </h1>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
  
  // Ana içerik renderlaması
  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Hoş geldin kartı */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 border border-blue-400/30">
              <h2 className="text-2xl font-semibold text-white mb-2">
                {t('welcomeMessage', 'Hoş geldiniz, {{name}}').replace('{{name}}', userProfile?.displayName || userProfile?.firstName || t('conversationHost', 'Konuşma Sunucusu'))}
              </h2>
              <p className="text-white/90 mb-6">{t('hostDayMessage', 'Konuşma sunucusu olarak bugün yeni bir toplantı oluşturabilir ve İngilizce pratik yapmak isteyen öğrencilere yardımcı olabilirsiniz.')}</p>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setActiveTab('create-meeting')}
                  className="px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  {t('createNewMeeting', 'Yeni Toplantı Oluştur')}
                </button>
                <button 
                  onClick={() => setActiveTab('participants')}
                  className="px-5 py-2.5 bg-blue-700/30 hover:bg-blue-700/40 text-white rounded-lg transition-colors text-sm font-medium shadow-sm border border-white/10 flex items-center gap-2"
                >
                  <Users size={16} />
                  {t('viewParticipants', 'Katılımcıları Görüntüle')}
                </button>
              </div>
            </div>
            
            {/* Aktif Toplantılarım */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3.5 flex items-center justify-between">
                <h2 className="text-base font-medium text-white flex items-center gap-2">
                  <Calendar size={18} />
                  {t('activeMeetings', 'Aktif Toplantılar')}
                </h2>
                <button 
                  onClick={() => setActiveTab('create-meeting')}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Plus size={12} />
                    {t('createNewMeeting', 'Yeni Toplantı Oluştur')}
                  </span>
                </button>
              </div>
              <div className="p-6">
                {activeMeetings.length > 0 ? (
                  <div className="grid gap-4">
                    {activeMeetings.map((meeting) => (
                      <div key={meeting.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 bg-white">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-medium text-slate-800">{meeting.title}</h3>
                          <div className="flex items-center gap-2">
                            {/* Toplantı durumu */}
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              meeting.status === 'active' ? 'bg-green-100 text-green-700' : 
                              meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              meeting.status === 'completed' ? 'bg-gray-100 text-gray-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {meeting.status === 'active' && t('activeStatus', 'Aktif')}
                              {meeting.status === 'scheduled' && t('scheduledStatus', 'Zamanlanmış')}
                              {meeting.status === 'completed' && t('completedStatus', 'Tamamlandı')}
                              {meeting.status === 'cancelled' && t('cancelledStatus', 'İptal Edildi')}
                            </span>
                            
                            {/* Seviye */}
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {getLevelTranslation(meeting.level || 'intermediate')}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm mt-2 mb-3">{meeting.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <MessageCircle size={12} />
                            {getTopicTranslation(meeting.topic || 'daily')}
                          </span>
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <Users size={12} />
                            {meeting.participants?.length || 0}/{meeting.participantCount || 6} {t('participants', 'katılımcı')}
                          </span>
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <Clock size={12} />
                            {meeting.startTime instanceof Date ? meeting.startTime.toLocaleDateString() : t('notSpecified', 'Belirtilmemiş')}, 
                            {meeting.startTime instanceof Date ? meeting.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        
                        {/* Zoom Bağlantısı */}
                        {meeting.meetUrl && (
                          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" fill="#2D8CFF" stroke="none" />
                                  <rect x="3" y="6" width="12" height="12" rx="2" ry="2" fill="#2D8CFF" fillOpacity="0.8" stroke="none" />
                                </svg>
                                {t('meetUrl', 'Zoom Toplantı Bağlantısı')}:
                              </span>
                              <div className="flex gap-2">
                                <button 
                                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md transition-colors"
                                  onClick={() => {
                                    if (meeting.meetUrl) {
                                      navigator.clipboard.writeText(meeting.meetUrl);
                                      toast.success(t('meetingLinkCopied', 'Toplantı bağlantısı panoya kopyalandı'));
                                    }
                                  }}
                                >
                                  {t('copyMeetingLink', 'Kopyala')}
                                </button>
                                <a 
                                  href={meeting.meetUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                >
                                  {t('joinMeeting', 'Katıl')}
                                </a>
                              </div>
                            </div>
                            {meeting.zoomMeetingId && (
                              <div className="mt-2 text-xs text-slate-500">
                                {t('meetingId', 'Toplantı ID')}: {meeting.zoomMeetingId}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2">
                          <button 
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium flex items-center gap-1"
                            onClick={() => console.log('Edit meeting:', meeting.id)}
                          >
                            {t('edit', 'Düzenle')} <Settings size={14} />
                          </button>
                          {meeting.status === 'active' && (
                            <button 
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors text-sm font-medium shadow-sm flex items-center gap-1"
                              onClick={() => router.push(`/meetings/${meeting.id}`)}
                            >
                              {t('goToMeeting', 'Toplantıya Git')} <Calendar size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 rounded-xl bg-slate-50/50 border border-slate-100">
                    <Calendar size={40} className="mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 mb-4">{t('noActiveMeetings', 'Aktif toplantınız bulunmuyor.')}</p>
                    <button 
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors text-sm font-medium shadow-sm inline-flex items-center gap-2"
                      onClick={() => setActiveTab('create-meeting')}
                    >
                      <Plus size={16} />
                      {t('createNewMeeting', 'Yeni Toplantı Oluştur')}
                    </button>
                  </div>
                )}
                
                <div className="mt-6 text-right">
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors inline-flex items-center gap-1"
                    onClick={() => setActiveTab('my-meetings')}
                  >
                    {t('viewAllMeetings', 'Tüm Toplantıları Görüntüle')} <Calendar size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Yaklaşan Toplantılar */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3.5 flex items-center justify-between">
                <h2 className="text-base font-medium text-white flex items-center gap-2">
                  <Clock size={18} />
                  {t('upcomingMeetings', 'Yaklaşan Toplantılar')}
                </h2>
              </div>
              <div className="p-6">
                <div className="text-center py-10 px-4 rounded-xl bg-slate-50/50 border border-slate-100">
                  <Clock size={40} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-600 mb-4">{t('noUpcomingMeetingsScheduled', 'Yaklaşan toplantı planlanmamış.')}</p>
                  <button 
                    className="px-5 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-colors text-sm font-medium shadow-sm inline-flex items-center gap-2"
                    onClick={() => setActiveTab('create-meeting')}
                  >
                    <Plus size={16} />
                    {t('scheduleMeeting', 'Toplantı Planla')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'create-meeting':
        if (!userProfile) {
          return <div>{t('profileNotFound', 'Profil bulunamadı')}</div>;
        }
        return <CreateMeetingForm 
          userId={user?.uid} 
          userProfile={userProfile} 
          setActiveTab={setActiveTab} 
        />;
      
      case 'my-meetings':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white">
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Calendar size={20} />
                {t('myMeetings', 'Toplantılarım')}
              </h2>
              <p className="text-white/80">{t('myMeetingsDescription', 'Oluşturduğunuz ve katıldığınız tüm toplantıları görüntüleyin.')}</p>
            </div>
            
            {activeMeetings.length > 0 ? (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="grid gap-4">
                  {activeMeetings.map((meeting) => (
                    <div key={meeting.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 bg-white">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium text-slate-800">{meeting.title}</h3>
                        <div className="flex items-center gap-2">
                          {/* Toplantı durumu */}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            meeting.status === 'active' ? 'bg-green-100 text-green-700' : 
                            meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            meeting.status === 'completed' ? 'bg-gray-100 text-gray-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {meeting.status === 'active' && t('activeStatus', 'Aktif')}
                            {meeting.status === 'scheduled' && t('scheduledStatus', 'Zamanlanmış')}
                            {meeting.status === 'completed' && t('completedStatus', 'Tamamlandı')}
                            {meeting.status === 'cancelled' && t('cancelledStatus', 'İptal Edildi')}
                          </span>
                          
                          {/* Seviye */}
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {getLevelTranslation(meeting.level || 'intermediate')}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm mt-2 mb-3">{meeting.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <MessageCircle size={12} />
                          {getTopicTranslation(meeting.topic || 'daily')}
                        </span>
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Users size={12} />
                          {meeting.participants?.length || 0}/{meeting.participantCount || 6} {t('participants', 'katılımcı')}
                        </span>
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Clock size={12} />
                          {meeting.startTime instanceof Date ? meeting.startTime.toLocaleDateString() : t('notSpecified', 'Belirtilmemiş')}, 
                          {meeting.startTime instanceof Date ? meeting.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium flex items-center gap-1"
                          onClick={() => console.log('Edit meeting:', meeting.id)}
                        >
                          {t('edit', 'Düzenle')} <Settings size={14} />
                        </button>
                        {meeting.status === 'active' && (
                          <button 
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors text-sm font-medium shadow-sm flex items-center gap-1"
                            onClick={() => router.push(`/meetings/${meeting.id}`)}
                          >
                            {t('goToMeeting', 'Toplantıya Git')} <Calendar size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Calendar size={60} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-5 text-lg">{t('noMeetingsYet', 'Henüz toplantınız bulunmuyor.')}</p>
                <button 
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors shadow-sm inline-flex items-center gap-2"
                  onClick={() => setActiveTab('create-meeting')}
                >
                  <Plus size={18} />
                  {t('createNewMeeting', 'Yeni Toplantı Oluştur')}
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-xl shadow-md border border-slate-200/50 overflow-hidden p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Settings size={30} className="text-slate-400" />
            </div>
            <p className="text-slate-600">{t('sectionComingSoon', 'Bu bölüm yakında kullanıma açılacak.')}</p>
          </div>
        );
    }
  }
}

interface MeetingFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  level: string;
  topic: string;
  participantCount: number;
  keywords: string[];
  questions: string[];
  isSubmitting: boolean;
  error: string;
  success: string;
}

interface CreateMeetingFormProps {
  userId: string | undefined;
  userProfile: UserProfile;
  setActiveTab: (tab: string) => void;
}

function CreateMeetingForm({ userId, userProfile, setActiveTab }: CreateMeetingFormProps) {
  const { t } = useLanguage();
  const toast = useToast();
  
  // Form State
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    level: 'intermediate', // Default: Orta Seviye
    topic: 'daily', // Default: Günlük Konuşma
    participantCount: 6, // Default: 6 katılımcı
    keywords: [],
    questions: [],
    isSubmitting: false,
    error: '',
    success: ''
  });
  
  // Anahtar kelimeler için state
  const [currentKeyword, setCurrentKeyword] = useState('');
  
  // Konu soruları için state
  const [currentQuestion, setCurrentQuestion] = useState('');
  
  // Form verisini güncelleme fonksiyonu
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Anahtar kelime ekleme işlevi
  const addKeyword = () => {
    if (currentKeyword.trim() && !formData.keywords.includes(currentKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, currentKeyword.trim()]
      }));
      setCurrentKeyword('');
    }
  };
  
  // Anahtar kelime silme işlevi
  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };
  
  // Soru ekleme işlevi
  const addQuestion = () => {
    if (currentQuestion.trim() && !formData.questions.includes(currentQuestion.trim())) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, currentQuestion.trim()]
      }));
      setCurrentQuestion('');
    }
  };
  
  // Soru silme işlevi
  const removeQuestion = (question: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q !== question)
    }));
  };
  
  // Form gönderme işlevi
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setFormData(prev => ({ ...prev, isSubmitting: true, error: '' }));
      
      // Form validasyonu
      if (!formData.title.trim()) {
        const errorMsg = t('titleRequired', 'Başlık alanı zorunludur.');
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!formData.date || !formData.time) {
        const errorMsg = t('dateTimeRequired', 'Tarih ve saat seçimi zorunludur.');
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Tarih bilgisini oluştur
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.time.split(':').map(Number);
      
      // Yeni tarih nesnesi oluştur - tarayıcı zaman diliminde
      const meetingDateTime = new Date(year, month - 1, day, hours, minutes);
      
      // Geçerli zamanla karşılaştır
      const now = new Date();
      if (meetingDateTime < now) {
        const errorMsg = t('futureDateRequired', 'Toplantı tarihi gelecekte olmalıdır.');
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Katılımcı sayısı doğrulama
      if (formData.participantCount < 3 || formData.participantCount > 6) {
        const errorMsg = t('participantCountError', 'Katılımcı sayısı 3 ile 6 arasında olmalıdır.');
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      try {
        // Zoom API'si üzerinden doğrudan toplantı oluştur
        const { ZoomService } = await import('@/lib/services/ZoomService');
        
        // Manuel olarak parametreleri kontrol et ve hata yoksa devam et
        if (!formData.title || !formData.description || !meetingDateTime) {
          throw new Error('Form bilgilerini kontrol edin. Başlık, açıklama ve tarih alanları zorunludur.');
        }
        
        const zoomResult = await ZoomService.createMeeting({
          title: formData.title,
          description: formData.description || "Açıklama yok",
          startTime: meetingDateTime.toISOString(),
          duration: 60
        });
        
        if (zoomResult && zoomResult.join_url && zoomResult.id) {
          // Toplantıyı Firestore'a kaydet
          const meetingRef = await addDoc(collection(db, 'meetings'), {
            title: formData.title,
            description: formData.description,
            startTime: meetingDateTime,
            level: formData.level,
            topic: formData.topic,
            participantCount: formData.participantCount,
            keywords: formData.keywords,
            questions: formData.questions,
            hostId: userId || '',
            hostName: userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}`,
            hostPhotoURL: userProfile?.photoURL || null,
            status: 'active',
            participants: [],
            meetUrl: zoomResult.join_url,
            zoomMeetingId: zoomResult.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          console.log('Toplantı oluşturuldu, ID:', meetingRef.id);
          
          // Başarılı mesajı göster
          const successMsg = t('meetingCreateSuccess', 'Toplantı başarıyla oluşturuldu!');
          toast.success(successMsg);
          
          setFormData({
            title: '',
            description: '',
            date: '',
            time: '',
            level: 'intermediate',
            topic: 'daily',
            participantCount: 6,
            keywords: [],
            questions: [],
            isSubmitting: false,
            error: '',
            success: successMsg
          });
          
          // Toplantı sayfasına yönlendir
          setActiveTab('my-meetings');
        } else {
          throw new Error('Zoom toplantısı oluşturulamadı');
        }
      } catch (error: unknown) {
        console.error('Toplantı oluşturulurken hata:', error);
        const errorMsg = error instanceof Error ? error.message : t('meetingCreateError', 'Toplantı oluşturulurken bir hata oluştu.');
        toast.error(errorMsg);
        
        setFormData(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          error: errorMsg
        }));
      }
    } catch (error: unknown) {
      console.error('Toplantı oluşturulurken hata:', error);
      const errorMsg = error instanceof Error ? error.message : t('meetingCreateError', 'Toplantı oluşturulurken bir hata oluştu.');
      
      setFormData(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMsg
      }));
    }
  };
  
  // Konu seçenekleri
  const topicOptions = [
    { value: 'daily', label: t('dailyConversation', 'Günlük Konuşma') },
    { value: 'business', label: t('business', 'İş Dünyası') },
    { value: 'education', label: t('education', 'Eğitim/Okul') },
    { value: 'science', label: t('science', 'Bilim') },
    { value: 'technology', label: t('technology', 'Teknoloji') },
    { value: 'arts', label: t('arts', 'Sanat ve Kültür') },
    { value: 'travel', label: t('travel', 'Seyahat') },
    { value: 'food', label: t('food', 'Yemek ve Mutfak') },
    { value: 'sports', label: t('sports', 'Spor') },
    { value: 'health', label: t('health', 'Sağlık ve Wellness') },
    { value: 'environment', label: t('environment', 'Çevre') },
    { value: 'entertainment', label: t('entertainment', 'Eğlence ve Hobiler') },
  ];
  
  // Seviye seçenekleri
  const levelOptions = [
    { value: 'beginner', label: t('beginnerLevel', 'Başlangıç Seviyesi') },
    { value: 'intermediate', label: t('intermediateLevel', 'Orta Seviye') },
    { value: 'advanced', label: t('advancedLevel', 'İleri Seviye') },
    { value: 'any', label: t('anyLevel', 'Tüm Seviyeler') },
  ];
  
  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <MessageCircle size={20} />
          {t('createMeeting', 'Toplantı Oluştur')}
        </h2>
        <p className="text-white/80">{t('createMeetingDescription', 'Yeni bir İngilizce pratik toplantısı oluşturun ve konuşma sunucusu olarak katılımcılara yardımcı olun.')}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Başlık ve Açıklama */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              {t('meetingTitle', 'Toplantı Başlığı')} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={t('meetingTitlePlaceholder', 'Örn: Günlük Konuşma Pratiği')}
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              {t('meetingDescription', 'Toplantı Açıklaması')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={t('meetingDescriptionPlaceholder', 'Bu toplantıda neler konuşulacak?')}
            />
          </div>
        </div>
        
        {/* Tarih, Saat, Seviye ve Konu */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-2">
                {t('meetingDate', 'Toplantı Tarihi')} *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                min={new Date().toISOString().split('T')[0]} // Bugün ve sonrası için
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-2">
                {t('meetingTime', 'Toplantı Saati')} *
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-2">
                {t('level', 'Seviye')}
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {levelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
                {t('topic', 'Konu')}
              </label>
              <select
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {topicOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Katılımcı Sayısı */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <label htmlFor="participantCount" className="block text-sm font-medium text-slate-700 mb-3 flex items-center justify-between">
              <span>{t('participantCount', 'Katılımcı Sayısı')}</span>
              <span className="text-lg font-medium text-blue-700 px-3 py-1 bg-blue-100 rounded-full">
                {formData.participantCount}
              </span>
            </label>
            <div className="flex items-center">
              <input
                type="range"
                id="participantCount"
                name="participantCount"
                value={formData.participantCount}
                onChange={handleChange}
                min="3"
                max="6"
                className="w-full accent-blue-600"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">{t('participantCountHelp', 'Toplantıya katılabilecek kişi sayısı (3-6 arası)')}</p>
          </div>
        </div>
        
        {/* Anahtar Kelimeler */}
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {t('keywords', 'Anahtar Kelimeler')}
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentKeyword}
              onChange={(e) => setCurrentKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={t('keywordPlaceholder', 'Yeni anahtar kelime ekle')}
            />
            <button
              type="button"
              onClick={addKeyword}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors shadow-sm flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          </div>
          {formData.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1.5 text-sm"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    <MinusCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Konu Soruları */}
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {t('topicQuestions', 'Konu Soruları')}
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={t('questionPlaceholder', 'Toplantıda sorulacak bir soru ekle')}
            />
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors shadow-sm flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          </div>
          {formData.questions.length > 0 && (
            <div className="space-y-2 mt-3">
              {formData.questions.map((question, index) => (
                <div
                  key={index}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-lg flex items-center justify-between text-sm shadow-sm"
                >
                  <span>{question}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question)}
                    className="text-slate-600 hover:text-red-600 focus:outline-none"
                  >
                    <MinusCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Hata/Başarı Mesajları */}
        {formData.error && (
          <div className="px-4 py-3 bg-red-100 text-red-800 rounded-lg border border-red-200 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            {formData.error}
          </div>
        )}
        
        {formData.success && (
          <div className="px-4 py-3 bg-green-100 text-green-800 rounded-lg border border-green-200 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {formData.success}
          </div>
        )}
        
        {/* Gönderme Butonu */}
        <div className="pt-6 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={formData.isSubmitting}
            className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium shadow-md hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 flex items-center gap-2 ${formData.isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {formData.isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('creating', 'Oluşturuluyor...')}
              </>
            ) : (
              <>
                <Calendar size={18} />
                {t('createMeeting', 'Toplantı Oluştur')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 