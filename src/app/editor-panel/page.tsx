'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import { rbacService, Permission } from '@/lib/auth/rbac';
import { blogService, BlogPost, BlogPostStatus } from '@/lib/services/BlogService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from 'firebase/auth';

export default function EditorPanelPage() {
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isEditor, setIsEditor] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [statusChanging, setStatusChanging] = useState<string | null>(null);
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    setActionError('');
    setActionMessage('');
    try {
      const posts = await blogService.getAllPosts();
      setBlogPosts(posts);
    } catch (err) {
      console.error('Blog yazıları yüklenirken hata:', err);
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setActionError('Blog yazıları yüklenemedi: ' + message);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const hasWritePermission = await rbacService.hasPermission(user, Permission.WRITE);
          const hasManageUsersPermission = await rbacService.hasPermission(user, Permission.MANAGE_USERS);

          if (hasWritePermission && !hasManageUsersPermission) {
            setIsEditor(true);
            fetchPosts();
          } else {
            setError('Bu sayfaya erişim yetkiniz yok.');
          }
        } catch (err) {
          console.error('Yetki kontrolü sırasında hata:', err);
          const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
          setError('Yetki kontrolü sırasında bir hata oluştu: ' + message);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, fetchPosts]);

  const handleStatusChange = async (postId: string, newStatus: BlogPostStatus) => {
    setStatusChanging(postId);
    setActionError('');
    setActionMessage('');
    try {
      await blogService.updatePostStatus(postId, newStatus);
      setActionMessage(`Yazı durumu başarıyla ${newStatus === BlogPostStatus.PUBLISHED ? 'Yayında' : 'Taslak'} olarak güncellendi.`);
      fetchPosts();
    } catch (err) {
      console.error('Durum güncellenirken hata:', err);
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setActionError('Yazı durumu güncellenemedi: ' + message);
    } finally {
      setStatusChanging(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yetki Kontrol Ediliyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Hata!</strong>
          <span className="block sm:inline"> {error}</span>
          <div className="mt-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Gösterge Paneline Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isEditor) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="text-xl text-red-600">Erişim Reddedildi.</div>
         <div className="mt-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Gösterge Paneline Dön
            </Link>
          </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
             Hoş geldiniz, {currentUser?.displayName || currentUser?.email || 'Editör'}!
         </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Editör Paneli - Blog Yönetimi</h1>
          <Link
            href="/editor-panel/new-post"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Yeni Yazı Oluştur
          </Link>
        </div>

        {actionError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                 {actionError}
             </div>
         )}
         {actionMessage && (
             <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                 {actionMessage}
             </div>
         )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Yazılarım</h2>
          {postsLoading ? (
            <div className="text-center text-gray-500 py-4">Yazılar yükleniyor...</div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center text-gray-500 py-4">Henüz blog yazısı oluşturulmamış.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blogPosts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{post.title}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.status === BlogPostStatus.PUBLISHED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {post.status === BlogPostStatus.PUBLISHED ? 'Yayında' : 'Taslak'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                         {post.createdAt?.toDate().toLocaleDateString('tr-TR') ?? '-'} 
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                        <Link href={`/editor-panel/edit-post/${post.id}`} className="text-indigo-600 hover:text-indigo-900">Düzenle</Link>
                        {
                          statusChanging === post.id ? (<span className="text-gray-400">İşleniyor...</span>)
                          : post.status === BlogPostStatus.PUBLISHED ? (
                          <button 
                              onClick={() => handleStatusChange(post.id, BlogPostStatus.DRAFT)}
                              className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                              disabled={statusChanging === post.id}
                           >Yayından Kaldır</button>
                        ) : (
                          <button 
                              onClick={() => handleStatusChange(post.id, BlogPostStatus.PUBLISHED)}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              disabled={statusChanging === post.id}
                           >Yayınla</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Ana Gösterge Paneline Dön
          </Link>
        </div>
      </div>
    </div>
  );
} 