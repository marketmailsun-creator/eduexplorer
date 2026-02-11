'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AvatarImageProps {
  src: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
  fallbackText?: string;
}

export default function AvatarImage({
  src,
  alt,
  size = 32,
  className = '',
  fallbackText,
}: AvatarImageProps) {
  const [imageError, setImageError] = useState(false);

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    const initials = getInitials(fallbackText || alt);
    const bgColor = getColorFromText(fallbackText || alt);

    return (
      <div
        className={`flex items-center justify-center rounded-full ${bgColor} ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        }}
      >
        <span
          className="font-semibold text-white select-none"
          style={{ fontSize: `${size * 0.4}px` }}
        >
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        onError={() => setImageError(true)}
        unoptimized={src.includes('googleusercontent.com')} // Don't optimize Google images
      />
    </div>
  );
}

// Get initials from name
function getInitials(name: string): string {
  if (!name || name.trim() === '') return 'U';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() || 'U';
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Generate consistent color from text
function getColorFromText(text: string): string {
  const colors = [
    'bg-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}