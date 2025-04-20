'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { dataService } from '@/lib/services/DataService';

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  role?: 'admin' | 'proUser' | 'teacher' | 'student' | 'user';
  createdAt?: any;
  updatedAt?: any;
  englishLevel?: string;
  metadata?: {
    lastSignInTime?: string;
  };
}

// Kullanıcı rollerine göre erişim izinleri
export const ROUTE_PERMISSIONS = {
  // Genel rotalar
  'login': ['*'],
  'register': ['*'],
  'reset-password': ['*'],
  '/': ['*'],
  'about': ['*'],
  'pricing': ['*'],
  'contact': ['*'],
  'terms': ['*'],
  'privacy': ['*'],
  
  // Giriş yapan tüm kullanıcılar için
  'profile': ['admin', 'proUser', 'teacher', 'student', 'user'],
  'settings': ['admin', 'proUser', 'teacher', 'student', 'user'],
  
  // Spesifik roller için
  'dashboard': ['admin'],
  'prouser-panel': ['admin', 'proUser'],
  'teacher-panel': ['admin', 'teacher'],
  'student-panel': ['admin', 'student'],
  'meetings': ['admin', 'proUser', 'teacher', 'student'],
  'admin': ['admin'],
};

interface AuthContextProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (email: string, password: string, displayName: string, role?: string) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  createUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  canAccess: (path: string) => boolean;
  hasPermission: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DataService'e kullanıcı bilgilerini aktar
  const updateDataServiceUser = (user: User | null, profile: UserProfile | null) => {
    if (user) {
      dataService.setCurrentUser({
        uid: user.uid,
        profile: profile || undefined
      });
    } else {
      dataService.setCurrentUser(null);
    }
  };

  // Kullanıcı profili getirme
  const fetchUserProfile = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as Omit<UserProfile, 'id'>;
        const profile = { 
          id: user.uid,
          ...profileData 
        };
        
        setUserProfile(profile);
        updateDataServiceUser(user, profile);
      } else {
        // Profili yoksa temel bir profil oluştur
        await createUserProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'user', // Varsayılan rol
        });
      }
    } catch (err) {
      console.error('Kullanıcı profili getirilemedi:', err);
      setError('Kullanıcı profili getirilemedi');
    }
  };

  // Auth state değişimini izle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
        updateDataServiceUser(null, null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Giriş yapma
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserProfile(userCredential.user);
      return userProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Giriş yapılamadı';
      setError(errorMessage);
      console.error('Giriş hatası:', err);
      throw err;
    }
  };

  // Kayıt olma ve profil oluşturma
  const signUp = async (email: string, password: string, displayName: string, role: string = 'user') => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await firebaseUpdateProfile(user, { displayName });
      
      // Firestore'da kullanıcı profili oluştur
      await createUserProfile(user.uid, {
        email,
        displayName,
        role,
      });
      
      await fetchUserProfile(user);
      return userProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kayıt yapılamadı';
      setError(errorMessage);
      console.error('Kayıt hatası:', err);
      throw err;
    }
  };

  // Çıkış yapma
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
      updateDataServiceUser(null, null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Çıkış yapılamadı';
      setError(errorMessage);
      console.error('Çıkış hatası:', err);
      throw err;
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Şifre sıfırlanamadı';
      setError(errorMessage);
      console.error('Şifre sıfırlama hatası:', err);
      throw err;
    }
  };

  // Kullanıcı profili güncelleme
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('Kullanıcı giriş yapmamış');
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, updateData, { merge: true });
      
      // Yerel state'i güncelle
      const updatedProfile = userProfile ? { ...userProfile, ...data } : null;
      setUserProfile(updatedProfile);
      updateDataServiceUser(currentUser, updatedProfile);
      
      // Eğer displayName değişmişse, Firebase auth profilini de güncelle
      if (data.displayName && data.displayName !== currentUser.displayName) {
        await firebaseUpdateProfile(currentUser, {
          displayName: data.displayName
        });
      }
      
      // Eğer photoURL değişmişse, Firebase auth profilini de güncelle
      if (data.photoURL && data.photoURL !== currentUser.photoURL) {
        await firebaseUpdateProfile(currentUser, {
          photoURL: data.photoURL
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profil güncellenemedi';
      setError(errorMessage);
      console.error('Profil güncelleme hatası:', err);
      throw err;
    }
  };

  // Yeni kullanıcı profili oluşturma
  const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      
      const profileData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, profileData);
      
      // Eğer current user için profil oluşturulduysa, local state'i güncelle
      if (currentUser && currentUser.uid === uid) {
        const newProfile = {
          id: uid,
          ...data
        } as UserProfile;
        
        setUserProfile(newProfile);
        updateDataServiceUser(currentUser, newProfile);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profil oluşturulamadı';
      setError(errorMessage);
      console.error('Profil oluşturma hatası:', err);
      throw err;
    }
  };

  // Rol tabanlı erişim kontrolü
  const hasPermission = (requiredRoles: string | string[]) => {
    // Kullanıcı girişi yapılmadıysa yetkisi yok
    if (!currentUser || !userProfile) return false;
    
    // Tek bir rol string olarak geldiyse, dizi haline getir
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // * işareti tüm kullanıcılara izin verir
    if (roles.includes('*')) return true;
    
    // Admin her şeye erişebilir
    if (userProfile.role === 'admin') return true;
    
    // Kullanıcının rolü gerekli rollerden biri mi kontrol et
    return userProfile.role ? roles.includes(userProfile.role) : false;
  };

  // Sayfa/yol erişim kontrolü
  const canAccess = (path: string) => {
    // Yolu normalize et
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    const pathSegments = normalizedPath.split('/');
    const basePath = pathSegments[0] || '/';
    
    // Rota izinlerini kontrol et
    const permissions = ROUTE_PERMISSIONS[basePath as keyof typeof ROUTE_PERMISSIONS];
    
    // Rota tanımlanmamışsa, varsayılan olarak erişime izin verme
    if (!permissions) return false;
    
    // Tüm kullanıcılara açık rotalar
    if (permissions.includes('*')) return true;
    
    // Oturum açmayan kullanıcılar için
    if (!currentUser || !userProfile) return false;
    
    // Admin her şeye erişebilir
    if (userProfile.role === 'admin') return true;
    
    // Kullanıcının rolü gerekli rollerden biri mi kontrol et
    return userProfile.role ? permissions.includes(userProfile.role) : false;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    createUserProfile,
    canAccess,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 