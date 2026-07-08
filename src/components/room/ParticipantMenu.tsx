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
      className="z-50 w-64 rounded-xl p-4 border shadow-xl flex flex-col gap-3 text-white font-sans"
      style={{
        backgroundColor: '#1C1C1F',
        borderColor: '#2D2D30',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2D2D30]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Avatar
            name={targetDisplayName}
            avatarUrl={targetAvatarUrl}
            avatarColor={targetAvatarColor}
            sizeClassName="w-9 h-9 text-xs"
          />
          <div className="flex flex-col truncate">
            <span className="font-semibold text-sm text-[#F3F4F6] truncate">
              {targetDisplayName}
            </span>
            <span className="font-mono text-[10px] text-[#9CA3AF]">
              ID: {targetUserId.substring(0, 8)}...
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#9CA3AF] hover:text-white p-1 rounded transition-colors"
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
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#E5E7EB] hover:bg-[#27272A] transition-colors"
        >
          <span>View Profile</span>
          <ExternalLink size={13} className="text-[#9CA3AF]" />
        </button>

        {/* Friend Request Section */}
        {loading ? (
          <div className="flex items-center justify-center py-2 text-[#9CA3AF]">
            <Loader2 size={14} className="animate-spin" />
          </div>
        ) : (
          <>
            {status === 'none' && currentUserId && (
              <button
                onClick={handleSendRequest}
                disabled={actionLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#5C7A5A] hover:bg-[#4E684C] transition-colors disabled:opacity-50"
              >
                <UserPlus size={14} />
                <span>Send Friend Request</span>
              </button>
            )}

            {status === 'pending_sent' && (
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#9CA3AF] bg-[#27272A] border border-[#333333]">
                <Clock size={14} className="text-[#A8A29E]" />
                <span>Request Pending</span>
              </div>
            )}

            {status === 'friends' && (
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#86EFAC] bg-[#163821] border border-[#225433]">
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
                    ? 'text-[#FCA5A5] bg-[#3B1D1D] hover:bg-[#4D2424]'
                    : 'text-[#9CA3AF] hover:text-[#F87171] hover:bg-[#27272A]'
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
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#F87171] hover:bg-[#3B1D1D] transition-colors border border-transparent hover:border-[#7F1D1D] mt-1"
          >
            <LogOut size={14} />
            <span>Remove from room</span>
          </button>
        )}
      </div>
    </div>
  );
}
