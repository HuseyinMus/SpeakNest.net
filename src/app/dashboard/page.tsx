'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { userService, User } from '@/lib/services/UserService';
import { rbacService, UserRole } from '@/lib/auth/rbac';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  
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
        } catch (err: any) {
          console.error('Kullanıcı listesi yüklenemedi:', err);
          setError('Kullanıcı listesi yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });
    
    return () => unsubscribe();
  }, [router]);
  
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
          return { ...user, role: newRole };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setMessage(`Kullanıcı rolü "${rbacService.getRoleDisplayName(newRole)}" olarak güncellendi.`);
      
    } catch (error: any) {
      setError('Rol güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setChangingRole(null);
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
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Gösterge Paneli</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentUser?.email || 'Kullanıcı'} 
                {isAdmin && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Admin</span>}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
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
        
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
} 