'use client';

import React from 'react';
import { LanguageProvider } from "@/lib/context/LanguageContext";
import { ToastProvider } from '@/lib/context/ToastContext';
import { AuthProvider } from '@/lib/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
} 