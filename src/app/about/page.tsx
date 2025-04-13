'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Header from '@/components/Header';

export default function About() {
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
      <div className="relative bg-gradient-to-b from-green-800 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Hakkımızda</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Dil öğreniminde yenilikçi yaklaşımlarla herkes için erişilebilir eğitim
          </p>
        </div>
      </div>
      
      {/* Our Mission */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Misyonumuz</h2>
            <p className="text-xl text-gray-600">
              İngilizce öğrenmek isteyen herkese, her yerde, kaliteli ve etkileşimli eğitim hizmeti sunarak
              dil bariyerlerini aşmalarına yardımcı olmak.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg transform transition-transform hover:scale-105">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Konuşma Odaklı</h3>
              <p className="text-gray-600 text-center">
                Pratik yaparak öğrenmeyi teşvik eden, konuşma becerilerini geliştirmeye odaklanan bir eğitim metodolojisi.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg transform transition-transform hover:scale-105">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Kişiselleştirilmiş</h3>
              <p className="text-gray-600 text-center">
                Her öğrencinin ihtiyaçlarına, seviyesine ve öğrenme hızına göre özelleştirilmiş eğitim planları.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg transform transition-transform hover:scale-105">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Erişilebilir</h3>
              <p className="text-gray-600 text-center">
                Herkesin kolayca erişebileceği, uygun fiyatlı ve kaliteli eğitim fırsatları sunuyoruz.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Our Story */}
      <div className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-green-200 rounded-lg transform -rotate-3"></div>
                <div className="relative bg-white rounded-lg p-8 shadow-xl">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Hikayemiz</h2>
                  <p className="text-gray-600 mb-6">
                    SpeakNest, 2020 yılında dil öğreniminde karşılaşılan zorlukları aşmak amacıyla kuruldu. Amacımız, konuşma pratiğinin önündeki bariyerleri kaldırmak ve herkese ana dili İngilizce olan eğitmenlerle pratik yapma fırsatı sunmaktı.
                  </p>
                  <p className="text-gray-600">
                    Başlangıçta küçük bir ekiple yola çıktık, ancak kısa sürede büyük bir topluluk haline geldik. Bugün, dünya genelinde binlerce öğrenci ve yüzlerce eğitmenle, dil öğrenimi yolculuğunda öğrencilere rehberlik ediyoruz.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="text-4xl font-bold text-green-600 mb-2">5K+</div>
                  <div className="text-gray-600">Aktif Öğrenci</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="text-4xl font-bold text-green-600 mb-2">200+</div>
                  <div className="text-gray-600">Eğitmen</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="text-4xl font-bold text-green-600 mb-2">20+</div>
                  <div className="text-gray-600">Ülke</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="text-4xl font-bold text-green-600 mb-2">1M+</div>
                  <div className="text-gray-600">Ders Saati</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Team */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ekibimizle Tanışın</h2>
            <p className="text-xl text-gray-600">
              SpeakNest'i daha iyi bir öğrenme platformu haline getirmek için çalışan tutkulu ekibimiz.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105">
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Ahmet Yılmaz</h3>
                <p className="text-green-600 mb-4">Kurucu & CEO</p>
                <p className="text-gray-600">
                  10+ yıl eğitim teknolojileri alanında deneyime sahip.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105">
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Zeynep Kaya</h3>
                <p className="text-green-600 mb-4">Eğitim Direktörü</p>
                <p className="text-gray-600">
                  Cambridge Üniversitesi İngilizce Eğitimi Bölümü mezunu.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105">
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Mehmet Demir</h3>
                <p className="text-green-600 mb-4">Teknoloji Direktörü</p>
                <p className="text-gray-600">
                  Yapay zeka ve eğitim teknolojileri konusunda uzman.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105">
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Ayşe Şahin</h3>
                <p className="text-green-600 mb-4">Müşteri Deneyimi Uzmanı</p>
                <p className="text-gray-600">
                  Öğrenci deneyimini mükemmelleştirmek için çalışıyor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="py-16 bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Bizimle Yolculuğa Çıkın</h2>
          <p className="text-xl max-w-3xl mx-auto mb-10">
            Dil öğrenmek yalnızca bir beceri kazanmak değil, dünyaya açılan yeni bir kapıdır. Bu yolculukta sizinle birlikte olmaktan mutluluk duyarız.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-green-700 rounded-lg shadow hover:bg-green-50 transition-colors text-lg font-medium"
            >
              Ücretsiz Demo Ders
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg shadow hover:bg-white/10 transition-colors text-lg font-medium"
            >
              Bizimle İletişime Geçin
            </Link>
          </div>
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