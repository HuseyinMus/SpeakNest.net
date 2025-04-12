'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, FileText, User, BarChart, Clock, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function StudentPanel() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
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
        setError('Oturum kontrolü sırasında bir hata oluştu.');
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Kullanıcı profilini getir
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        
        // Kullanıcı öğrenci değilse yönlendir
        if (userData.role !== 'student') {
          if (userData.role === 'admin') {
            router.push('/dashboard');
          } else if (userData.role === 'teacher') {
            router.push('/teacher-panel');
          } else {
            router.push('/');
          }
          return;
        }
        
        // Kurslar ve ödevleri getir
        await fetchStudentData(userId);
      } else {
        setError('Kullanıcı profili bulunamadı.');
      }
    } catch (err) {
      console.error('Profil verisi alınamadı:', err);
      setError('Profil bilgileri alınırken bir hata oluştu.');
    }
  };
  
  // Öğrenci verilerini getir (kurslar, ödevler)
  const fetchStudentData = async (userId: string) => {
    try {
      // Aktif kursları getir
      const coursesQuery = query(
        collection(db, 'courses'),
        where('students', 'array-contains', userId),
        where('isActive', '==', true)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData: any[] = [];
      
      coursesSnapshot.forEach((doc) => {
        coursesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setActiveCourses(coursesData);
      
      // Bekleyen ödevleri getir
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('studentId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('dueDate', 'asc'),
        limit(5)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData: any[] = [];
      
      assignmentsSnapshot.forEach((doc) => {
        assignmentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPendingAssignments(assignmentsData);
      
    } catch (err) {
      console.error('Öğrenci verileri alınamadı:', err);
      setError('Kurs ve ödev bilgileri alınırken bir hata oluştu.');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center p-8 rounded-lg bg-white shadow-sm">
          <div className="w-10 h-10 rounded-full border-2 border-t-slate-500 border-b-slate-300 border-l-transparent border-r-transparent animate-spin mb-4"></div>
          <div className="text-lg font-medium text-slate-700">Yükleniyor...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-lg max-w-md shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-red-600">Hata</h2>
          <p className="text-slate-600">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-5 w-full py-2 px-4 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }
  
  // Menü öğeleri
  const menuItems = [
    { id: 'dashboard', label: t('home'), icon: <Home size={18} /> },
    { id: 'sessions', label: t('conversationMeetings'), icon: <MessageCircle size={18} /> },
    { id: 'practice-rooms', label: t('practiceRooms'), icon: <Users size={18} /> },
    { id: 'upcoming', label: t('upcomingPractices'), icon: <Clock size={18} /> },
    { id: 'assignments', label: t('assignments'), icon: <FileText size={18} /> },
    { id: 'profile', label: t('profile'), icon: <User size={18} /> },
    { id: 'statistics', label: t('statistics'), icon: <BarChart size={18} /> },
    { id: 'settings', label: t('settings'), icon: <Settings size={18} /> },
  ];

  // Ana içerik renderlaması
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Hoş geldin kartı */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 border border-blue-400">
              <h2 className="text-xl font-semibold text-white mb-2">{t('welcomeMessage', { name: userProfile?.displayName || userProfile?.firstName || t('student') })}</h2>
              <p className="text-white opacity-90">{t('todayMessage')}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 rounded-md transition-colors text-sm font-medium shadow-sm">
                  {t('findMeeting')}
                </button>
                <button className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 rounded-md transition-colors text-sm font-medium shadow-sm">
                  {t('quickMatch')}
                </button>
              </div>
            </div>
            
            {/* Yaklaşan Konuşma Toplantıları */}
            <div className="bg-white rounded-lg shadow-md border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-3">
                <h2 className="text-base font-medium text-white">{t('upcomingMeetings')}</h2>
              </div>
              <div className="p-6">
                <div className="text-center py-8 rounded-md bg-blue-50">
                  <p className="text-blue-700">{t('noUpcomingMeetings')}</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-md hover:from-indigo-700 hover:to-blue-600 transition-colors text-sm shadow-sm"
                    onClick={() => setActiveTab('sessions')}
                  >
                    {t('findConversationMeeting')}
                  </button>
                </div>
                
                <div className="mt-4 text-right">
                  <button 
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                    onClick={() => setActiveTab('upcoming')}
                  >
                    {t('viewAllUpcomingPractices')} →
                  </button>
                </div>
              </div>
            </div>
            
            {/* Pratik Odaları */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-600 px-6 py-3">
                <h2 className="text-base font-medium text-white">{t('popularPracticeRooms')}</h2>
              </div>
              <div className="p-6">
                {activeCourses.length > 0 ? (
                  <div className="grid gap-4">
                    {activeCourses.map((course) => (
                      <div key={course.id} className="border border-slate-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
                        <h3 className="text-lg font-medium text-slate-800">{course.title}</h3>
                        <p className="text-slate-600 text-sm mt-1">{course.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            {t('host')}: {course.instructorName || t('notSpecified')}
                          </span>
                          <button 
                            className="text-sm px-3 py-1.5 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                            onClick={() => router.push(`/courses/${course.id}`)}
                          >
                            {t('joinRoom')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-md bg-slate-50">
                    <p className="text-slate-500">{t('noPracticeRooms')}</p>
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button 
                    className="text-slate-700 hover:text-slate-900 text-sm font-medium transition-colors"
                    onClick={() => setActiveTab('practice-rooms')}
                  >
                    {t('viewAllPracticeRooms')} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'sessions':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-700 px-6 py-3">
              <h2 className="text-base font-medium text-white">Konuşma Oturumları</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Açık Oturumlar</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="border border-slate-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between">
                      <h4 className="text-lg font-medium text-slate-800">Daily Conversation Practice</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Açık</span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">Practice everyday English with native speakers.</p>
                    <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                      <div>Host: <span className="font-medium">Sarah Johnson</span></div>
                      <div>Tarih: <span className="font-medium">24 Nisan 2023, 18:00</span></div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center space-x-1">
                        <span className="flex items-center text-sm text-slate-600">
                          <Users size={14} className="mr-1" /> 3/8 Katılımcı
                        </span>
                      </div>
                      <button className="text-sm px-3 py-1.5 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors">
                        Kaydol
                      </button>
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between">
                      <h4 className="text-lg font-medium text-slate-800">Business English</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Açık</span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">Improve your business English skills for professional settings.</p>
                    <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                      <div>Host: <span className="font-medium">Michael Brown</span></div>
                      <div>Tarih: <span className="font-medium">26 Nisan 2023, 20:00</span></div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center space-x-1">
                        <span className="flex items-center text-sm text-slate-600">
                          <Users size={14} className="mr-1" /> 2/6 Katılımcı
                        </span>
                      </div>
                      <button className="text-sm px-3 py-1.5 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors">
                        Kaydol
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Kayıtlı Olduğum Oturumlar</h3>
                <div className="text-center py-8 rounded-md bg-slate-50">
                  <p className="text-slate-500">Henüz kayıtlı olduğunuz bir konuşma oturumu bulunmamaktadır.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'practice-rooms':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-700 px-6 py-3">
              <h2 className="text-base font-medium text-white">Pratik Odaları</h2>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-800">Tüm Odalar</h3>
                <div className="flex space-x-2">
                  <select className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-700">
                    <option>Tüm Seviyeler</option>
                    <option>Başlangıç</option>
                    <option>Orta</option>
                    <option>İleri</option>
                  </select>
                  <select className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-700">
                    <option>Tüm Konular</option>
                    <option>Günlük Konuşma</option>
                    <option>İş İngilizcesi</option>
                    <option>Seyahat</option>
                  </select>
                </div>
              </div>
              
              {activeCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCourses.map((course) => (
                    <div key={course.id} className="border border-slate-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
                      <h3 className="text-lg font-medium text-slate-800">{course.title}</h3>
                      <p className="text-slate-600 text-sm mt-1">{course.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {course.level || 'Orta Seviye'}
                        </span>
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {course.topic || 'Günlük Konuşma'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          Host: {course.instructorName || 'Belirtilmemiş'}
                        </span>
                        <button 
                          className="text-sm px-3 py-1.5 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                          onClick={() => router.push(`/courses/${course.id}`)}
                        >
                          Odaya Katıl
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-md bg-slate-50">
                  <p className="text-slate-500">Henüz aktif pratik odası bulunmamaktadır.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'upcoming':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-700 px-6 py-3">
              <h2 className="text-base font-medium text-white">Yaklaşan Pratiklerim</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8 rounded-md bg-slate-50">
                <p className="text-slate-500">Yaklaşan pratik oturumunuz bulunmamaktadır.</p>
                <button 
                  className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
                  onClick={() => setActiveTab('sessions')}
                >
                  Konuşma Oturumu Bul
                </button>
              </div>
            </div>
          </div>
        );
      case 'assignments':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-600 px-6 py-3">
              <h2 className="text-base font-medium text-white">Tüm Ödevlerim</h2>
            </div>
            <div className="p-6">
              {pendingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {pendingAssignments.map((assignment) => (
                    <div key={assignment.id} className="border border-slate-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-slate-800">{assignment.title}</h3>
                          <p className="text-slate-600 text-sm mt-1">{assignment.description}</p>
                          <span className="text-sm text-slate-500 block mt-2">
                            Pratik Odası: {assignment.courseName || 'Belirtilmemiş'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            new Date(assignment.dueDate.seconds * 1000) < new Date() 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            Teslim: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button 
                          className="text-sm px-3 py-1.5 rounded-md bg-slate-600 text-white hover:bg-slate-700 transition-colors"
                          onClick={() => router.push(`/assignments/${assignment.id}`)}
                        >
                          Ödevi Görüntüle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-md bg-slate-50">
                  <p className="text-slate-500">Bekleyen ödeviniz bulunmamaktadır.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-700 px-6 py-3">
              <h2 className="text-base font-medium text-white">Profil Bilgilerim</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-slate-200 shadow-sm">
                  {userProfile?.photoURL ? (
                    <Image 
                      src={userProfile.photoURL} 
                      alt={userProfile.displayName || 'Profil Fotoğrafı'} 
                      className="object-cover"
                      fill
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-700 text-2xl font-bold">
                      {(userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || 'S').toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}` || 'Öğrenci'}</h2>
                <p className="text-slate-500 mt-1">{userProfile?.email}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {userProfile?.role}
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-md p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kayıt Tarihi:</span>
                  <span className="font-medium text-slate-700">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Son Giriş:</span>
                  <span className="font-medium text-slate-700">
                    {auth.currentUser?.metadata?.lastSignInTime ? new Date(auth.currentUser.metadata.lastSignInTime).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">İngilizce Seviyesi:</span>
                  <span className="font-medium text-slate-700">{userProfile?.englishLevel || 'Belirtilmemiş'}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  className="w-full py-2 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors font-medium"
                  onClick={() => router.push('/profile')}
                >
                  Profili Düzenle
                </button>
              </div>
            </div>
          </div>
        );
      case 'statistics':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-700 px-6 py-3">
              <h2 className="text-base font-medium text-white">İstatistiklerim</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <h3 className="text-sm text-slate-500 mb-1">Toplam Pratik</h3>
                  <p className="text-3xl font-semibold text-slate-800">0</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <h3 className="text-sm text-slate-500 mb-1">Konuşma Saati</h3>
                  <p className="text-3xl font-semibold text-slate-800">0 saat</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <h3 className="text-sm text-slate-500 mb-1">Tamamlanan Ödev</h3>
                  <p className="text-3xl font-semibold text-slate-800">0</p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <p className="text-slate-500">Henüz yeterli veri bulunmamaktadır.</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-8 text-center">
            <div className="text-5xl mb-4 text-slate-300 flex justify-center">
              <Settings size={56} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-800">
              Ayarlar
            </h2>
            <p className="text-slate-500">Bu özellik henüz geliştirme aşamasındadır.</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
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
      
      {/* Sol yan çubuğu - mobil için modal, desktop için sabit */}
      <div className={`
        fixed inset-0 z-40 md:relative md:inset-auto
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm
      `}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {userProfile?.photoURL ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200">
                <Image 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName || t('profile')} 
                  className="object-cover"
                  fill
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                {(userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || 'S').toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-slate-800 truncate max-w-[150px]">
                {userProfile?.displayName || userProfile?.firstName || t('student')}
              </div>
              <div className="text-xs text-slate-500">{userProfile?.role || t('student')}</div>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 md:hidden"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Menü öğeleri */}
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-3 py-2 rounded-md text-sm
                  transition-colors
                  ${activeTab === item.id 
                    ? 'bg-slate-100 text-slate-800 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }
                `}
              >
                <span className="mr-2.5 opacity-75">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Dil değiştirici ve çıkış butonu */}
        <div className="p-3 border-t border-slate-200">
          <div className="mb-3">
            <LanguageSwitcher variant="select" className="w-full" />
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} className="mr-2 opacity-75" />
            {t('logout')}
          </button>
        </div>
      </div>
      
      {/* Yarı saydam overlay (sadece mobil için) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900 bg-opacity-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Ana içerik alanı */}
      <div className="flex-1 p-4 md:p-6 md:pt-6 overflow-auto">
        <div className="hidden md:flex md:justify-between md:items-center mb-6">
          <h1 className="text-xl font-semibold text-slate-800">
            {menuItems.find(item => item.id === activeTab)?.label || t('appName')}
          </h1>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
} 