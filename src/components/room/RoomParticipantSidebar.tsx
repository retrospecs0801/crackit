'use client';

import React, { useState } from 'react';
import { useParticipants } from '@livekit/components-react';
import { Avatar } from '@/components/ui/Avatar';
import { LayoutGrid, EyeOff, Users } from 'lucide-react';
import { ParticipantMenu } from '@/components/room/ParticipantMenu';

interface RoomParticipantSidebarProps {
  showVideoGrid: boolean;
  onToggleVideoGrid: () => void;
  ownerId?: string | null;
  currentUserId?: string | null;
  roomName?: string;
  isRoomOwner?: boolean;
}

export function RoomParticipantSidebar({
  showVideoGrid,
  onToggleVideoGrid,
  ownerId = null,
  currentUserId = null,
  roomName = '',
  isRoomOwner = false,
}: RoomParticipantSidebarProps) {
  const participants = useParticipants();
  const [selectedParticipant, setSelectedParticipant] = useState<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string | undefined;
    avatarInitials: string | undefined;
  } | null>(null);

  return (
    <aside className="w-16 min-w-[64px] bg-surface border-r border-border-default flex flex-col items-center justify-between py-4 z-20 select-none relative">
      {/* Top Section: Participants avatars */}
      <div className="flex flex-col items-center gap-4 w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-2">
        <div className="text-text-secondary flex flex-col items-center gap-0.5" title="Joined Study Partners">
          <Users size={14} />
          <span className="font-mono text-[9px] uppercase tracking-wider">Seats</span>
        </div>

        <div className="w-full flex flex-col items-center gap-3">
          {participants.map((p) => {
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

            const isParticipantOwner = identity === ownerId || (parsedUserId !== null && parsedUserId === ownerId);
            const isSelected = selectedParticipant?.id === identity;

            return (
              <button
                key={identity}
                onClick={() => {
                  if (isSelected) {
                    setSelectedParticipant(null);
                  } else {
                    setSelectedParticipant({
                      id: identity,
                      displayName,
                      avatarUrl,
                      avatarColor,
                      avatarInitials,
                    });
                  }
                }}
                className={`group relative rounded-full p-0.5 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none ${isParticipantOwner
                    ? 'border-2 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.6)]'
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
                    className="absolute -top-1.5 -right-1.5 bg-[#F59E0B] text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow-md z-10"
                    title="Room Owner"
                  >

                  </span>
                )}

                {/* Speaking / Live indicator dot */}
                {p.isSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-surface animate-pulse" />
                )}

                {/* Tooltip on hover */}
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md bg-surface-raised border border-border-default text-text-primary text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl flex items-center gap-1.5">
                  {isParticipantOwner && <span className="text-[#F59E0B] font-bold">  Room Owner:</span>}
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
  );
}
