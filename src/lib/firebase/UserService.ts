import { db } from './config';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Logger, PerformanceTracker } from '@/lib/aop/decorators';

// Kullanıcı modeli
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  role: string;
  englishLevel?: string;
  preferredLanguage?: string; // Tercih edilen dil
  createdAt: Date;
  updatedAt: Date;
}

// Kullanıcı servisi (OOP)
export class UserService {
  private readonly collectionName = 'users';
  
  // Firestore'dan veri alınırken dönüşüm
  static fromFirestore(data: any, id: string): User {
    // AOP: Veri dönüşümü sırasında field kontrolü ve varsayılan değerler
    return {
      uid: id,
      email: data.email || '',
      displayName: data.displayName || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      photoURL: data.photoURL || '',
      role: data.role || 'student',
      englishLevel: data.englishLevel || '',
      preferredLanguage: data.preferredLanguage || 'tr', // Varsayılan dil: Türkçe
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
    };
  }
  
  // Firestore'a veri gönderilirken dönüşüm
  static toFirestore(user: Partial<User>): any {
    const data: any = { ...user };
    
    // AOP: Tarih alanları için özel işleme
    if (user.createdAt && !(user.createdAt instanceof Timestamp)) {
      data.createdAt = user.createdAt; // Tarih nesnesi olarak bırak
    }
    
    if (user.updatedAt && !(user.updatedAt instanceof Timestamp)) {
      data.updatedAt = user.updatedAt; // Tarih nesnesi olarak bırak
    }
    
    return data;
  }
  
  // Kullanıcı oluşturma
  @Logger
  @PerformanceTracker
  async createUser(userData: Partial<User>): Promise<void> {
    try {
      if (!userData.uid) {
        throw new Error('UID zorunludur');
      }
      
      const now = new Date();
      
      const userWithDefaults = {
        ...userData,
        role: userData.role || 'student',
        preferredLanguage: userData.preferredLanguage || 'tr',
        createdAt: now,
        updatedAt: now
      };
      
      const userRef = doc(db, this.collectionName, userData.uid);
      await setDoc(userRef, UserService.toFirestore(userWithDefaults));
      
    } catch (error) {
      console.error('Kullanıcı oluşturma hatası:', error);
      throw error;
    }
  }
  
  // Kullanıcı bilgilerini güncelleme
  @Logger
  async updateUser(uid: string, userData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, uid);
      
      // Güncelleme tarihini ekle
      const updatedData = {
        ...userData,
        updatedAt: new Date()
      };
      
      await updateDoc(userRef, UserService.toFirestore(updatedData));
      
    } catch (error) {
      console.error('Kullanıcı güncelleme hatası:', error);
      throw error;
    }
  }
  
  // Tercih edilen dili güncelleme özel metodu
  @Logger
  async updateUserLanguage(uid: string, language: string): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, uid);
      
      await updateDoc(userRef, {
        preferredLanguage: language,
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Kullanıcı dil tercihi güncelleme hatası:', error);
      throw error;
    }
  }
  
  // Kullanıcı alma
  @Logger
  async getUser(uid: string): Promise<User | null> {
    try {
      const userRef = doc(db, this.collectionName, uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return UserService.fromFirestore(userDoc.data(), uid);
      }
      
      return null;
      
    } catch (error) {
      console.error('Kullanıcı getirme hatası:', error);
      throw error;
    }
  }
  
  // Rol bazlı kullanıcıları getirme
  @Logger
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const usersQuery = query(
        collection(db, this.collectionName),
        where('role', '==', role)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const users: User[] = [];
      
      usersSnapshot.forEach((doc) => {
        users.push(UserService.fromFirestore(doc.data(), doc.id));
      });
      
      return users;
      
    } catch (error) {
      console.error('Rol bazlı kullanıcı getirme hatası:', error);
      throw error;
    }
  }
} 