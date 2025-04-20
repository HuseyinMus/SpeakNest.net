import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase yapılandırması - çevre değişkenlerinden al
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Geliştirme modunda değerlerin mevcut olup olmadığını kontrol et
if (process.env.NODE_ENV !== 'production') {
  const missingEnvVars = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingEnvVars.length > 0) {
    console.warn(`Firebase yapılandırmasında eksik çevre değişkenleri: ${missingEnvVars.join(', ')}`);
    console.warn('Lütfen .env.local dosyanızı kontrol edin ve eksik değişkenleri ekleyin.');
  }
}

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore, Auth ve Storage servislerini başlat
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Ortam bilgisini kontrol et
export const isProduction = process.env.NODE_ENV === 'production';

// Firebase koleksiyon isimleri
export const collections = {
  users: isProduction ? 'users' : 'users_dev',
  meetings: isProduction ? 'meetings' : 'meetings_dev',
  wordGroups: isProduction ? 'wordGroups' : 'wordGroups_dev',
  // Diğer koleksiyonlar...
}; 