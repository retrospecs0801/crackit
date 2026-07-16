'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getConversations, updatePresence } from '@/lib/messaging';

interface MessagesButtonProps {
  userId?: string | null;
}

export function MessagesButton({ userId }: MessagesButtonProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const pathname = usePathname();

  const fetchUnreadTotal = async (uid: string) => {
    try {
      const convs = await getConversations(uid);
      const total = convs.reduce((sum, c) => sum + c.unread_count, 0);
      setUnreadCount(total);
    } catch (err) {
      console.error('Error fetching unread message count:', err);
    }
  };

  // Manage Presence
  useEffect(() => {
    if (!userId) return;

    // Set online immediately
    updatePresence(userId, true);

    const handleVisibilityChange = () => {
      updatePresence(userId, !document.hidden);
    };

    const handleBeforeUnload = () => {
      updatePresence(userId, false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat every 60 seconds while visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        updatePresence(userId, true);
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
      updatePresence(userId, false);
    };
  }, [userId]);

  // Realtime subscription for unread badge
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadTotal(userId);

    const supabase = createClient();
    const channel = supabase
      .channel(`messages-badge-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
        },
        () => {
          fetchUnreadTotal(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!userId) return null;

  const isActive = pathname === '/messages' || pathname.startsWith('/messages/');

  return (
    <Link
      href="/messages"
      className={`relative p-2 rounded-full transition-all duration-200 ${
        isActive
          ? 'bg-accent-green/15 text-accent-green dark:bg-accent-green/25'
          : 'hover:bg-black/5 dark:hover:bg-white/10 text-text-primary'
      }`}
      aria-label="Direct Messages"
      title="Direct Messages"
    >
      <MessageSquare size={18} className="transition-transform group-hover:scale-105" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-accent-terracotta text-white font-mono text-[10px] font-bold flex items-center justify-center border border-surface shadow-sm animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
