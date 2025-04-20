'use client';

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy, 
  limit,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
  DocumentReference,
  DocumentData,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, collections } from '@/lib/firebase/config';
import { UserProfile } from '@/lib/context/AuthContext';

// Önbellek süresi (millisaniye) - varsayılan 5 dakika
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Yetkilendirme hataları için özel bir hata sınıfı
export class AuthorizationError extends Error {
  constructor(message: string = 'Bu işlemi yapmak için yetkiniz bulunmuyor.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Koleksiyon erişim hakları
export const COLLECTION_PERMISSIONS = {
  users: {
    read: ['admin', '*owner'], // *owner, kullanıcının kendi verisi
    write: ['admin', '*owner'],
    delete: ['admin']
  },
  meetings: {
    read: ['admin', 'proUser', 'teacher', 'student', '*host', '*participant'],
    write: ['admin', 'proUser', 'teacher', '*host'],
    delete: ['admin', '*host']
  },
  comments: {
    read: ['admin', 'proUser', 'teacher', 'student', '*owner'],
    write: ['admin', 'proUser', 'teacher', 'student', '*owner'],
    delete: ['admin', '*owner']
  },
  messages: {
    read: ['admin', 'proUser', 'teacher', 'student', '*owner', '*participant'], 
    write: ['admin', 'proUser', 'teacher', 'student', '*owner'],
    delete: ['admin', '*owner']
  },
  evaluations: {
    read: ['admin', 'proUser', 'teacher', '*owner'],
    write: ['admin', 'proUser', 'teacher'],
    delete: ['admin', '*owner']
  },
};

class DataService {
  private static instance: DataService;
  private cache: Map<string, CacheItem<any>> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private currentUser: { uid: string; profile?: UserProfile } | null = null;

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Kullanıcı ayarlama
  public setCurrentUser(user: { uid: string; profile?: UserProfile } | null): void {
    this.currentUser = user;
  }

  // Erişim kontrolü
  private checkAccess(collectionName: string, operation: 'read' | 'write' | 'delete', docData?: any): boolean {
    // Kullanıcı giriş yapmamışsa yetkisi yok
    if (!this.currentUser) {
      return false;
    }

    // Koleksiyon izinlerini al
    const permissions = COLLECTION_PERMISSIONS[collectionName as keyof typeof COLLECTION_PERMISSIONS];
    
    if (!permissions) {
      // Tanımlanmamış koleksiyonlara sadece admin erişebilir
      return this.currentUser.profile?.role === 'admin';
    }

    const allowedRoles = permissions[operation];
    
    if (!allowedRoles || allowedRoles.length === 0) {
      return false;
    }

    // Admin her şeye erişebilir
    if (this.currentUser.profile?.role === 'admin') {
      return true;
    }

    // Rol bazlı kontrol
    const hasRolePermission = this.currentUser.profile?.role 
      ? allowedRoles.includes(this.currentUser.profile.role)
      : false;
    
    if (hasRolePermission) {
      return true;
    }

    // Özel izinler (*owner, *host, *participant)
    if (docData) {
      // *owner kontrolü - kullanıcının kendi belgesi mi?
      if (allowedRoles.includes('*owner') && 
          (docData.userId === this.currentUser.uid ||
           docData.id === this.currentUser.uid)) {
        return true;
      }
      
      // *host kontrolü - kullanıcı toplantı sahibi mi?
      if (allowedRoles.includes('*host') && 
          docData.hostId === this.currentUser.uid) {
        return true;
      }
      
      // *participant kontrolü - kullanıcı katılımcı mı?
      if (allowedRoles.includes('*participant') && 
          docData.participants && 
          Array.isArray(docData.participants) &&
          (docData.participants.includes(this.currentUser.uid) ||
           docData.participants.some((p: any) => p.id === this.currentUser.uid))) {
        return true;
      }
    }
    
    return false;
  }

  // Önbellek kontrolü
  private isCacheValid<T>(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return now - cached.timestamp < CACHE_DURATION;
  }

  // Önbelleğe veri ekleme
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Önbellekten veri alma
  private getCache<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data as T;
    }
    return null;
  }

