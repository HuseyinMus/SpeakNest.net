'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'select';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'dropdown',
  className = '' 
}) => {
  const { currentLanguage, changeLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode as 'tr' | 'en' | 'es' | 'ar');
    setIsOpen(false);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(e.target.value as 'tr' | 'en' | 'es' | 'ar');
  };

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-1 px-3 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-700"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <Globe size={16} />
          <span className="mx-1">{languages.find(lang => lang.code === currentLanguage)?.name}</span>
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 z-10 w-48 rounded-md bg-white shadow-lg border border-gray-200 py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  currentLanguage === lang.code
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Buttons variant
  if (variant === 'buttons') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-3 py-1 text-sm rounded-md ${
              currentLanguage === lang.code
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Select variant
  return (
    <div className={`flex items-center ${className}`}>
      <Globe size={16} className="text-gray-500 mr-2" />
      <select
        value={currentLanguage}
        onChange={handleSelectChange}
        className="form-select text-sm border border-gray-300 rounded-md py-1.5 pl-3 pr-8 appearance-none bg-white"
        aria-label="Dil seçin"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher; 