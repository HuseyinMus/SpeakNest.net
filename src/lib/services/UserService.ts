import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Cache, Logger, RequirePermission } from '@/lib/aop/decorators';
import { Permission } from '@/lib/auth/rbac';

// Kullanıcı model sınıfı (OOP)
export class User {
  constructor(
    public id: string,
    public email: string,
    public displayName: string,
    public role: string,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
  
  // Kullanıcı verilerini JSON formatına dönüştürme
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  // Firestore verilerinden User nesnesi oluşturma
  static fromFirestore(id: string, data: any): User {
    // Tarih verilerini güvenli bir şekilde işle
    let createdAt = new Date();
    let updatedAt = new Date();
    
    if (data.createdAt) {
      if (data.createdAt instanceof Date) {
        createdAt = data.createdAt;
      } else if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt.seconds) {
        // Firestore Timestamp
        createdAt = new Date(data.createdAt.seconds * 1000);
      }
    }
    
    if (data.updatedAt) {
      if (data.updatedAt instanceof Date) {
        updatedAt = data.updatedAt;
      } else if (data.updatedAt.toDate && typeof data.updatedAt.toDate === 'function') {
        updatedAt = data.updatedAt.toDate();
      } else if (data.updatedAt.seconds) {
        // Firestore Timestamp
        updatedAt = new Date(data.updatedAt.seconds * 1000);
      }
    }
    
    return new User(
      id,
      data.email || '',
      data.displayName || '',
      data.role || 'student',
      createdAt,
      updatedAt
    );
  }
}

// Kullanıcı servis sınıfı (OOP)
export class UserService {
  private static instance: UserService;
  private readonly collectionName = 'users';
  
  private constructor() {}
  
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }
  
  // Tüm kullanıcıları getir - AOP dekoratörleri ile (Caching ve Logging)
  // @Cache(300000) // 5 dakika önbellek
  // @Logger
  // @RequirePermission(Permission.READ)
  public async getAllUsers(): Promise<User[]> {
    console.log("getAllUsers metodu çağrıldı");
    const start = performance.now();
    
    try {
      const usersCollection = collection(db, this.collectionName);
      const snapshot = await getDocs(usersCollection);
      
      const users = snapshot.docs.map(doc => User.fromFirestore(doc.id, doc.data()));
      
      const end = performance.now();
      console.log(`getAllUsers metodu ${end - start}ms sürede tamamlandı.`);
      
      return users;
    } catch (error) {
      console.error(`getAllUsers metodu hata ile sonuçlandı:`, error);
      throw error;
    }
  }
  
  // Kullanıcı ID'sine göre kullanıcı getir
  // @Cache()
  // @Logger
  // @RequirePermission(Permission.READ)
  public async getUserById(userId: string): Promise<User | null> {
    console.log(`getUserById metodu çağrıldı: ${userId}`);
    const start = performance.now();
    
    try {
      const userDoc = await getDoc(doc(db, this.collectionName, userId));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const user = User.fromFirestore(userDoc.id, userDoc.data());
      
      const end = performance.now();
      console.log(`getUserById metodu ${end - start}ms sürede tamamlandı.`);
      
      return user;
    } catch (error) {
      console.error(`getUserById metodu hata ile sonuçlandı:`, error);
      throw error;
    }
  }
  
  // Yeni kullanıcı oluştur
  // @Logger
  // @RequirePermission(Permission.WRITE)
  public async createUser(userId: string, userData: Partial<User>): Promise<User> {
    console.log(`createUser metodu çağrıldı: ${userId}`);
    const start = performance.now();
    
    try {
      const now = new Date();
      
      const newUser = {
        ...userData,
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(doc(db, this.collectionName, userId), newUser);
      
      const user = User.fromFirestore(userId, newUser);
      
      const end = performance.now();
      console.log(`createUser metodu ${end - start}ms sürede tamamlandı.`);
      
      return user;
    } catch (error) {
      console.error(`createUser metodu hata ile sonuçlandı:`, error);
      throw error;
    }
  }
  
  // Kullanıcı güncelle
  // @Logger
  // @RequirePermission(Permission.UPDATE)
  public async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    console.log(`updateUser metodu çağrıldı: ${userId}`);
    const start = performance.now();
    
    try {
      const userRef = doc(db, this.collectionName, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Kullanıcı bulunamadı');
      }
      
      const updatedUser = {
        ...userData,
        updatedAt: new Date()
      };
      
      await updateDoc(userRef, updatedUser);
      
      const user = User.fromFirestore(userId, {
        ...userDoc.data(),
        ...updatedUser
      });
      
      const end = performance.now();
      console.log(`updateUser metodu ${end - start}ms sürede tamamlandı.`);
      
      return user;
    } catch (error) {
      console.error(`updateUser metodu hata ile sonuçlandı:`, error);
      throw error;
    }
  }
  
  // Kullanıcı sil
  // @Logger
  // @RequirePermission(Permission.DELETE)
  public async deleteUser(userId: string): Promise<void> {
    console.log(`deleteUser metodu çağrıldı: ${userId}`);
    const start = performance.now();
    
    try {
      await deleteDoc(doc(db, this.collectionName, userId));
      
      const end = performance.now();
      console.log(`deleteUser metodu ${end - start}ms sürede tamamlandı.`);
    } catch (error) {
      console.error(`deleteUser metodu hata ile sonuçlandı:`, error);
      throw error;
    }
  }
  
  // Rol ile kullanıcıları getir
  // @Cache()
  // @Logger
  // @RequirePermission(Permission.READ)
  public async getUsersByRole(role: string): Promise<User[]> {
    console.log(`getUsersByRole metodu çağrıldı: ${role}`);
    const start = performance.now();
    
    try {
      const usersCollection = collection(db, this.collectionName);
      const q = query(usersCollection, where("role", "==", role));
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(doc => User.fromFirestore(doc.id, doc.data()));
      
      const end = performance.now();
      console.log(`getUsersByRole metodu ${end - start}ms sürede tamamlandı.`);
      
      return users;
    } catch (error) {
      console.error(`getUsersByRole metodu hata ile sonuçlandı:`, error);
      throw error;
    }
  }
  
  // Kullanıcı rolünü güncelle
  // @Logger
  // @RequirePermission(Permission.MANAGE_USERS)
  public async updateUserRole(userId: string, newRole: string): Promise<User> {
    console.log(`updateUserRole metodu çağrıldı: ${userId}, yeni rol: ${newRole}`);
    const start = performance.now();
    
    try {
      const userRef = doc(db, this.collectionName, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Kullanıcı bulunamadı');
      }
      
      const updatedData = {
        role: newRole,
        updatedAt: new Date()
      };
      
      await updateDoc(userRef, updatedData);
      
      // Kullanıcı verilerini Firestore'dan al ve güvenli bir şekilde User nesnesine dönüştür
      const userData = userDoc.data();
      
      // Güncellenmiş kullanıcı nesnesini oluştur
      const user = User.fromFirestore(userId, {
        ...userData,
        role: newRole,
        updatedAt: new Date() // JavaScript Date nesnesi olarak sakla
      });
      
      const end = performance.now();
      console.log(`updateUserRole metodu ${end - start}ms sürede tamamlandı.`);
      
      return user;
    } catch (error) {
      console.error(`updateUserRole metodu hata ile sonuçlandı:`, error);
      throw error;
    }
  }
}

// Singleton instance'ı dışa aktarma
export const userService = UserService.getInstance(); 