'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { userService, User } from '@/lib/services/UserService';
import { rbacService } from '@/lib/auth/rbac';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { Home, Users, Book, Settings, LogOut, BookOpen } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{uid?: string; email?: string | null; displayName?: string | null} | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Kelime Grupları için state'ler
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [showAddWordGroupModal, setShowAddWordGroupModal] = useState(false);
  const [showEditWordGroupModal, setShowEditWordGroupModal] = useState(false);
  const [editingWordGroup, setEditingWordGroup] = useState<WordGroup | null>(null);
  const [newWordGroup, setNewWordGroup] = useState<WordGroupInput>({
    title: '',
    description: '',
    level: 'beginner',
    category: 'daily',
    wordCount: 0,
    creator: ''
  });
  const [addingWordGroup, setAddingWordGroup] = useState(false);
  const [editingWordGroupState, setEditingWordGroupState] = useState(false);
  
  const router = useRouter();
  
  // Kelime Grubu için tip tanımlamaları
  interface WordGroup {
    id: string;
    title: string;
    description: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: 'daily' | 'business' | 'travel' | 'academic';
    wordCount: number;
    creator: string;
    createdAt: Timestamp;
    words?: Word[];
  }
  
  // Kelime için tip tanımlaması
  interface Word {
    id: string;
    english: string;
    turkish: string;
    example?: string;
    pronunciation?: string;
  }
  
  // Form için input tipi
  interface WordGroupInput {
    title: string;
    description: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: 'daily' | 'business' | 'travel' | 'academic';
    wordCount: number;
    creator: string;
    words?: Word[];
  }
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Kullanıcının admin olup olmadığını kontrol et
        try {
          const userDoc = await userService.getUserById(user.uid);
          setIsAdmin(userDoc?.role === 'admin');
        } catch (error) {
          console.error('Kullanıcı rolü kontrol edilemedi:', error);
        }
        
        try {
          // İlk başlangıçta kullanıcı listesi olmayabilir, bu durumu ele alalım
          const usersList = await userService.getAllUsers().catch(err => {
            console.log("Kullanıcı listesi alınamadı, boş liste kullanılıyor:", err);
            return [];
          });
          
          setUsers(usersList);
          
          // Kelime gruplarını getir
          await fetchWordGroups();
          
        } catch (err: Error | unknown) {
          console.error('Kullanıcı listesi yüklenemedi:', err);
          setError('Kullanıcı listesi yüklenemedi: ' + ((err as Error).message || 'Bilinmeyen hata'));
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });
    
    return () => unsubscribe();
  }, [router]);
  
  // Kelime gruplarını getir
  const fetchWordGroups = async () => {
    try {
      // Kullanıcı rol kontrolü kaldırıldı - herkes kelime gruplarını görebilir
      
      const wordGroupsQuery = query(collection(db, 'wordGroups'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(wordGroupsQuery);
      
      const groups: WordGroup[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<WordGroup, 'id'>;
        groups.push({ 
          id: doc.id, 
          ...data 
        });
      });
      
      setWordGroups(groups);
    } catch (error) {
      console.error('Kelime grupları getirilirken hata oluştu:', error);
      setError('Kelime grupları yüklenemedi: ' + ((error as Error).message || 'Firebase erişim hatası'));
    }
  };
  
  // Kelime grubu ekle
  const handleAddWordGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingWordGroup(true);
    setError('');
    setMessage('');
    
    try {
      // Admin kontrolü
      if (!isAdmin) {
        setError('Yalnızca admin kullanıcılar kelime grupları ekleyebilir.');
        setAddingWordGroup(false);
        return;
      }
      
      // Form validasyonu
      if (!newWordGroup.title.trim()) {
        setError('Başlık alanı zorunludur.');
        setAddingWordGroup(false);
        return;
      }
      
      // Admin ise creator "SpeakNest" olsun
      const creatorName = isAdmin ? "SpeakNest" : (currentUser?.displayName || currentUser?.email || 'Kullanıcı');
      
      // Firestore'a ekle
      const docRef = await addDoc(collection(db, 'wordGroups'), {
        ...newWordGroup,
        createdAt: Timestamp.now(),
        creator: creatorName
      });
      
      // State'i güncelle
      const newGroup = {
        id: docRef.id,
        ...newWordGroup,
        createdAt: Timestamp.now(),
        creator: creatorName
      };
      
      setWordGroups([newGroup, ...wordGroups]);
      setNewWordGroup({
        title: '',
        description: '',
        level: 'beginner',
        category: 'daily',
        wordCount: 0,
        creator: ''
      });
      setMessage('Kelime grubu başarıyla eklendi.');
      setShowAddWordGroupModal(false);
    } catch (error) {
      const errorMessage = error instanceof FirebaseError || error instanceof Error 
        ? error.message 
        : 'Bilinmeyen hata';
      setError('Kelime grubu eklenirken bir hata oluştu: ' + errorMessage);
      console.error('Kelime grubu ekleme hatası:', error);
    } finally {
      setAddingWordGroup(false);
    }
  };
  
  // Kelime grubu sil
  const handleDeleteWordGroup = async (id: string) => {
    if (!confirm('Bu kelime grubunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      // Admin kontrolü
      if (!isAdmin) {
        setError('Yalnızca admin kullanıcılar kelime grupları silebilir.');
        return;
      }
      
      // Firestore'dan sil
      await deleteDoc(doc(db, 'wordGroups', id));
      
      // State'i güncelle
      setWordGroups(wordGroups.filter(group => group.id !== id));
      setMessage('Kelime grubu başarıyla silindi.');
    } catch (error) {
      const errorMessage: string = error instanceof FirebaseError || error instanceof Error 
        ? error.message 
        : 'Bilinmeyen hata';
      setError('Kelime grubu silinirken bir hata oluştu: ' + errorMessage);
      console.error('Kelime grubu silme hatası:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Çıkış yapılamadı:', error);
    }
  };
  
  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    setMessage('');
    
    try {
      await userService.updateUserRole(userId, newRole);
      
      // Kullanıcı listesini güncelle
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return { ...user, role: newRole } as User;
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setMessage(`Kullanıcı rolü "${rbacService.getRoleDisplayName(newRole)}" olarak güncellendi.`);
      
    } catch (error: Error | unknown) {
      setError('Rol güncellenemedi: ' + ((error as Error).message || 'Bilinmeyen hata'));
    } finally {
      setChangingRole(null);
    }
  };
  
  // Kelime grubu düzenleme fonksiyonu
  const handleEditWordGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditingWordGroupState(true);
    setError('');
    setMessage('');
    
    try {
      // Admin kontrolü
      if (!isAdmin) {
        setError('Yalnızca admin kullanıcılar kelime gruplarını düzenleyebilir.');
        setEditingWordGroupState(false);
        return;
      }
      
      if (!editingWordGroup) {
        setError('Düzenlenecek kelime grubu bulunamadı.');
        setEditingWordGroupState(false);
        return;
      }
      
      // Form validasyonu
      if (!editingWordGroup.title.trim()) {
        setError('Başlık alanı zorunludur.');
        setEditingWordGroupState(false);
        return;
      }
      
      // Firestore'da güncelle (creator alanını admin ise "SpeakNest" olarak ayarla)
      const updatedData: { 
        title: string; 
        description: string; 
        level: 'beginner' | 'intermediate' | 'advanced'; 
        category: 'daily' | 'business' | 'travel' | 'academic'; 
        wordCount: number; 
        updatedAt: Timestamp;
        creator?: string; 
      } = {
        title: editingWordGroup.title,
        description: editingWordGroup.description,
        level: editingWordGroup.level,
        category: editingWordGroup.category,
        wordCount: editingWordGroup.wordCount,
        updatedAt: Timestamp.now(),
      };
      
      // Admin tarafından düzenleniyorsa, creator "SpeakNest" olsun
      if (isAdmin) {
        updatedData.creator = "SpeakNest";
        editingWordGroup.creator = "SpeakNest";
      }
      
      await updateDoc(doc(db, 'wordGroups', editingWordGroup.id), updatedData);
      
      // State'i güncelle
      setWordGroups(wordGroups.map(group => 
        group.id === editingWordGroup.id ? editingWordGroup : group
      ));
      
      setMessage('Kelime grubu başarıyla güncellendi.');
      setShowEditWordGroupModal(false);
      setEditingWordGroup(null);
    } catch (error) {
      const errorMessage = error instanceof FirebaseError || error instanceof Error 
        ? error.message 
        : 'Bilinmeyen hata';
      setError('Kelime grubu güncellenirken bir hata oluştu: ' + errorMessage);
      console.error('Kelime grubu güncelleme hatası:', error);
    } finally {
      setEditingWordGroupState(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }
  
  // Sidebar menü öğeleri
  const menuItems = [
    { id: 'dashboard', label: 'Gösterge Paneli', icon: <Home size={20} /> },
    { id: 'users', label: 'Kullanıcı İşlemleri', icon: <Users size={20} /> },
    { id: 'vocabulary', label: 'Kelime Grupları', icon: <BookOpen size={20} /> },
    { id: 'content', label: 'İçerik Yönetimi', icon: <Book size={20} /> },
    { id: 'settings', label: 'Ayarlar', icon: <Settings size={20} /> },
  ];
  
  // İçerik render fonksiyonu
  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">Toplam Kullanıcı</h2>
                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">Öğretmen</h2>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter(user => user.role === 'teacher').length}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">Editör</h2>
                <p className="text-3xl font-bold text-yellow-600">
                  {users.filter(user => user.role === 'editor').length}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">Öğrenci</h2>
                <p className="text-3xl font-bold text-purple-600">
                  {users.filter(user => user.role === 'student').length}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Son Aktiviteler</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600">Son aktiviteler burada görüntülenecek...</p>
              </div>
            </div>
          </>
        );
      case 'users':
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Kullanıcı Listesi</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-posta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.displayName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : user.role === 'teacher'
                              ? 'bg-green-100 text-green-800'
                              : user.role === 'editor'
                              ? 'bg-yellow-100 text-yellow-800'
                              : user.role === 'proUser'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {rbacService.getRoleDisplayName(user.role)}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {changingRole === user.id ? (
                              <span className="text-gray-500">İşleniyor...</span>
                            ) : (
                              <div className="flex items-center space-x-2">
                                {user.role !== 'admin' && (
                                  <select 
                                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Rol Seç</option>
                                    <option value="teacher">Öğretmen</option>
                                    <option value="editor">Editör</option>
                                    <option value="proUser">Pro Kullanıcı</option>
                                    <option value="student">Öğrenci</option>
                                  </select>
                                )}
                                {user.role === 'admin' && (
                                  <span className="text-gray-500">Admin rolü değiştirilemez</span>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="px-6 py-4 text-center text-sm text-gray-500">
                        Kullanıcı bulunamadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'vocabulary':
        return (
          <div className="space-y-6">
            {/* Kelime Grubu Ekleme Modalı */}
            {showAddWordGroupModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-800">Yeni Kelime Grubu Ekle</h3>
                    <button 
                      onClick={() => setShowAddWordGroupModal(false)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Kelime Grubu Başlığı <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={newWordGroup.title}
                          onChange={(e) => setNewWordGroup({...newWordGroup, title: e.target.value})}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Kelime grubu başlığını girin"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Açıklama
                        </label>
                        <textarea
                          id="description"
                          value={newWordGroup.description}
                          onChange={(e) => setNewWordGroup({...newWordGroup, description: e.target.value})}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Kelime grubu açıklaması"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                            Seviye
                          </label>
                          <select
                            id="level"
                            value={newWordGroup.level}
                            onChange={(e) => setNewWordGroup({
                              ...newWordGroup, 
                              level: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                            })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="beginner">Başlangıç Seviyesi</option>
                            <option value="intermediate">Orta Seviye</option>
                            <option value="advanced">İleri Seviye</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Kategori
                          </label>
                          <select
                            id="category"
                            value={newWordGroup.category}
                            onChange={(e) => setNewWordGroup({
                              ...newWordGroup, 
                              category: e.target.value as 'daily' | 'business' | 'travel' | 'academic'
                            })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="daily">Günlük Konuşma</option>
                            <option value="business">İş İngilizcesi</option>
                            <option value="travel">Seyahat</option>
                            <option value="academic">Akademik</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-1">
                          Kelime Sayısı
                        </label>
                        <input
                          type="number"
                          id="wordCount"
                          value={newWordGroup.wordCount}
                          onChange={(e) => setNewWordGroup({...newWordGroup, wordCount: parseInt(e.target.value) || 0})}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowAddWordGroupModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleAddWordGroup}
                        disabled={addingWordGroup || !newWordGroup.title.trim()}
                        className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 ${
                          addingWordGroup || !newWordGroup.title.trim() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {addingWordGroup ? 'Ekleniyor...' : 'Kelime Grubu Ekle'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Kelime Grubu Düzenleme Modalı */}
            {showEditWordGroupModal && editingWordGroup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-800">Kelime Grubu Düzenle</h3>
                    <button 
                      onClick={() => setShowEditWordGroupModal(false)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                          Kelime Grubu Başlığı <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="edit-title"
                          value={editingWordGroup.title}
                          onChange={(e) => setEditingWordGroup({...editingWordGroup, title: e.target.value})}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Kelime grubu başlığını girin"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                          Açıklama
                        </label>
                        <textarea
                          id="edit-description"
                          value={editingWordGroup.description}
                          onChange={(e) => setEditingWordGroup({...editingWordGroup, description: e.target.value})}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Kelime grubu açıklaması"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="edit-level" className="block text-sm font-medium text-gray-700 mb-1">
                            Seviye
                          </label>
                          <select
                            id="edit-level"
                            value={editingWordGroup.level}
                            onChange={(e) => setEditingWordGroup({
                              ...editingWordGroup, 
                              level: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                            })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="beginner">Başlangıç Seviyesi</option>
                            <option value="intermediate">Orta Seviye</option>
                            <option value="advanced">İleri Seviye</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
                            Kategori
                          </label>
                          <select
                            id="edit-category"
                            value={editingWordGroup.category}
                            onChange={(e) => setEditingWordGroup({
                              ...editingWordGroup, 
                              category: e.target.value as 'daily' | 'business' | 'travel' | 'academic'
                            })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="daily">Günlük Konuşma</option>
                            <option value="business">İş İngilizcesi</option>
                            <option value="travel">Seyahat</option>
                            <option value="academic">Akademik</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="edit-wordCount" className="block text-sm font-medium text-gray-700 mb-1">
                          Kelime Sayısı
                        </label>
                        <input
                          type="number"
                          id="edit-wordCount"
                          value={editingWordGroup.wordCount}
                          onChange={(e) => setEditingWordGroup({...editingWordGroup, wordCount: parseInt(e.target.value) || 0})}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowEditWordGroupModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleEditWordGroup}
                        disabled={editingWordGroupState || !editingWordGroup.title.trim()}
                        className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 ${
                          editingWordGroupState || !editingWordGroup.title.trim() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {editingWordGroupState ? 'Güncelleniyor...' : 'Güncelle'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Kelime Grupları Yönetimi</h2>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Mevcut Kelime Grupları</h3>
                  <button 
                    onClick={() => setShowAddWordGroupModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                  >
                    Yeni Kelime Grubu Ekle
                  </button>
                </div>
                
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Başlık
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seviye
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kelime Sayısı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Oluşturan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {wordGroups.length > 0 ? (
                        wordGroups.map((group) => (
                          <tr key={group.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {group.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                group.level === 'beginner' 
                                  ? 'bg-green-100 text-green-800' 
                                  : group.level === 'intermediate'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {group.level === 'beginner' 
                                  ? 'Başlangıç Seviyesi' 
                                  : group.level === 'intermediate'
                                  ? 'Orta Seviye'
                                  : 'İleri Seviye'
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {group.category === 'daily' 
                                ? 'Günlük Konuşma' 
                                : group.category === 'business'
                                ? 'İş İngilizcesi'
                                : group.category === 'travel'
                                ? 'Seyahat'
                                : 'Akademik'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {group.wordCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {group.creator}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => {
                                    setEditingWordGroup(group);
                                    setShowEditWordGroupModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-medium transition duration-150 ease-in-out"
                                >
                                  Düzenle
                                </button>
                                <button 
                                  onClick={() => handleDeleteWordGroup(group.id)}
                                  className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-semibold transition duration-150 ease-in-out shadow-sm hover:shadow"
                                >
                                  Sil
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            Henüz kelime grubu eklenmemiş
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">İçerik Yönetimi</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">İçerik yönetimi bölümü burada olacak...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Ayarlar</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Sistem ayarları bölümü burada olacak...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg fixed inset-y-0 left-0 z-30 transform transition duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full w-64">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold text-blue-600">SpeakNest</span>
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Admin</span>
            </Link>
            <button 
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            <nav className="px-2 py-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={`mr-3 ${activeSection === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 truncate max-w-[160px]">
                  {currentUser?.displayName || currentUser?.email || 'Admin Kullanıcı'}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
            <button
              className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-2" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <span className="text-xl font-semibold text-blue-600">SpeakNest Admin</span>
            </div>
            <div className="w-6"></div> {/* Boş alan, dengeli görünüm için */}
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
          
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {menuItems.find(item => item.id === activeSection)?.label || 'Gösterge Paneli'}
            </h1>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 