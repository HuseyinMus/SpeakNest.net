import { auth, db } from './config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Google Auth Provider oluşturma
const googleProvider = new GoogleAuthProvider();

// Google ile giriş yapma
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Kullanıcı Firestore'da var mı kontrol et
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    // Kullanıcı Firestore'da yoksa ekle
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'İsimsiz Kullanıcı',
        photoURL: user.photoURL,
        role: 'student', // Varsayılan rol
        createdAt: new Date(),
        updatedAt: new Date(),
        provider: 'google'
      });
    } else {
      // Kullanıcı varsa login bilgilerini güncelle
      await setDoc(userRef, {
        updatedAt: new Date(),
        lastLogin: new Date()
      }, { merge: true });
    }
    
    return user;
  } catch (error) {
    console.error('Google ile giriş yapılırken hata oluştu:', error);
    throw error;
  }
}; 