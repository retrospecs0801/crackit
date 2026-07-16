'use client';

import React from 'react';

export interface PresenceIndicatorProps {
  isOnline?: boolean;
  lastSeenAt?: string | null;
  sizeClassName?: string;
  showText?: boolean;
  className?: string;
}

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Offline';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Offline';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function PresenceIndicator({
  isOnline = false,
  lastSeenAt,
  sizeClassName = 'w-2 h-2',
  showText = false,
  className = '',
}: PresenceIndicatorProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div
        className={`rounded-full shrink-0 ${sizeClassName} ${
          isOnline ? 'bg-accent-green shadow-[0_0_6px_rgba(92,122,90,0.6)] animate-pulse' : 'bg-text-muted/60'
        }`}
        title={isOnline ? 'Online now' : `Last seen: ${formatRelativeTime(lastSeenAt)}`}
      />
      {showText && (
        <span className="font-sans text-[11px] font-medium text-text-secondary">
          {isOnline ? 'Online now' : `Last seen ${formatRelativeTime(lastSeenAt)}`}
        </span>
      )}
    </div>
  );
}
