'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Header from '@/components/Header';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setUser(user);
          await fetchUserProfile(user.uid);
        }
        setLoading(false);
      });
      
      return () => unsubscribe();
    };
    
    checkAuth();
  }, []);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (err) {
      console.error('Kullanıcı bilgileri alınamadı:', err);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Çıkış yapılamadı:', err);
    }
  };
  
  const navigateToUserPanel = (userProfile) => {
    if (userProfile.role === 'admin') {
      router.push('/dashboard');
    } else if (userProfile.role === 'teacher') {
      router.push('/teacher-panel');
    } else if (userProfile.role === 'proUser') {
      router.push('/prouser-panel');
    } else {
      router.push('/student-panel');
    }
  };
  
  const renderProfileButton = () => {
    if (userProfile) {
      let buttonText = "";
      
      if (userProfile.role === 'admin') {
        buttonText = "Admin Paneli";
      } else if (userProfile.role === 'teacher') {
        buttonText = "Öğretmen Paneli";
      } else if (userProfile.role === 'proUser') {
        buttonText = "Konuşma Sunucusu Paneli";
      } else {
        buttonText = "Öğrenci Paneli";
      }
      
      return (
        <button 
          onClick={() => navigateToUserPanel(userProfile)} 
          className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 transition-colors"
        >
          {buttonText}
        </button>
      );
    } else {
      return (
        <>
          <button 
            onClick={() => router.push('/login')} 
            className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 transition-colors"
          >
            Giriş Yap
          </button>
          <button 
            onClick={() => router.push('/register')} 
            className="bg-white hover:bg-gray-100 text-green-700 border border-green-700 rounded-md px-4 py-2 transition-colors ml-3"
          >
            Kayıt Ol
          </button>
        </>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              SpeakNest ile İngilizce Konuşmayı Öğrenin
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Profesyonel eğitmenlerle birebir konuşma pratiği yaparak İngilizce konuşma becerilerinizi hızla geliştirin. Her seviyeye uygun dersler ve esnek program.
            </p>
            
            {user ? (
              <button
                onClick={() => navigateToUserPanel(userProfile)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors text-lg"
              >
                Derslerime Git
              </button>
            ) : (
              <Link
                href="/register"
                className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors text-lg"
              >
                Ücretsiz Deneme Dersi Al
              </Link>
            )}
          </div>
          
          <div className="md:w-1/2 md:pl-10">
            <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-green-500">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">SpeakNest Avantajları</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-full text-green-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Anadili İngilizce Olan Eğitmenler</h3>
                    <p className="text-gray-600">Gerçek hayatta kullanılan güncel İngilizce ile pratik yapma imkanı</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-full text-green-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Esnek Program</h3>
                    <p className="text-gray-600">Size uygun saatlerde, istediğiniz yerde online dersler</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-full text-green-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Kişiselleştirilmiş Eğitim</h3>
                    <p className="text-gray-600">Seviyenize ve ihtiyaçlarınıza özel ders programı</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Categories */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Eğitim Paketlerimiz</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow overflow-hidden transform transition-transform hover:scale-105">
              <div className="h-48 bg-yellow-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-800">Başlangıç Paketi</h3>
                <p className="text-gray-600 mb-4">Temel İngilizce konuşma becerileri, günlük konuşmalar ve pratik dersler</p>
                <Link href="/pricing" className="text-green-600 hover:underline font-medium">
                  Fiyatlandırmayı İncele →
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-green-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-800">Profesyonel Paket</h3>
                <p className="text-gray-600 mb-4">İş İngilizcesi, sunum teknikleri ve profesyonel iletişim becerileri</p>
                <Link href="/pricing" className="text-green-600 hover:underline font-medium">
                  Fiyatlandırmayı İncele →
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-purple-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-800">Premium Paket</h3>
                <p className="text-gray-600 mb-4">Sınırsız ders, özel eğitmen ve kişiselleştirilmiş program</p>
                <Link href="/pricing" className="text-green-600 hover:underline font-medium">
                  Fiyatlandırmayı İncele →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Tüm Paketleri İncele
            </Link>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Hemen Öğrenmeye Başlayın</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Kariyerinizde ilerlemeniz için ihtiyaç duyduğunuz tüm eğitimler bir tık uzağınızda. 
            Sınırsız erişim ve güncel içeriklerle hemen öğrenmeye başlayın.
          </p>
          
          {user ? (
            <button
              onClick={() => navigateToUserPanel(userProfile)}
              className="px-8 py-4 bg-white text-green-700 rounded-lg shadow hover:bg-green-50 transition-colors text-lg font-medium"
            >
              Derslerime Git
            </button>
          ) : (
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-green-700 rounded-lg shadow hover:bg-green-50 transition-colors text-lg font-medium"
            >
              Şimdi Kaydol
            </Link>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-semibold">SpeakNest</h2>
              <p className="mt-2 text-gray-400">© 2023 Tüm Hakları Saklıdır</p>
            </div>
            
            <div className="flex space-x-8">
              <div>
                <h3 className="font-semibold mb-3">Hakkımızda</h3>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-400 hover:text-white">Biz Kimiz</Link></li>
                  <li><Link href="/teachers" className="text-gray-400 hover:text-white">Eğitmenlerimiz</Link></li>
                  <li><Link href="/career" className="text-gray-400 hover:text-white">Kariyer</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Destek</h3>
                <ul className="space-y-2">
                  <li><Link href="/contact" className="text-gray-400 hover:text-white">İletişim</Link></li>
                  <li><Link href="/faq" className="text-gray-400 hover:text-white">SSS</Link></li>
                  <li><Link href="/help" className="text-gray-400 hover:text-white">Yardım Merkezi</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
