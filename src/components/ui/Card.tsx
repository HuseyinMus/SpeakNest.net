'use client';

import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  color?: 'blue' | 'indigo' | 'green' | 'red' | 'slate' | 'purple';
}

export function CardHeader({ 
  children, 
  className = '', 
  gradient = false,
  color = 'blue'
}: CardHeaderProps) {
  // Renk konfigürasyonları
  const colorConfig = {
    blue: gradient 
      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white' 
      : 'bg-blue-50 text-blue-700',
    indigo: gradient 
      ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white' 
      : 'bg-indigo-50 text-indigo-700',
    green: gradient 
      ? 'bg-gradient-to-r from-green-600 to-teal-700 text-white' 
      : 'bg-green-50 text-green-700',
    red: gradient 
      ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white' 
      : 'bg-red-50 text-red-700',
    slate: gradient 
      ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white' 
      : 'bg-slate-100 text-slate-700',
    purple: gradient 
      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-700 text-white' 
      : 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`p-4 ${colorConfig[color]} ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function CardTitle({ children, className = '', icon }: CardTitleProps) {
  return (
    <div className={`text-lg font-medium flex items-center gap-2 ${className}`}>
      {icon}
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
  divider?: boolean;
}

export function CardFooter({ children, className = '', divider = true }: CardFooterProps) {
  return (
    <div className={`p-4 ${divider ? 'border-t border-slate-200' : ''} ${className}`}>
      {children}
    </div>
  );
}

interface CardGridProps {
  children: ReactNode;
  className?: string;
  columns?: number;
  gap?: number;
}

export function CardGrid({ 
  children, 
  className = '', 
  columns = 1, 
  gap = 4 
}: CardGridProps) {
  return (
    <div 
      className={`grid gap-${gap} ${
        columns === 1 ? '' :
        columns === 2 ? 'sm:grid-cols-2' :
        columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' :
        columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' :
        'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      } ${className}`}
    >
      {children}
    </div>
  );
} 