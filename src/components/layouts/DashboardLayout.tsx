'use client';

import React, { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Menu, 
  X, 
  Home, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Bell
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  submenu?: MenuItem[];
  requiredRole?: string | string[];
}

interface PageHeader {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  menuItems: MenuItem[];
  header?: PageHeader;
  activeItemId?: string;
}

export default function DashboardLayout({ 
  children, 
  menuItems, 
  header,
  activeItemId = 'dashboard' 
}: DashboardLayoutProps) {
  const { currentUser, userProfile, signOut, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      toast.error(t('logoutError', 'Çıkış yapılamadı'));
    }
  };

  // Menü öğesini render et
  const renderMenuItem = (item: MenuItem) => {
    // Rol gerektiren menü öğesi kontrolü
    if (item.requiredRole && !hasPermission(item.requiredRole)) {
      return null;
    }

    const isActive = activeItemId === item.id;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = activeSubmenu === item.id;

    const handleClick = () => {
      if (hasSubmenu) {
        setActiveSubmenu(isSubmenuOpen ? null : item.id);
      } else if (item.onClick) {
        item.onClick();
      } else {
        router.push(`/${item.id}`);
      }
    };

    return (
      <li key={item.id} className="mb-1">
        <button 
          onClick={handleClick}
          className={`flex items-center justify-between w-full py-2.5 px-3 rounded-md text-sm transition-all duration-200 ${
            isActive 
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm border border-blue-100' 
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            {item.label}
          </div>
          {hasSubmenu && (
            <ChevronDown 
              size={16} 
              className={`transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} 
            />
          )}
        </button>

        {/* Alt menü */}
        {hasSubmenu && isSubmenuOpen && (
          <ul className="pl-8 mt-1 space-y-1">
            {item.submenu.map(subItem => {
              // Alt menü için rol kontrolü
              if (subItem.requiredRole && !hasPermission(subItem.requiredRole)) {
                return null;
              }

              const isSubItemActive = activeItemId === subItem.id;

              return (
                <li key={subItem.id}>
                  <button
                    onClick={() => {
                      if (subItem.onClick) {
                        subItem.onClick();
                      } else {
                        router.push(`/${subItem.id}`);
                      }
                    }}
                    className={`flex items-center gap-2 w-full py-2 px-3 rounded-md text-sm ${
                      isSubItemActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {subItem.icon}
                    {subItem.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Mobil menü düğmesi */}
      <div className="bg-white p-4 flex justify-between items-center md:hidden border-b shadow-sm sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-slate-800">{t('appName')}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label={sidebarOpen ? t('closeSidebar') : t('openSidebar')}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Yan menü */}
        <div className={`bg-white border-r shadow-sm fixed md:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center gap-3 pb-2">
              {userProfile?.photoURL ? (
                <Image 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName || t('profile')}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white/30"
                />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-medium border-2 border-white/30">
                  {userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div className="font-medium">
                  {userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}` || t('user')}
                </div>
                <div className="text-xs text-white/80">
                  {userProfile?.role === 'admin' ? t('administrator') : 
                   userProfile?.role === 'proUser' ? t('conversationHost') : 
                   userProfile?.role === 'teacher' ? t('teacher') : 
                   userProfile?.role === 'student' ? t('student') : t('user')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            <ul className="space-y-1">
              {menuItems.map(renderMenuItem)}
              
              {/* Çıkış butonu */}
              <li className="mt-4 pt-4 border-t border-slate-200">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full py-2.5 px-3 rounded-md text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              </li>
            </ul>
            
            <div className="mt-6 px-3 py-4 border-t pt-4">
              <p className="text-xs text-slate-500 mb-2">{t('selectLanguage')}</p>
              <LanguageSwitcher variant="select" className="w-full" />
            </div>
          </div>
        </div>
        
        {/* Ana içerik alanı */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Sayfa başlığı */}
          {header && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                  {header.icon}
                  {header.title}
                </h1>
                {header.actions}
              </div>
              {header.description && (
                <p className="text-slate-500 mt-1">{header.description}</p>
              )}
            </div>
          )}
          
          {/* Sayfa içeriği */}
          {children}
        </div>
      </div>
    </div>
  );
} 