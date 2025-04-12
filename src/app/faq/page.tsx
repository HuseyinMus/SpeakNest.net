'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function FAQ() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  
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
  
  const toggleQuestion = (index: number) => {
    if (activeQuestion === index) {
      setActiveQuestion(null);
    } else {
      setActiveQuestion(index);
    }
  };

  const faqItems = [
    {
      question: "SpeakNest ile nasıl ders alabilirim?",
      answer: "SpeakNest'te ders almak için öncelikle ücretsiz bir hesap oluşturmanız gerekiyor. Kayıt olduktan sonra, seviye tespit sınavımızı tamamlayabilir ve size uygun olan eğitim paketini seçebilirsiniz. Ardından, takvimimizden size uygun bir eğitmen ve zaman dilimi seçerek derslerinize başlayabilirsiniz."
    },
    {
      question: "Eğitmenleriniz kimlerdir?",
      answer: "Eğitmenlerimiz, TEFL, TESOL, CELTA gibi uluslararası sertifikalara sahip, çoğunluğu anadili İngilizce olan profesyonel dil öğretmenleridir. Tüm eğitmenlerimiz kapsamlı bir değerlendirme sürecinden geçirilmekte ve düzenli olarak performansları değerlendirilmektedir."
    },
    {
      question: "Derslerin ücretleri ne kadardır?",
      answer: "Ders ücretlerimiz seçtiğiniz eğitim paketine, ders saatine ve süresine göre değişmektedir. Standart paketlerimiz, indirimli ders paketleri ve özel eğitim programlarımız hakkında detaylı bilgiyi 'Ücretlendirme' sayfamızdan öğrenebilirsiniz."
    },
    {
      question: "Derslere nasıl katılabilirim?",
      answer: "Derslerimiz tamamen çevrimiçi olup, platformumuz üzerinden gerçekleştirilmektedir. Ders saatiniz geldiğinde, hesabınıza giriş yaparak 'Derslerim' bölümünden veya size gönderilen e-posta bildirimindeki link üzerinden derse katılabilirsiniz. Dersler için stabilize internet bağlantısı, mikrofon ve kamera içeren bir bilgisayar veya mobil cihaz kullanmanız önerilir."
    },
    {
      question: "Ders iptali veya erteleme politikanız nedir?",
      answer: "Ders iptali veya erteleme talebinizi dersten en az 24 saat önce bildirmeniz durumunda, dersinizi ücretsiz olarak ileri bir tarihe erteleyebilirsiniz. 24 saatten kısa sürede yapılan iptallerde, ders ücretiniz iade edilmez veya telafi dersi sunulmaz. Acil durumlar için müşteri hizmetlerimizle iletişime geçebilirsiniz."
    },
    {
      question: "İngilizce seviyemi nasıl belirleyebilirim?",
      answer: "Platformumuza kaydolduktan sonra, ücretsiz olarak sunduğumuz seviye tespit sınavımızı tamamlayabilirsiniz. Bu sınav, Avrupa Dil Portfolyosu (CEFR) standartlarına göre hazırlanmış olup, mevcut İngilizce seviyenizi belirlemenize yardımcı olacaktır."
    },
    {
      question: "Ödeme seçenekleriniz nelerdir?",
      answer: "Platformumuzda kredi kartı, banka kartı, havale/EFT ve çeşitli dijital ödeme yöntemleri kabul edilmektedir. Aylık abonelik veya paket satın alma seçeneklerimiz mevcuttur. Kurumsal müşterilerimiz için fatura kesim hizmeti de sunmaktayız."
    },
    {
      question: "İngilizce öğrenmek için ne kadar süre gerekiyor?",
      answer: "İngilizce öğrenme süresi; başlangıç seviyenize, hedeflerinize, düzenli çalışma alışkanlıklarınıza ve pratik yapma sıklığınıza bağlı olarak değişmektedir. Genel olarak, bir seviyeden diğerine geçmek (örneğin A1'den A2'ye) düzenli çalışma ile 80-100 saat arası sürebilir. Kişiselleştirilmiş öğrenme planınız için eğitmeninizle görüşebilirsiniz."
    },
    {
      question: "Ders dışında ek kaynak ve materyal sağlıyor musunuz?",
      answer: "Evet, tüm öğrencilerimize dersler dışında da çalışabilecekleri ek kaynaklar sunuyoruz. Platformumuzda seviyenize uygun okuma metinleri, dinleme alıştırmaları, dil bilgisi açıklamaları, kelime listeleri ve interaktif alıştırmalar bulunmaktadır. Ayrıca, eğitmeniniz de size özel ev ödevleri ve çalışma materyalleri sağlayacaktır."
    },
    {
      question: "Herhangi bir iade politikanız var mı?",
      answer: "İlk dersinizden memnun kalmamanız durumunda, 7 gün içinde iade talebinde bulunabilirsiniz. Henüz kullanılmamış ders paketleri için de belirli koşullar altında iade mümkündür. Detaylı iade politikamız için 'Kullanım Koşulları' sayfamızı inceleyebilir veya müşteri hizmetlerimizle iletişime geçebilirsiniz."
    },
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-semibold">SpeakNest</Link>
            <div className="space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm">
                    Merhaba, {userProfile?.displayName || userProfile?.firstName || user.displayName || 'Kullanıcı'}
                  </span>
                  {renderProfileButton()}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </div>
              ) : (
                <div className="space-x-4">
                  {renderProfileButton()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-green-800 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Sıkça Sorulan Sorular</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            SpeakNest platformu hakkında merak ettiğiniz tüm sorular ve yanıtları
          </p>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="divide-y divide-gray-200">
              {faqItems.map((item, index) => (
                <div key={index} className="cursor-pointer">
                  <div 
                    className="px-6 py-5 flex justify-between items-center hover:bg-gray-50"
                    onClick={() => toggleQuestion(index)}
                  >
                    <h3 className="text-lg font-semibold text-gray-800">{item.question}</h3>
                    <div className={`transition-transform duration-200 ${activeQuestion === index ? 'rotate-180' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div 
                    className={`px-6 py-4 bg-gray-50 text-gray-700 transition-all duration-300 overflow-hidden ${
                      activeQuestion === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Help */}
          <div className="mt-16 bg-gray-50 rounded-xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Hala sorunuz mu var?</h2>
            <p className="text-center text-gray-700 mb-8">
              Burada cevabını bulamadığınız sorularınız için müşteri hizmetlerimizle iletişime geçebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/contact"
                className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow text-center transition-colors"
              >
                Bize Ulaşın
              </Link>
              <Link
                href="/help"
                className="py-3 px-6 bg-white hover:bg-gray-100 text-green-700 border border-green-600 rounded-lg shadow text-center transition-colors"
              >
                Yardım Merkezi
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="py-16 bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">İngilizce Öğrenmeye Başlayın</h2>
          <p className="text-xl max-w-3xl mx-auto mb-10">
            Profesyonel eğitmenlerimizle birebir İngilizce konuşma pratiği yaparak dil becerilerinizi hızla geliştirin.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-green-700 rounded-lg shadow hover:bg-green-50 transition-colors text-lg font-medium"
            >
              Ücretsiz Demo Ders
            </Link>
            <Link
              href="/courses"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg shadow hover:bg-white/10 transition-colors text-lg font-medium"
            >
              Eğitim Paketleri
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