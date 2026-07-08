'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FriendRequestWithProfile } from '@/types';
import {
  getPendingRequests,
  acceptRequest,
  declineRequest,
} from '@/lib/supabase/friends';
import { Avatar } from '@/components/ui/Avatar';
import { Bell, Check, X, UserCheck } from 'lucide-react';

interface NotificationsBellProps {
  userId?: string | null;
}

export function NotificationsBell({ userId }: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<FriendRequestWithProfile[]>([]);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchRequests = async (uid: string) => {
    try {
      const data = await getPendingRequests(uid);
      setRequests(data);
    } catch (err) {
      console.error('Error fetching pending friend requests:', err);
    }
  };

  useEffect(() => {
    if (!userId) {
      setRequests([]);
      return;
    }

    fetchRequests(userId);

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-friendships-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${userId}`,
        },
        () => {
          fetchRequests(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!userId) return null;

  const handleAccept = async (reqId: string) => {
    setActionInProgress(reqId);
    try {
      const ok = await acceptRequest(reqId);
      if (ok) {
        setRequests((prev) => prev.filter((r) => r.id !== reqId));
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDecline = async (reqId: string) => {
    setActionInProgress(reqId);
    try {
      const ok = await declineRequest(reqId);
      if (ok) {
        setRequests((prev) => prev.filter((r) => r.id !== reqId));
      }
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text-primary"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {requests.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-accent-terracotta text-white font-mono text-[10px] font-bold flex items-center justify-center border border-surface">
            {requests.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl p-3 border shadow-xl flex flex-col gap-2 z-50 bg-card-bg border-border-default text-text-primary"
          style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            borderColor: 'var(--card-border, #E2DDD8)',
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <span className="font-serif font-bold text-sm text-text-primary">
              Notifications
            </span>
            <span className="font-mono text-[10px] text-text-secondary">
              {requests.length} pending
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center gap-1.5 text-text-secondary">
              <UserCheck size={22} className="text-text-muted" />
              <p className="font-sans text-xs">No pending friend requests</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {requests.map((r) => {
                const isLoading = actionInProgress === r.id;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-canvas border border-border-default gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar
                        name={r.requester.display_name}
                        avatarUrl={r.requester.avatar_url}
                        avatarInitials={r.requester.avatar_initials}
                        avatarColor={r.requester.avatar_color}
                        sizeClassName="w-8 h-8 text-xs shrink-0"
                      />
                      <div className="flex flex-col truncate">
                        <span className="font-sans text-xs font-semibold text-text-primary truncate">
                          {r.requester.display_name}
                        </span>
                        <span className="font-sans text-[10px] text-text-secondary">
                          sent a friend request
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleAccept(r.id)}
                        disabled={isLoading}
                        title="Accept"
                        className="p-1.5 rounded-md bg-accent-green text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => handleDecline(r.id)}
                        disabled={isLoading}
                        title="Decline"
                        className="p-1.5 rounded-md bg-border-strong/50 text-text-primary hover:bg-border-strong transition-colors disabled:opacity-50"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
