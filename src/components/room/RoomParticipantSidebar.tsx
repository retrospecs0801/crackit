'use client';

import React, { useState } from 'react';
import { useParticipants } from '@livekit/components-react';
import { Avatar } from '@/components/ui/Avatar';
import { LayoutGrid, EyeOff, Users, Crown, ShieldCheck } from 'lucide-react';
import { ParticipantMenu } from '@/components/room/ParticipantMenu';
import { RoomRoleState } from '@/types';

interface RoomParticipantSidebarProps {
  showVideoGrid: boolean;
  onToggleVideoGrid: () => void;
  ownerId?: string | null;
  currentUserId?: string | null;
  roomName?: string;
  isRoomOwner?: boolean;
  isCoOwner?: boolean;
  canControlRoom?: boolean;
  roomRoles?: RoomRoleState;
  onUpdateRoles?: (updater: (prev: RoomRoleState) => RoomRoleState) => void;
  onTransferOwnership?: (newOwnerId: string, newOwnerName: string) => void;
}

export function RoomParticipantSidebar({
  showVideoGrid,
  onToggleVideoGrid,
  ownerId = null,
  currentUserId = null,
  roomName = '',
  isRoomOwner = false,
  isCoOwner = false,
  canControlRoom = false,
  roomRoles,
  onUpdateRoles,
  onTransferOwnership,
}: RoomParticipantSidebarProps) {
  const participants = useParticipants();
  const [selectedParticipant, setSelectedParticipant] = useState<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string | undefined;
    avatarInitials: string | undefined;
  } | null>(null);

  // Parse participant data helper
  const getParticipantData = (p: typeof participants[0]) => {
    const identity = p.identity;
    let displayName = p.name || identity;
    let avatarUrl: string | null = null;
    let avatarColor: string | undefined = undefined;
    let avatarInitials: string | undefined = undefined;
    let parsedUserId: string | null = null;

    try {
      if (p.metadata) {
        const parsed = JSON.parse(p.metadata);
        if (parsed.displayName) displayName = parsed.displayName;
        if (parsed.avatarUrl) avatarUrl = parsed.avatarUrl;
        if (parsed.avatarColor) avatarColor = parsed.avatarColor;
        if (parsed.avatarInitials) avatarInitials = parsed.avatarInitials;
        if (parsed.userId) parsedUserId = parsed.userId;
      }
    } catch { }

    const isParticipantOwner = Boolean((roomRoles?.owner && (displayName === roomRoles.owner || identity === roomRoles.owner)) || identity === ownerId || (parsedUserId !== null && parsedUserId === ownerId));
    const isParticipantCoOwner = Boolean(!isParticipantOwner && roomRoles && Array.isArray(roomRoles.coOwners) && (roomRoles.coOwners.includes(displayName) || roomRoles.coOwners.includes(identity) || (parsedUserId !== null && roomRoles.coOwners.includes(parsedUserId))));

    return { identity, displayName, avatarUrl, avatarColor, avatarInitials, parsedUserId, isParticipantOwner, isParticipantCoOwner };
  };

  const renderAvatarButton = (p: typeof participants[0], sizeClass: string) => {
    const { identity, displayName, avatarUrl, avatarColor, avatarInitials, isParticipantOwner, isParticipantCoOwner } = getParticipantData(p);
    const isSelected = selectedParticipant?.id === identity;

    return (
      <button
        key={identity}
        onClick={() => {
          if (isSelected) {
            setSelectedParticipant(null);
          } else {
            setSelectedParticipant({ id: identity, displayName, avatarUrl, avatarColor, avatarInitials });
          }
        }}
        className={`group relative rounded-full p-0.5 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none shrink-0 ${isParticipantOwner
            ? 'border-2 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.6)]'
            : isParticipantCoOwner
              ? 'border-2 border-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.6)]'
              : isSelected
                ? 'border-2 border-accent-green'
                : 'border border-border-default hover:border-accent-green'
          }`}
      >
        <Avatar
          name={displayName}
          avatarUrl={avatarUrl}
          avatarColor={avatarColor}
          avatarInitials={avatarInitials}
          sizeClassName={sizeClass}
        />

        {/* Crown badge for room owner */}
        {isParticipantOwner && (
          <span
            className="absolute -top-1.5 -right-1.5 bg-[#F59E0B] text-black rounded-full w-4 h-4 flex items-center justify-center shadow-md z-10"
            title="Room Owner"
          >
            <Crown size={10} strokeWidth={2.5} />
          </span>
        )}

        {/* Shield badge for co-owner */}
        {isParticipantCoOwner && (
          <span
            className="absolute -top-1.5 -right-1.5 bg-[#3B82F6] text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md z-10"
            title="Co-Owner"
          >
            <ShieldCheck size={10} strokeWidth={2.5} />
          </span>
        )}

        {/* Speaking / Live indicator dot */}
        {p.isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-surface animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* ===== DESKTOP: Original vertical sidebar — completely unchanged ===== */}
      <aside className="hidden md:flex w-16 min-w-[64px] bg-surface border-r border-border-default flex-col items-center justify-between py-4 z-20 select-none relative">
        {/* Top Section: Participants avatars */}
        <div className="flex flex-col items-center gap-4 w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-2">
          <div className="text-text-secondary flex flex-col items-center gap-0.5" title="Joined Study Partners">
            <Users size={14} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Seats</span>
          </div>

          <div className="w-full flex flex-col items-center gap-3">
            {participants.map((p) => {
              const { identity, displayName, avatarUrl, avatarColor, avatarInitials, isParticipantOwner, isParticipantCoOwner } = getParticipantData(p);
              const isSelected = selectedParticipant?.id === identity;

              return (
                <button
                  key={identity}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedParticipant(null);
                    } else {
                      setSelectedParticipant({ id: identity, displayName, avatarUrl, avatarColor, avatarInitials });
                    }
                  }}
                  className={`group relative rounded-full p-0.5 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none ${isParticipantOwner
                      ? 'border-2 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : isParticipantCoOwner
                        ? 'border-2 border-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                        : isSelected
                          ? 'border-2 border-accent-green'
                          : 'border border-border-default hover:border-accent-green'
                    }`}
                >
                  <Avatar
                    name={displayName}
                    avatarUrl={avatarUrl}
                    avatarColor={avatarColor}
                    avatarInitials={avatarInitials}
                    sizeClassName="w-9 h-9 text-xs"
                  />

                  {/* Crown badge for room owner */}
                  {isParticipantOwner && (
                    <span
                      className="absolute -top-1.5 -right-1.5 bg-[#F59E0B] text-black rounded-full w-4 h-4 flex items-center justify-center shadow-md z-10"
                      title="Room Owner"
                    >
                      <Crown size={10} strokeWidth={2.5} />
                    </span>
                  )}

                  {/* Shield badge for co-owner */}
                  {isParticipantCoOwner && (
                    <span
                      className="absolute -top-1.5 -right-1.5 bg-[#3B82F6] text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md z-10"
                      title="Co-Owner"
                    >
                      <ShieldCheck size={10} strokeWidth={2.5} />
                    </span>
                  )}

                  {/* Speaking / Live indicator dot */}
                  {p.isSpeaking && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-surface animate-pulse" />
                  )}

                  {/* Tooltip on hover */}
                  <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md bg-surface-raised border border-border-default text-text-primary text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl flex items-center gap-1.5">
                    {isParticipantOwner && <span className="text-[#F59E0B] font-bold flex items-center gap-1"><Crown size={12} /> Owner:</span>}
                    {isParticipantCoOwner && <span className="text-[#3B82F6] font-bold flex items-center gap-1"><ShieldCheck size={12} /> Co-Owner:</span>}
                    <span>{displayName}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline ParticipantMenu Options Card */}
        {selectedParticipant && (
          <div className="absolute left-16 top-16 ml-3 z-50">
            <ParticipantMenu
              currentUserId={currentUserId}
              targetUserId={selectedParticipant.id}
              targetDisplayName={selectedParticipant.displayName}
              targetAvatarUrl={selectedParticipant.avatarUrl}
              targetAvatarColor={selectedParticipant.avatarColor}
              roomName={roomName}
              isRoomOwner={isRoomOwner}
              isCoOwner={isCoOwner}
              roomRoles={roomRoles}
              onUpdateRoles={onUpdateRoles}
              onTransferOwnership={onTransferOwnership}
              onClose={() => setSelectedParticipant(null)}
              onRemoved={() => setSelectedParticipant(null)}
            />
          </div>
        )}

        {/* Bottom Section: Divider + Grid Toggle Button */}
        <div className="flex flex-col items-center gap-3 pt-3 border-t border-border-default w-full">
          <button
            onClick={onToggleVideoGrid}
            title={showVideoGrid ? 'Hide Video Grid (Ambient Mode)' : 'Show Video Grid'}
            className={`group relative p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${showVideoGrid
                ? 'bg-accent-green/20 border-accent-green text-accent-green hover:bg-accent-green/30 hover:text-text-primary'
                : 'bg-surface-raised border-border-default text-text-secondary hover:border-text-primary hover:text-text-primary'
              }`}
          >
            {showVideoGrid ? <LayoutGrid size={18} /> : <EyeOff size={18} />}

            <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md bg-surface-raised border border-border-default text-text-primary text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
              {showVideoGrid ? 'Hide Video Screen' : 'Show Video Cards'}
            </span>
          </button>
        </div>
      </aside>

      {/* ===== MOBILE: Horizontal participant strip ===== */}
      <div className="flex md:hidden items-center gap-2 px-2 py-1.5 bg-surface border-t border-border-default overflow-x-auto no-scrollbar relative shrink-0">
        <div className="text-text-secondary flex items-center gap-1 shrink-0 pr-1 border-r border-border-default mr-1" title="Joined Study Partners">
          <Users size={12} />
          <span className="font-mono text-[8px] uppercase tracking-wider">{participants.length}</span>
        </div>

        {participants.map((p) => renderAvatarButton(p, "w-8 h-8 text-[10px]"))}

        <button
          onClick={onToggleVideoGrid}
          title={showVideoGrid ? 'Hide Video Grid' : 'Show Video Grid'}
          className={`shrink-0 p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center ml-auto ${showVideoGrid
              ? 'bg-accent-green/20 border-accent-green text-accent-green'
              : 'bg-surface-raised border-border-default text-text-secondary'
            }`}
        >
          {showVideoGrid ? <LayoutGrid size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Mobile ParticipantMenu — centered overlay */}
      {selectedParticipant && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSelectedParticipant(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4">
            <ParticipantMenu
              currentUserId={currentUserId}
              targetUserId={selectedParticipant.id}
              targetDisplayName={selectedParticipant.displayName}
              targetAvatarUrl={selectedParticipant.avatarUrl}
              targetAvatarColor={selectedParticipant.avatarColor}
              roomName={roomName}
              isRoomOwner={isRoomOwner}
              isCoOwner={isCoOwner}
              roomRoles={roomRoles}
              onUpdateRoles={onUpdateRoles}
              onTransferOwnership={onTransferOwnership}
              onClose={() => setSelectedParticipant(null)}
              onRemoved={() => setSelectedParticipant(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
