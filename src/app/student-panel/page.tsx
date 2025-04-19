'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, setDoc, Timestamp } from 'firebase/firestore';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, FileText, User, BarChart, Clock, Settings, LogOut, BookOpen } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Word as WordType } from '@/types/word';

// Kelime Grubu tipi tanımlaması
interface WordGroup {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'daily' | 'business' | 'travel' | 'academic';
  wordCount: number;
  creator: string;
}

// Kelime öğrenme durumu tipi
interface WordLearningStatus {
  wordId: string;
  lastReviewed: Date;
  nextReview: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  reviewCount: number;
}

// Kelime tipi
interface Word {
  id: string;
  english: string;
  turkish: string;
  example?: string;
  pronunciation?: string;
  imageUrl?: string;
}

export default function StudentPanel() {
  const { t } = useLanguage();
  const router = useRouter();
  
  // Temel state'ler
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Kelime öğrenme için state'ler
  const [selectedWordGroup, setSelectedWordGroup] = useState<string | null>(null);
  const [groupWords, setGroupWords] = useState<Array<Word & { imageUrl: string }>>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wordLearningStatus, setWordLearningStatus] = useState<WordLearningStatus[]>([]);
  
  // Kelime grupları için state'ler
  const [allWordGroups, setAllWordGroups] = useState<WordGroup[]>([]);
  const [filteredWordGroups, setFilteredWordGroups] = useState<WordGroup[]>([]);
  const [levelFilter, setLevelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  
  const [authUser] = useAuthState(auth);
  
  // Kelime öğrenme durumlarını yükle
  useEffect(() => {
    const loadWordLearningStatus = async () => {
      if (!authUser?.uid) return;
      
      try {
        const statusRef = collection(db, 'wordLearningStatus');
        const q = query(
          statusRef, 
          where('userId', '==', authUser.uid),
          orderBy('nextReview', 'asc')
        );
        const querySnapshot = await getDocs(q);
        
        const statuses = querySnapshot.docs.map(doc => ({
          wordId: doc.data().wordId,
          difficulty: doc.data().difficulty,
          lastReviewed: doc.data().lastReviewed.toDate(),
          nextReview: doc.data().nextReview.toDate(),
          reviewCount: doc.data().reviewCount
        }));
        
        // Sıralı olarak tekrarlanacak kelimeleri göster
        const now = new Date();
        const upcomingReviews = statuses.filter(status => status.nextReview > now);
        const dueReviews = statuses.filter(status => status.nextReview <= now);
        
        // Önce tekrar zamanı gelmiş olanları, sonra gelecek olanları birleştir
        setWordLearningStatus([...dueReviews, ...upcomingReviews]);
        
        // Tekrar zamanı gelmiş kelimeleri konsola yazdır
        if (dueReviews.length > 0) {
          console.log('Tekrar zamanı gelmiş kelimeler:', dueReviews);
        }
      } catch (error) {
        console.error('Kelime durumları yüklenirken hata oluştu:', error);
      }
    };

    loadWordLearningStatus();
  }, [authUser?.uid]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUser(user);
            await fetchUserProfile(user.uid);
            // Kelime gruplarını getir
            await fetchWordGroups();
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
  
  // Firebase'den kelime gruplarını getir
  const fetchWordGroups = async () => {
    try {
      setError('');
      // Kelime gruplarını Firebase'den sorgula
      const wordGroupsQuery = query(
        collection(db, 'wordGroups'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(wordGroupsQuery);
      const groups: WordGroup[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        groups.push({ 
          id: doc.id, 
          title: data.title || '',
          description: data.description || '',
          level: data.level || 'beginner',
          category: data.category || 'daily',
          wordCount: data.wordCount || 0,
          creator: data.creator || 'SpeakNest'
        });
      });
      
      console.log('Kelime grupları yüklendi:', groups.length);
      setAllWordGroups(groups);
      setFilteredWordGroups(groups);
    } catch (error) {
      console.error('Kelime grupları getirilirken hata oluştu:', error);
      setError('Kelime grupları yüklenemedi. Lütfen daha sonra tekrar deneyin.');
    }
  };
  
  // Filtreleme fonksiyonu
  const applyFilters = (level: string, category: string, search: string) => {
    let filtered = [...allWordGroups];
    
    // Seviye filtresi
    if (level) {
      filtered = filtered.filter(group => group.level === level);
    }
    
    // Kategori filtresi
    if (category) {
      filtered = filtered.filter(group => group.category === category);
    }
    
    // Arama filtresi
    if (search) {
      filtered = filtered.filter(group => 
        group.title.toLowerCase().includes(search.toLowerCase()) || 
        group.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredWordGroups(filtered);
    
    // Filtreleri state'lere kaydet
    setLevelFilter(level);
    setCategoryFilter(category);
    setSearchFilter(search);
  };
  
  // Kelime grubuna basıldığında rota değişikliği
  const handleWordGroupClick = (groupId: string) => {
    router.push(`/vocabulary/${groupId}`);
  };
  
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
    { id: 'vocabulary', label: 'Kelime Öğren', icon: <BookOpen size={18} /> },
    { id: 'profile', label: t('profile'), icon: <User size={18} /> },
    { id: 'statistics', label: t('statistics'), icon: <BarChart size={18} /> },
    { id: 'settings', label: t('settings'), icon: <Settings size={18} /> },
  ];

  // Kelime grubuna ait kelimeleri getir
  const fetchGroupWords = async (groupId: string) => {
    try {
      const wordsRef = collection(db, 'wordGroups', groupId, 'words');
      const wordsSnapshot = await getDocs(wordsRef);
      const words = wordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<Word & { imageUrl: string }>;
      
      setGroupWords(words);
      setCurrentWordIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error('Kelimeler getirilirken hata oluştu:', error);
      setError('Kelimeler yüklenirken bir hata oluştu.');
    }
  };

  // Kelime öğrenme kartı bileşeni
  const WordCard = ({ word, onNext, onPrevious, isFirst, isLast }: { 
    word: Word & { imageUrl: string }, 
    onNext: () => void, 
    onPrevious: () => void,
    isFirst: boolean,
    isLast: boolean
  }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [wordLearningStatus, setWordLearningStatus] = useState<WordLearningStatus[]>([]);

    const speakWord = async () => {
      if (isSpeaking) return;
      setIsSpeaking(true);
      try {
        const utterance = new SpeechSynthesisUtterance(word.english);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
        await new Promise(resolve => {
          utterance.onend = resolve;
        });
      } finally {
        setIsSpeaking(false);
      }
    };

    const updateWordLearningStatus = async (wordId: string, difficulty: 'easy' | 'medium' | 'hard') => {
      if (!authUser?.uid) {
        console.error('Kullanıcı girişi yapılmamış');
        return;
      }

      const now = new Date();
      const nextReviewDate = new Date();
      
      switch(difficulty) {
        case 'hard':
          nextReviewDate.setDate(now.getDate() + 1);
          break;
        case 'medium':
          nextReviewDate.setDate(now.getDate() + 3);
          break;
        case 'easy':
          nextReviewDate.setDate(now.getDate() + 7);
          break;
      }

      try {
        const wordRef = doc(db, 'wordLearningStatus', `${authUser.uid}_${wordId}`);
        await setDoc(wordRef, {
          userId: authUser.uid,
          wordId,
          difficulty,
          lastReviewed: Timestamp.fromDate(now),
          nextReview: Timestamp.fromDate(nextReviewDate),
          reviewCount: 1,
          createdAt: Timestamp.fromDate(now)
        }, { merge: true });

        setWordLearningStatus(prev => [...prev, {
          wordId,
          lastReviewed: now,
          nextReview: nextReviewDate,
          difficulty,
          reviewCount: 1
        }]);

        console.log(`Kelime "${difficulty === 'hard' ? 'Zor' : difficulty === 'medium' ? 'Orta' : 'Kolay'}" olarak işaretlendi.`);
      } catch (error) {
        console.error('Kelime durumu güncellenirken hata oluştu:', error);
      }
    };

    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="relative h-[500px]">
          <div
            className={`absolute w-full h-full transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ 
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Ön Yüz */}
            <div 
              className={`absolute w-full h-full ${isFlipped ? 'hidden' : ''}`}
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)'
              }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="p-8 h-full flex flex-col justify-center items-center">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">{word.english}</h2>
                    {word.pronunciation && (
                      <p className="text-xl text-gray-600 italic mb-6">
                        /{word.pronunciation}/
                      </p>
                    )}
                    {word.imageUrl && (
                      <div className="mb-6">
                        <img 
                          src={word.imageUrl} 
                          alt={word.english}
                          className="max-h-48 mx-auto rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105"
                  >
                    Türkçe Anlamı Göster
                  </button>
                </div>
              </div>
            </div>

            {/* Arka Yüz */}
            <div 
              className="absolute w-full h-full"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="p-8 h-full flex flex-col justify-center items-center">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                      {word.turkish}
                    </h2>
                    {word.example && (
                      <div className="mt-6">
                        <p className="text-xl text-gray-700 italic">
                          {word.example}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Zorluk Seviyesi Butonları */}
                  <div className="mt-8 flex gap-4 justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateWordLearningStatus(word.id, 'hard');
                      }}
                      className="px-6 py-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all transform hover:scale-105"
                    >
                      Zor
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateWordLearningStatus(word.id, 'medium');
                      }}
                      className="px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all transform hover:scale-105"
                    >
                      Orta
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateWordLearningStatus(word.id, 'easy');
                      }}
                      className="px-6 py-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform hover:scale-105"
                    >
                      Kolay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigasyon Butonları */}
        <div className="flex justify-between mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isFirst) {
                onPrevious();
                setIsFlipped(false);
              }
            }}
            className={`px-4 py-2 rounded ${
              isFirst
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isFirst}
          >
            Önceki
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentWordStatus = wordLearningStatus.find(status => status.wordId === word.id);
              if (!currentWordStatus) {
                console.log('Lütfen önce zorluk seviyesini seçin');
                return;
              }
              onNext();
              setIsFlipped(false);
            }}
            className={`px-4 py-2 rounded ${
              !wordLearningStatus.find(status => status.wordId === word.id)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={!wordLearningStatus.find(status => status.wordId === word.id)}
          >
            {isLast ? 'Bitir' : 'Sonraki'}
          </button>
        </div>
      </div>
    );
  };

  // Kelime öğrenme sayfası içeriği
  const renderVocabularyContent = () => {
    if (!selectedWordGroup) {
      return (
        <div className="space-y-6">
          {/* Tekrar Durumu Özeti */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tekrar Durumu</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['hard', 'medium', 'easy'].map(difficulty => {
                const words = wordLearningStatus.filter(status => status.difficulty === difficulty);
                const dueWords = words.filter(status => new Date(status.nextReview) <= new Date());
                const upcomingWords = words.filter(status => new Date(status.nextReview) > new Date());
                
                return (
                  <div key={difficulty} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                        difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {difficulty === 'hard' ? 'Zor' :
                         difficulty === 'medium' ? 'Orta' : 'Kolay'}
                      </span>
                    </div>
                    
                    {dueWords.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-red-600 font-medium">
                          {dueWords.length} kelime tekrar zamanı geldi!
                        </p>
                        <p className="text-xs text-gray-500">
                          Hemen tekrar etmelisiniz
                        </p>
                      </div>
                    )}
                    
                    {upcomingWords.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">
                          {upcomingWords.length} kelime tekrar edilecek
                        </p>
                        <p className="text-xs text-gray-500">
                          En yakın tekrar: {new Date(Math.min(...upcomingWords.map(w => w.nextReview.getTime()))).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                    
                    {words.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Henüz kelime eklenmemiş
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kelime grupları listesi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWordGroups.map((group) => (
              <div 
                key={group.id}
                onClick={() => {
                  setSelectedWordGroup(group.id);
                  fetchGroupWords(group.id);
                }}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-100 cursor-pointer"
              >
                <div className="p-4">
                  <h3 className="text-lg font-medium text-slate-800">{group.title}</h3>
                  <p className="text-slate-600 text-sm mt-1">{group.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-500">{group.wordCount} Kelime</span>
                    <button className="text-sm px-3 py-1.5 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors">
                      Başla
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              setSelectedWordGroup(null);
              setGroupWords([]);
            }}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </button>
          <div className="text-sm text-gray-600">
            {currentWordIndex + 1} / {groupWords.length}
          </div>
        </div>

        {groupWords.length > 0 && (
          currentWordIndex >= groupWords.length ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
                <div className="text-4xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Tebrikler!</h2>
                <p className="text-gray-600 mb-6">Bu gruptaki tüm kelimeleri tamamladınız.</p>
                <button
                  onClick={() => {
                    setSelectedWordGroup(null);
                    setGroupWords([]);
                    setCurrentWordIndex(0);
                    setIsFlipped(false);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Gruplara Dön
                </button>
              </div>
            </div>
          ) : (
            <WordCard
              word={groupWords[currentWordIndex]}
              onNext={() => setCurrentWordIndex(prev => prev + 1)}
              onPrevious={() => setCurrentWordIndex(prev => prev - 1)}
              isFirst={currentWordIndex === 0}
              isLast={currentWordIndex === groupWords.length - 1}
            />
          )
        )}
      </div>
    );
  };

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
                          <div className="mt-2 flex items-center text-sm text-slate-500">
                            <span>Son Teslim: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Beklemede</span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button 
                          onClick={() => router.push(`/assignments/${assignment.id}`)}
                          className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800 transition-colors"
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
      case 'vocabulary':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Kelime Öğren</h2>
              </div>
              
              {/* Filtreleme Sistemi */}
              <div className="px-6 py-4 border-b border-slate-100 bg-white">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="relative flex-grow">
                    <input 
                      type="text" 
                      placeholder="Kelime grubu ara..." 
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      onChange={(e) => {
                        // Arama filtresini uygula
                        const searchText = e.target.value.toLowerCase();
                        const filteredGroups = allWordGroups.filter(group => 
                          group.title.toLowerCase().includes(searchText) || 
                          group.description.toLowerCase().includes(searchText)
                        );
                        setFilteredWordGroups(filteredGroups);
                      }}
                    />
                    <div className="absolute left-3 top-2.5 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <select 
                      className="py-2 px-3 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      onChange={(e) => {
                        // Seviye filtresini uygula
                        const selectedLevel = e.target.value;
                        setLevelFilter(selectedLevel);
                        applyFilters(selectedLevel, categoryFilter, searchFilter);
                      }}
                    >
                      <option value="">Tüm Seviyeler</option>
                      <option value="beginner">Başlangıç</option>
                      <option value="intermediate">Orta</option>
                      <option value="advanced">İleri</option>
                    </select>
                    <select 
                      className="py-2 px-3 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      onChange={(e) => {
                        // Kategori filtresini uygula
                        const selectedCategory = e.target.value;
                        setCategoryFilter(selectedCategory);
                        applyFilters(levelFilter, selectedCategory, searchFilter);
                      }}
                    >
                      <option value="">Tüm Kategoriler</option>
                      <option value="daily">Günlük Konuşma</option>
                      <option value="business">İş İngilizcesi</option>
                      <option value="travel">Seyahat</option>
                      <option value="academic">Akademik</option>
                    </select>
                  </div>
                </div>
                
                {/* Aktif Filtreler */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(levelFilter || categoryFilter || searchFilter) && (
                    <div className="w-full">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Aktif Filtreler:</span>
                        
                        {levelFilter && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {levelFilter === 'beginner' ? 'Başlangıç' : 
                              levelFilter === 'intermediate' ? 'Orta' : 
                              levelFilter === 'advanced' ? 'İleri' : levelFilter}
                            <button 
                              onClick={() => {
                                setLevelFilter('');
                                applyFilters('', categoryFilter, searchFilter);
                              }} 
                              className="ml-1 text-emerald-600 hover:text-emerald-900"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        )}
                        
                        {categoryFilter && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {categoryFilter === 'daily' ? 'Günlük Konuşma' : 
                              categoryFilter === 'business' ? 'İş İngilizcesi' : 
                              categoryFilter === 'travel' ? 'Seyahat' : 
                              categoryFilter === 'academic' ? 'Akademik' : categoryFilter}
                            <button 
                              onClick={() => {
                                setCategoryFilter('');
                                applyFilters(levelFilter, '', searchFilter);
                              }} 
                              className="ml-1 text-blue-600 hover:text-blue-900"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        )}
                        
                        {searchFilter && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            "{searchFilter}"
                            <button 
                              onClick={() => {
                                setSearchFilter('');
                                applyFilters(levelFilter, categoryFilter, '');
                                // Arama input alanını temizle
                                const searchInput = document.querySelector('input[placeholder="Kelime grubu ara..."]') as HTMLInputElement;
                                if (searchInput) searchInput.value = '';
                              }} 
                              className="ml-1 text-purple-600 hover:text-purple-900"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        )}
                        
                        {(levelFilter || categoryFilter || searchFilter) && (
                          <button 
                            onClick={() => {
                              setLevelFilter('');
                              setCategoryFilter('');
                              setSearchFilter('');
                              setFilteredWordGroups(allWordGroups);
                              // Arama input alanını temizle
                              const searchInput = document.querySelector('input[placeholder="Kelime grubu ara..."]') as HTMLInputElement;
                              if (searchInput) searchInput.value = '';
                              // Select'leri sıfırla
                              const selects = document.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
                              selects.forEach(select => select.value = '');
                            }}
                            className="text-xs text-slate-500 hover:text-slate-700 underline ml-2"
                          >
                            Tüm filtreleri temizle
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Kelime Öğrenme İçeriği */}
              <div className="p-6">
                {renderVocabularyContent()}
              </div>
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
                    {authUser?.metadata?.lastSignInTime ? new Date(authUser.metadata.lastSignInTime).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
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