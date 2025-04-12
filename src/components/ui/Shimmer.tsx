'use client';

import React from 'react';

interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export function Shimmer({
  className = '',
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
}: ShimmerProps) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200 animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
    </div>
  );
}

interface ShimmerCardProps {
  className?: string;
  rows?: number;
  imageHeight?: string | number;
  rounded?: boolean;
}

export function ShimmerCard({
  className = '',
  rows = 3,
  imageHeight = '12rem',
  rounded = false,
}: ShimmerCardProps) {
  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      {/* Kart Resmi */}
      <Shimmer
        className="w-full"
        height={imageHeight}
        borderRadius={rounded ? '0.5rem 0.5rem 0 0' : '0'}
      />

      {/* Kart İçeriği */}
      <div className="p-4 space-y-3">
        {/* Başlık */}
        <Shimmer className="w-3/4" height="1.5rem" />

        {/* İçerik Satırları */}
        {Array.from({ length: rows }).map((_, index) => (
          <Shimmer
            key={index}
            className={`${index === rows - 1 ? 'w-2/3' : 'w-full'}`}
            height="1rem"
          />
        ))}

        {/* Alt Butonlar */}
        <div className="flex items-center justify-between pt-2">
          <Shimmer className="w-24" height="2rem" borderRadius="0.375rem" />
          <Shimmer className="w-24" height="2rem" borderRadius="0.375rem" />
        </div>
      </div>
    </div>
  );
}

export function ShimmerTable({
  className = '',
  rows = 5,
  columns = 4,
}: {
  className?: string;
  rows?: number;
  columns?: number;
}) {
  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      {/* Tablo Başlığı */}
      <div className="px-4 py-3 bg-slate-50 border-b">
        <Shimmer className="w-1/3" height="1.5rem" />
      </div>

      {/* Tablo İçeriği */}
      <div className="p-2">
        {/* Başlık Satırı */}
        <div className="grid grid-cols-12 gap-2 mb-4 p-2">
          {Array.from({ length: columns }).map((_, index) => (
            <Shimmer
              key={`header-${index}`}
              className={`col-span-${12 / columns}`}
              height="1.25rem"
            />
          ))}
        </div>

        {/* Veri Satırları */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid grid-cols-12 gap-2 p-2 border-t"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Shimmer
                key={`cell-${rowIndex}-${colIndex}`}
                className={`col-span-${12 / columns}`}
                height="1rem"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShimmerList({
  className = '',
  items = 3,
}: {
  className?: string;
  items?: number;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="bg-white shadow-sm rounded-lg overflow-hidden p-4 border"
        >
          <div className="flex items-center space-x-4">
            {/* Avatar/Icon */}
            <Shimmer width="2.5rem" height="2.5rem" borderRadius="9999px" />
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <Shimmer className="w-1/3" height="1rem" />
              <Shimmer className="w-full" height="0.75rem" />
              <Shimmer className="w-2/3" height="0.75rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShimmerProfile({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      {/* Header/Banner */}
      <Shimmer className="w-full" height="8rem" />
      
      {/* Profile Info */}
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <Shimmer 
            width="5rem" 
            height="5rem" 
            borderRadius="9999px" 
            className="-mt-12 border-4 border-white"
          />
          
          {/* Name and Title */}
          <div className="space-y-2">
            <Shimmer className="w-48" height="1.5rem" />
            <Shimmer className="w-32" height="1rem" />
          </div>
        </div>
        
        {/* Bio */}
        <div className="space-y-2">
          <Shimmer className="w-full" height="0.75rem" />
          <Shimmer className="w-full" height="0.75rem" />
          <Shimmer className="w-2/3" height="0.75rem" />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center space-y-1">
              <Shimmer className="w-12 mx-auto" height="1.25rem" />
              <Shimmer className="w-20 mx-auto" height="0.75rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tailwind CSS için gereken animation tanımı tailwind.config.js dosyasına eklenmelidir:
// theme: {
//   extend: {
//     animation: {
//       shimmer: 'shimmer 1.5s infinite',
//     },
//     keyframes: {
//       shimmer: {
//         '100%': { transform: 'translateX(100%)' },
//       },
//     },
//   },
// }, 