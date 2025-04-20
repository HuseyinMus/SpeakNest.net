'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { currentUser, userProfile, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-semibold">SpeakNest</Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/about" className="hover:text-green-200 transition-colors">Hakkımızda</Link>
              <Link href="/pricing" className="hover:text-green-200 transition-colors">Fiyatlandırma</Link>
              <Link href="/contact" className="hover:text-green-200 transition-colors">İletişim</Link>
            </div>
          </div>
          <div className="space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">
                  Merhaba, {userProfile?.displayName || currentUser.displayName || 'Kullanıcı'}
                </span>
                <button
                  onClick={() => router.push('/profile')}
                  className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Profilim
                </button>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 bg-transparent border border-white text-white rounded hover:bg-white/10 transition-colors"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 bg-white text-green-700 rounded hover:bg-green-50 transition-colors"
                >
                  Kayıt Ol
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 