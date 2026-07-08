'use client';

import React from 'react';
import { useParticipants } from '@livekit/components-react';
import { Avatar } from '@/components/ui/Avatar';
import { LayoutGrid, EyeOff, Users } from 'lucide-react';

interface RoomParticipantSidebarProps {
  showVideoGrid: boolean;
  onToggleVideoGrid: () => void;
}

export function RoomParticipantSidebar({
  showVideoGrid,
  onToggleVideoGrid,
}: RoomParticipantSidebarProps) {
  const participants = useParticipants();

  return (
    <aside className="w-16 min-w-[64px] bg-[#111113] border-r border-[#27272A] flex flex-col items-center justify-between py-4 z-20 select-none">
      {/* Top Section: Participants avatars */}
      <div className="flex flex-col items-center gap-4 w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-2">
        <div className="text-[#71717A] flex flex-col items-center gap-0.5" title="Joined Study Partners">
          <Users size={14} />
          <span className="font-mono text-[9px] uppercase tracking-wider">Seats</span>
        </div>

        <div className="w-full flex flex-col items-center gap-2.5">
          {participants.map((p) => {
            const identity = p.identity;
            let displayName = p.name || identity;
            let avatarUrl: string | null = null;
            let avatarColor: string | undefined = undefined;
            let avatarInitials: string | undefined = undefined;

            try {
              if (p.metadata) {
                const parsed = JSON.parse(p.metadata);
                if (parsed.displayName) displayName = parsed.displayName;
                if (parsed.avatarUrl) avatarUrl = parsed.avatarUrl;
                if (parsed.avatarColor) avatarColor = parsed.avatarColor;
                if (parsed.avatarInitials) avatarInitials = parsed.avatarInitials;
              }
            } catch {}

            return (
              <button
                key={identity}
                onClick={() => {
                  window.open(`/profile/${identity}`, '_blank', 'noopener,noreferrer');
                }}
                className="group relative rounded-full p-0.5 border border-[#2D2D30] hover:border-[#7A8B76] transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
                title={`${displayName} (Click to open profile in new tab)`}
              >
                <Avatar
                  name={displayName}
                  avatarUrl={avatarUrl}
                  avatarColor={avatarColor}
                  avatarInitials={avatarInitials}
                  sizeClassName="w-9 h-9 text-xs"
                />

                {/* Speaking / Live indicator dot */}
                {p.isSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#5C7A5A] border-2 border-[#111113] animate-pulse" />
                )}

                {/* Tooltip on hover */}
                <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md bg-[#1C1C1F] border border-[#2D2D30] text-[#FAFAF8] text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                  {displayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Divider + Grid Toggle Button */}
      <div className="flex flex-col items-center gap-3 pt-3 border-t border-[#27272A] w-full">
        <button
          onClick={onToggleVideoGrid}
          title={showVideoGrid ? 'Hide Video Grid (Ambient Mode)' : 'Show Video Grid'}
          className={`group relative p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
            showVideoGrid
              ? 'bg-[#5C7A5A]/20 border-[#5C7A5A] text-[#A3B899] hover:bg-[#5C7A5A]/30 hover:text-white'
              : 'bg-[#1C1C1F] border-[#2D2D30] text-[#71717A] hover:border-[#3F3F46] hover:text-[#FAFAF8]'
          }`}
        >
          {showVideoGrid ? <LayoutGrid size={18} /> : <EyeOff size={18} />}

          <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md bg-[#1C1C1F] border border-[#2D2D30] text-[#FAFAF8] text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            {showVideoGrid ? 'Hide Video Screen' : 'Show Video Cards'}
          </span>
        </button>
      </div>
    </aside>
  );
}