  // Önbelleği temizleme (tüm önbellek veya belirli bir anahtar)
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Tek bir belge getirme
  public async getDocument<T>(
    collectionName: string, 
    documentId: string, 
    useCache: boolean = true
  ): Promise<T | null> {
    try {
      const cacheKey = `${collectionName}/${documentId}`;
      
      // Önbellekten kontrol et
      if (useCache) {
        const cachedData = this.getCache<T>(cacheKey);
        if (cachedData) {
          // Önbellekteki veri için de yetki kontrolü yap
          if (!this.checkAccess(collectionName, 'read', cachedData)) {
            throw new AuthorizationError();
          }
          return cachedData;
        }
      }
      
      // Önbellekte yoksa Firestore'dan getir
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T;
        
        // Yetki kontrolü
        if (!this.checkAccess(collectionName, 'read', data)) {
          throw new AuthorizationError();
        }
        
        this.setCache(cacheKey, data);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Belge koleksiyonu getirme (sorgu ile)
  public async getDocuments<T>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    useCache: boolean = true
  ): Promise<T[]> {
    try {
      // Sorgu parametrelerinden önbellek anahtarı oluştur
      const constraintsKey = JSON.stringify(
        constraints.map(c => c.toString()).sort()
      );
      const cacheKey = `${collectionName}?${constraintsKey}`;
      
      // Önbellekten kontrol et
      if (useCache) {
        const cachedData = this.getCache<T[]>(cacheKey);
        if (cachedData) {
          // Kullanıcı rolü değiştiyse önbelleği temizle
          if (cachedData.length > 0 && !this.checkCollectionAccess(collectionName, 'read', cachedData)) {
            this.clearCache(cacheKey);
          } else {
            return cachedData;
          }
        }
      }
      
      // Önbellekte yoksa Firestore'dan getir
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      // Sadece erişim izni olan belgeleri filtrele
      const filteredResults = this.filterAuthorizedDocuments(collectionName, 'read', results);
      
      this.setCache(cacheKey, filteredResults);
      return filteredResults;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Yetkilendirme kontrolü yaparak belgeleri filtrele
  private filterAuthorizedDocuments<T>(collectionName: string, operation: 'read' | 'write' | 'delete', documents: T[]): T[] {
    return documents.filter(doc => this.checkAccess(collectionName, operation, doc));
  }

  // Koleksiyon erişimi kontrolü
  private checkCollectionAccess<T>(collectionName: string, operation: 'read' | 'write' | 'delete', documents: T[]): boolean {
    // En az bir belgeye erişim varsa true döndür
    return documents.some(doc => this.checkAccess(collectionName, operation, doc));
  }

  // Sayfalama ile belge koleksiyonu getirme
  public async getPaginatedDocuments<T>(
    collectionName: string,
    pageSize: number = 10,
    startAfterDoc: DocumentSnapshot | null = null,
    constraints: QueryConstraint[] = []
  ): Promise<{
    data: T[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    try {
      let queryConstraints = [...constraints, limit(pageSize + 1)];
      
      if (startAfterDoc) {
        queryConstraints.push(startAfter(startAfterDoc));
      }
      
      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const hasMore = querySnapshot.docs.length > pageSize;
      const docs = hasMore 
        ? querySnapshot.docs.slice(0, pageSize) 
        : querySnapshot.docs;
      
      const resultsWithData = docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      // Sadece erişim izni olan belgeleri filtrele
      const filteredResults = this.filterAuthorizedDocuments(collectionName, 'read', resultsWithData);
      
      // Eğer filtre sonrası belge kalmadıysa null döndür
      if (filteredResults.length === 0) {
        return {
          data: [],
          lastDoc: null,
          hasMore: false
        };
      }
      
      // Son belgeyi al
      const lastVisibleDoc = filteredResults.length > 0 
        ? docs[filteredResults.length - 1] 
        : null;
      
      return {
        data: filteredResults,
        lastDoc: lastVisibleDoc,
        hasMore: hasMore && filteredResults.length === pageSize
      };
    } catch (error) {
      console.error(`Error getting paginated documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Belge oluşturma veya güncelleme
  public async setDocument<T>(
    collectionName: string,
    documentId: string,
    data: Partial<T>,
    merge: boolean = true
  ): Promise<void> {
    try {
      // Yetki kontrolü
      if (!this.checkAccess(collectionName, 'write', {...data, id: documentId})) {
        throw new AuthorizationError();
      }
      
      const timestamp = serverTimestamp();
      
      // Timestamps ekle
      const dataWithTimestamps = {
        ...data,
        updatedAt: timestamp,
      };
      
      // Yeni belge ise createdAt ekle
      if (!merge) {
        dataWithTimestamps.createdAt = timestamp;
      }
      
      const docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, dataWithTimestamps, { merge });
      
      // Önbelleği güncelle
      this.clearCache(`${collectionName}/${documentId}`);
      
      // Koleksiyon sorguları için önbelleği temizle
      const collectionCacheKeys = Array.from(this.cache.keys())
        .filter(key => key.startsWith(`${collectionName}?`));
      
      collectionCacheKeys.forEach(key => this.clearCache(key));
    } catch (error) {
      console.error(`Error setting document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Belge silme
  public async deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<void> {
    try {
      // Belgeyi önce getir ve yetki kontrolü yap
      const docData = await this.getDocument(collectionName, documentId, false);
      
      if (!docData) {
        throw new Error(`Document ${documentId} not found in ${collectionName}`);
      }
      
      if (!this.checkAccess(collectionName, 'delete', docData)) {
        throw new AuthorizationError();
      }
      
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      
      // Önbelleği güncelle
      this.clearCache(`${collectionName}/${documentId}`);
      
      // Koleksiyon sorguları için önbelleği temizle
      const collectionCacheKeys = Array.from(this.cache.keys())
        .filter(key => key.startsWith(`${collectionName}?`));
      
      collectionCacheKeys.forEach(key => this.clearCache(key));
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Gerçek zamanlı dinleyici ekleme
  public subscribeToDocument<T>(
    collectionName: string,
    documentId: string,
    callback: (data: T | null) => void
  ): () => void {
    const docRef = doc(db, collectionName, documentId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as T;
        
        // Yetki kontrolü
        if (this.checkAccess(collectionName, 'read', data)) {
          callback(data);
          
          // Önbelleği güncelle
          this.setCache(`${collectionName}/${documentId}`, data);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error subscribing to document ${collectionName}/${documentId}:`, error);
      callback(null);
    });
    
    // Dinleyiciyi kaydet
    this.listeners.set(`${collectionName}/${documentId}`, unsubscribe);
    
    return unsubscribe;
  }

  // Koleksiyon dinleyici ekleme
  public subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ): () => void {
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      // Sadece erişim izni olan belgeleri filtrele
      const filteredResults = this.filterAuthorizedDocuments(collectionName, 'read', results);
      
      callback(filteredResults);
      
      // Önbelleği güncelle
      const constraintsKey = JSON.stringify(
        constraints.map(c => c.toString()).sort()
      );
      const cacheKey = `${collectionName}?${constraintsKey}`;
      this.setCache(cacheKey, filteredResults);
    }, (error) => {
      console.error(`Error subscribing to collection ${collectionName}:`, error);
      callback([]);
    });
    
    // Dinleyiciyi kaydet
    const listenerKey = `${collectionName}?${JSON.stringify(constraints)}`;
    this.listeners.set(listenerKey, unsubscribe);
    
    return unsubscribe;
  }

  // Dinleyiciyi kaldırma
  public unsubscribe(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  // Tüm dinleyicileri kaldırma
  public unsubscribeAll(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}

export const dataService = DataService.getInstance(); 