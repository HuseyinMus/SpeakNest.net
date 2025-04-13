'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Header from '@/components/Header';

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const plans = {
    monthly: [
      {
        name: 'Başlangıç',
        price: '199',
        period: 'aylık',
        features: [
          { text: 'Haftada 2 ders', included: true },
          { text: 'Birebir eğitmen desteği', included: true },
          { text: 'Temel seviye materyaller', included: true },
          { text: '7/24 destek', included: false },
          { text: 'Sertifika', included: false },
          { text: 'İleri seviye materyaller', included: false }
        ],
        popular: false
      },
      {
        name: 'Profesyonel',
        price: '399',
        period: 'aylık',
        features: [
          { text: 'Haftada 4 ders', included: true },
          { text: 'Birebir eğitmen desteği', included: true },
          { text: 'Tüm seviye materyaller', included: true },
          { text: '7/24 destek', included: true },
          { text: 'Sertifika', included: true },
          { text: 'Özel ders programı', included: false }
        ],
        popular: true
      },
      {
        name: 'Premium',
        price: '699',
        period: 'aylık',
        features: [
          { text: 'Sınırsız ders', included: true },
          { text: 'Birebir eğitmen desteği', included: true },
          { text: 'Tüm seviye materyaller', included: true },
          { text: '7/24 destek', included: true },
          { text: 'Sertifika', included: true },
          { text: 'Özel ders programı', included: true }
        ],
        popular: false
      }
    ],
    yearly: [
      {
        name: 'Başlangıç',
        price: '1990',
        period: 'yıllık',
        features: [
          { text: 'Haftada 2 ders', included: true },
          { text: 'Birebir eğitmen desteği', included: true },
          { text: 'Temel seviye materyaller', included: true },
          { text: '7/24 destek', included: false },
          { text: 'Sertifika', included: false },
          { text: 'İleri seviye materyaller', included: false }
        ],
        popular: false
      },
      {
        name: 'Profesyonel',
        price: '3990',
        period: 'yıllık',
        features: [
          { text: 'Haftada 4 ders', included: true },
          { text: 'Birebir eğitmen desteği', included: true },
          { text: 'Tüm seviye materyaller', included: true },
          { text: '7/24 destek', included: true },
          { text: 'Sertifika', included: true },
          { text: 'Özel ders programı', included: false }
        ],
        popular: true
      },
      {
        name: 'Premium',
        price: '6990',
        period: 'yıllık',
        features: [
          { text: 'Sınırsız ders', included: true },
          { text: 'Birebir eğitmen desteği', included: true },
          { text: 'Tüm seviye materyaller', included: true },
          { text: '7/24 destek', included: true },
          { text: 'Sertifika', included: true },
          { text: 'Özel ders programı', included: true }
        ],
        popular: false
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-green-800">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-800 mix-blend-multiply"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Eğitim Paketlerimiz
          </h1>
          <p className="mt-6 text-xl text-green-100 max-w-3xl">
            İhtiyaçlarınıza uygun eğitim paketlerimizle İngilizce öğrenme yolculuğunuza başlayın.
            Profesyonel eğitmenlerimiz ve modern eğitim metodlarımızla hedeflerinize ulaşın.
          </p>
        </div>
      </div>

      {/* Plan Seçici */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg p-1">
            <div className="flex">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-6 py-2 rounded-md font-medium ${
                  selectedPlan === 'monthly'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`px-6 py-2 rounded-md font-medium ${
                  selectedPlan === 'yearly'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yıllık
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Planlar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans[selectedPlan].map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg">
                  En Popüler
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">₺{plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      {feature.included ? (
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className="ml-3 text-gray-600">{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 w-full px-4 py-2 rounded-md font-medium ${
                    plan.popular
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {user ? 'Hemen Başla' : 'Ücretsiz Deneyin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Özellikler */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Tüm Paketlerde Bulunan Özellikler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profesyonel Eğitmenler</h3>
            <p className="text-gray-600">
              Alanında uzman, deneyimli eğitmenlerle çalışın
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Esnek Ders Saatleri</h3>
            <p className="text-gray-600">
              Size uygun zamanlarda ders alın
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Birebir Eğitim</h3>
            <p className="text-gray-600">
              Kişiye özel eğitim programı
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Zengin İçerik</h3>
            <p className="text-gray-600">
              Güncel ve kapsamlı eğitim materyalleri
            </p>
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