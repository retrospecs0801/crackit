'use client';

import React, { useState } from 'react';
import { getAvatarColor } from '@/lib/utils';

export interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  avatarInitials?: string;
  avatarColor?: string;
  className?: string;
  sizeClassName?: string;
}

export function Avatar({
  name,
  avatarUrl,
  avatarInitials,
  avatarColor,
  className = '',
  sizeClassName = 'w-8 h-8 text-[12px]',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials =
    avatarInitials ||
    (name && name.trim().length > 0
      ? name.trim().substring(0, 2).toUpperCase()
      : 'U');

  const bg = avatarColor || getAvatarColor(name || 'User');

  return (
    <div
      className={`rounded-full flex items-center justify-center font-sans font-semibold shrink-0 overflow-hidden select-none ${sizeClassName} ${className}`}
      style={{
        backgroundColor: avatarUrl && !imgError ? 'transparent' : bg,
        color: '#FFFFFF',
      }}
      title={name}
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
