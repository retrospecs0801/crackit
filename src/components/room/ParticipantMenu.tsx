'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { RelationshipStatus } from '@/types';
import {
  getRelationshipStatus,
  sendRequest,
  blockUser,
  unblockUser,
} from '@/lib/supabase/friends';
import {
  UserPlus,
  Check,
  Clock,
  ShieldAlert,
  LogOut,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';

interface ParticipantMenuProps {
  currentUserId: string | null;
  targetUserId: string;
  targetDisplayName: string;
  targetAvatarUrl?: string | null;
  targetAvatarColor?: string;
  roomName?: string;
  isRoomOwner: boolean;
  onClose: () => void;
  onRemoved?: () => void;
}

export function ParticipantMenu({
  currentUserId,
  targetUserId,
  targetDisplayName,
  targetAvatarUrl,
  targetAvatarColor,
  roomName,
  isRoomOwner,
  onClose,
  onRemoved,
}: ParticipantMenuProps) {
  const router = useRouter();
  const [status, setStatus] = useState<RelationshipStatus>('none');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      if (!currentUserId || !targetUserId) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const s = await getRelationshipStatus(currentUserId, targetUserId);
        if (isMounted) setStatus(s);
      } catch (err) {
        console.error('Error fetching relationship status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [currentUserId, targetUserId]);

  const handleSendRequest = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      const res = await sendRequest(currentUserId, targetUserId);
      if (res.success) {
        setStatus('pending_sent');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      if (status === 'blocked') {
        const ok = await unblockUser(currentUserId, targetUserId);
        if (ok) setStatus('none');
      } else {
        const ok = await blockUser(currentUserId, targetUserId);
        if (ok) setStatus('blocked');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromRoom = async () => {
    if (!roomName || !currentUserId) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/room/remove-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          identity: targetUserId,
          ownerId: currentUserId,
        }),
      });
      if (res.ok) {
        onRemoved?.();
        onClose();
      }
    } catch (err) {
      console.error('Error removing participant:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="z-50 w-64 rounded-xl p-4 border border-border-default bg-surface-raised shadow-2xl flex flex-col gap-3 text-text-primary font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-default">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Avatar
            name={targetDisplayName}
            avatarUrl={targetAvatarUrl}
            avatarColor={targetAvatarColor}
            sizeClassName="w-9 h-9 text-xs"
          />
          <div className="flex flex-col truncate">
            <span className="font-semibold text-sm text-text-primary truncate">
              {targetDisplayName}
            </span>
            <span className="font-mono text-[10px] text-text-secondary">
              ID: {targetUserId.substring(0, 8)}...
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary p-1 rounded transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Actions list */}
      <div className="flex flex-col gap-1.5">
        {/* View Profile */}
        <button
          onClick={() => {
            onClose();
            window.open(`/profile/${targetUserId}`, '_blank', 'noopener,noreferrer');
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <span>View Profile</span>
          <ExternalLink size={13} className="text-text-secondary" />
        </button>

        {/* Friend Request Section */}
        {loading ? (
          <div className="flex items-center justify-center py-2 text-text-secondary">
            <Loader2 size={14} className="animate-spin" />
          </div>
        ) : (
          <>
            {status === 'none' && currentUserId && (
              <button
                onClick={handleSendRequest}
                disabled={actionLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-surface-raised bg-accent-green hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <UserPlus size={14} />
                <span>Send Friend Request</span>
              </button>
            )}

            {status === 'pending_sent' && (
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary bg-surface border border-border-default">
                <Clock size={14} className="text-text-muted" />
                <span>Request Pending</span>
              </div>
            )}

            {status === 'friends' && (
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-accent-green bg-accent-green/10 border border-accent-green">
                <Check size={14} />
                <span>Friends</span>
              </div>
            )}

            {/* Block / Unblock */}
            {currentUserId && (
              <button
                onClick={handleBlockToggle}
                disabled={actionLoading}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  status === 'blocked'
                    ? 'text-accent-terracotta bg-accent-terracotta/10 hover:bg-accent-terracotta/20'
                    : 'text-text-secondary hover:text-accent-terracotta hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <ShieldAlert size={14} />
                <span>{status === 'blocked' ? 'Unblock User' : 'Block'}</span>
              </button>
            )}
          </>
        )}

        {/* Owner Remove option */}
        {isRoomOwner && currentUserId && currentUserId !== targetUserId && (
          <button
            onClick={handleRemoveFromRoom}
            disabled={actionLoading}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-accent-terracotta hover:bg-accent-terracotta/10 transition-colors border border-transparent hover:border-accent-terracotta mt-1"
          >
            <LogOut size={14} />
            <span>Remove from room</span>
          </button>
        )}
      </div>
    </div>
  );
}
