'use client';

import React, { useState, useEffect } from 'react';
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
  Crown,
  UserMinus,
  ArrowRightLeft,
} from 'lucide-react';
import { useDataChannel, useParticipants } from '@livekit/components-react';
import { RoomRoleState } from '@/types';

interface ParticipantMenuProps {
  currentUserId: string | null;
  currentUserDisplayName?: string | null;
  targetUserId: string;
  targetDisplayName: string;
  targetAvatarUrl?: string | null;
  targetAvatarColor?: string;
  roomName?: string;
  isRoomOwner: boolean;
  isCoOwner?: boolean;
  roomRoles?: RoomRoleState;
  onUpdateRoles?: (updater: (prev: RoomRoleState) => RoomRoleState) => void;
  onClose: () => void;
  onRemoved?: () => void;
}

export function ParticipantMenu({
  currentUserId,
  currentUserDisplayName,
  targetUserId,
  targetDisplayName,
  targetAvatarUrl,
  targetAvatarColor,
  roomName,
  isRoomOwner,
  isCoOwner,
  roomRoles,
  onUpdateRoles,
  onClose,
  onRemoved,
}: ParticipantMenuProps) {
  const [status, setStatus] = useState<RelationshipStatus>('none');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDemote, setConfirmDemote] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  const { send } = useDataChannel('room-roles');
  const participants = useParticipants();
  const localParticipant = participants.find(p => p.isLocal);

  let localDisplayName = currentUserDisplayName || null;
  if (!localDisplayName && localParticipant) {
    localDisplayName = localParticipant.name || localParticipant.identity;
    try {
      if (localParticipant.metadata) {
        const m = JSON.parse(localParticipant.metadata);
        if (m.displayName) localDisplayName = m.displayName;
      }
    } catch {}
  }

  const viewerIsOwner = Boolean(isRoomOwner || (roomRoles && localDisplayName && roomRoles.owner === localDisplayName));
  const viewerIsCoOwner = Boolean(isCoOwner || (roomRoles && localDisplayName && roomRoles.coOwners.includes(localDisplayName)));
  const targetIsOwner = Boolean(roomRoles && roomRoles.owner && targetDisplayName === roomRoles.owner);
  const targetIsCoOwner = Boolean(roomRoles && roomRoles.coOwners && roomRoles.coOwners.includes(targetDisplayName));
  const isViewingSelf = Boolean((currentUserId && currentUserId === targetUserId) || (localDisplayName && localDisplayName === targetDisplayName) || (localParticipant && localParticipant.identity === targetUserId));

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

  const handlePromoteToCoOwner = async () => {
    if (!roomName) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/rooms/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomName,
          action: 'promote',
          targetUserId,
          targetDisplayName,
        }),
      });
      if (res.ok) {
        onUpdateRoles?.(prev => ({
          ...prev,
          coOwners: prev.coOwners.includes(targetDisplayName) ? prev.coOwners : [...prev.coOwners, targetDisplayName]
        }));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to promote to co-owner');
      }
    } catch (e) {
      console.error('Failed to promote co-owner:', e);
    } finally {
      setActionLoading(false);
      onClose();
    }
  };

  const handleDemoteCoOwner = async () => {
    if (!roomName) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/rooms/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomName,
          action: 'demote',
          targetUserId,
          targetDisplayName,
        }),
      });
      if (res.ok) {
        onUpdateRoles?.(prev => ({
          ...prev,
          coOwners: prev.coOwners.filter(n => n !== targetDisplayName)
        }));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to remove co-owner role');
      }
    } catch (e) {
      console.error('Failed to demote co-owner:', e);
    } finally {
      setActionLoading(false);
      onClose();
    }
  };

  const handleTransferOwnership = async () => {
    if (!roomName) return;
    const currentOwner = roomRoles?.owner || localDisplayName;
    if (!currentOwner) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/rooms/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomName,
          action: 'transfer',
          targetUserId,
          targetDisplayName,
        }),
      });
      if (res.ok) {
        onUpdateRoles?.(prev => {
          const filtered = prev.coOwners.filter(n => n !== targetDisplayName);
          const nextCoOwners = currentOwner !== targetDisplayName && !filtered.includes(currentOwner)
            ? [...filtered, currentOwner]
            : filtered;
          return {
            owner: targetDisplayName,
            coOwners: nextCoOwners,
          };
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to transfer room ownership');
      }
    } catch (e) {
      console.error('Failed to transfer ownership:', e);
    } finally {
      setActionLoading(false);
      onClose();
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

        {/* Role & Room Management Options (Owner / Co-Owner) */}
        {!isViewingSelf && !confirmTransfer && !confirmDemote && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-border-default mt-1">
            {/* Owner viewing regular participant: Make Co-Owner, Transfer Room, Kick */}
            {viewerIsOwner && !targetIsOwner && !targetIsCoOwner && (
              <>
                <button
                  onClick={handlePromoteToCoOwner}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-accent-green hover:bg-accent-green/10 transition-colors"
                >
                  <Crown size={14} />
                  <span>Make Co-Owner</span>
                </button>
                <button
                  onClick={() => setConfirmTransfer(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowRightLeft size={14} />
                  <span>Transfer Room</span>
                </button>
                {currentUserId && (
                  <button
                    onClick={handleRemoveFromRoom}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-accent-terracotta hover:bg-accent-terracotta/10 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Remove from room</span>
                  </button>
                )}
              </>
            )}

            {/* Owner viewing co-owner: Remove Co-Owner, Transfer Room (NO Kick) */}
            {viewerIsOwner && targetIsCoOwner && (
              <>
                <button
                  onClick={() => setConfirmDemote(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-accent-terracotta hover:bg-accent-terracotta/10 transition-colors"
                >
                  <UserMinus size={14} />
                  <span>Remove Co-Owner</span>
                </button>
                <button
                  onClick={() => setConfirmTransfer(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowRightLeft size={14} />
                  <span>Transfer Room</span>
                </button>
              </>
            )}

            {/* Co-owner viewing regular participant: Kick ONLY */}
            {viewerIsCoOwner && !viewerIsOwner && !targetIsOwner && !targetIsCoOwner && currentUserId && (
              <button
                onClick={handleRemoveFromRoom}
                disabled={actionLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-accent-terracotta hover:bg-accent-terracotta/10 transition-colors"
              >
                <LogOut size={14} />
                <span>Remove from room</span>
              </button>
            )}
          </div>
        )}

        {/* Demote confirmation dialog (#5) */}
        {confirmDemote && (
          <div className="w-full p-2.5 rounded-lg bg-surface border border-accent-terracotta/40 flex flex-col gap-2 mt-1">
            <span className="text-xs font-semibold text-text-primary">Are you sure you want to remove co-owner?</span>
            <div className="flex gap-2">
              <button
                onClick={handleDemoteCoOwner}
                className="flex-1 py-1.5 rounded bg-accent-terracotta text-surface-raised text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Yes, Demote
              </button>
              <button
                onClick={() => setConfirmDemote(false)}
                className="flex-1 py-1.5 rounded bg-surface-raised border border-border-default text-text-secondary text-xs font-medium hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Transfer confirmation dialog (#5) */}
        {confirmTransfer && (
          <div className="w-full p-3 rounded-lg bg-surface border border-accent-terracotta flex flex-col gap-2.5 mt-1">
            <div className="flex items-start gap-2 text-accent-terracotta">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span className="text-xs font-semibold">Confirm transferring ownership to {targetDisplayName}?</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              You will become a co-owner after transferring ownership.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleTransferOwnership}
                className="flex-1 py-1.5 rounded bg-accent-terracotta text-surface-raised text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmTransfer(false)}
                className="flex-1 py-1.5 rounded bg-surface-raised border border-border-default text-text-secondary text-xs font-medium hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
