import React, { useState } from 'react';
import {
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  useMaybeTrackRefContext,
  useMaybeParticipantContext,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ParticipantMenu } from '@/components/room/ParticipantMenu';
import { Avatar } from '@/components/ui/Avatar';

interface VideoGridProps {
  currentUserId?: string | null;
  roomName?: string;
  isRoomOwner?: boolean;
}

function InteractiveParticipantTile({
  currentUserId,
  roomName,
  isRoomOwner,
}: {
  currentUserId: string | null;
  roomName?: string;
  isRoomOwner: boolean;
}) {
  const trackRef = useMaybeTrackRefContext();
  const pContext = useMaybeParticipantContext();
  const participant = trackRef?.participant ?? pContext;

  const [showMenu, setShowMenu] = useState(false);

  if (!participant) {
    return <ParticipantTile />;
  }

  const identity = participant.identity;
  let displayName = participant.name || identity;
  let avatarUrl: string | null = null;
  let avatarColor: string | undefined = undefined;
  let avatarInitials: string | undefined = undefined;

  try {
    if (participant.metadata) {
      const parsed = JSON.parse(participant.metadata);
      if (parsed.displayName) displayName = parsed.displayName;
      if (parsed.avatarUrl) avatarUrl = parsed.avatarUrl;
      if (parsed.avatarColor) avatarColor = parsed.avatarColor;
      if (parsed.avatarInitials) avatarInitials = parsed.avatarInitials;
    }
  } catch {}

  const isCameraOff = !participant.isCameraEnabled;

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-[#27272A] bg-[#141416] shadow-sm transition-all"
      onClick={() => {
        if (!participant.isLocal) {
          setShowMenu(!showMenu);
        }
      }}
    >
      <ParticipantTile />

      {/* If camera is off, display elegant profile picture card */}
      {isCameraOff && (
        <div className="absolute inset-0 z-10 bg-[#141416] border border-[#27272A] rounded-xl flex flex-col items-center justify-center gap-3 p-4 select-none">
          <div className="relative">
            <Avatar
              name={displayName}
              avatarUrl={avatarUrl}
              avatarColor={avatarColor}
              avatarInitials={avatarInitials}
              sizeClassName="w-20 h-20 text-2xl shadow-xl border-2 border-[#2D2D30]"
            />
            {participant.isSpeaking && (
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#5C7A5A] border-2 border-[#141416] animate-pulse" />
            )}
          </div>
          <div className="flex flex-col items-center">
            <span className="font-sans text-sm font-semibold text-[#F3F4F6]">
              {displayName}
            </span>
            <span className="font-mono text-[10px] text-[#71717A]">
              Camera Off
            </span>
          </div>
        </div>
      )}

      {showMenu && !participant.isLocal && (
        <div
          className="absolute z-50 top-3 left-3"
          onClick={(e) => e.stopPropagation()}
        >
          <ParticipantMenu
            currentUserId={currentUserId}
            targetUserId={identity}
            targetDisplayName={displayName}
            roomName={roomName}
            isRoomOwner={isRoomOwner}
            onClose={() => setShowMenu(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function VideoGrid({
  currentUserId = null,
  roomName,
  isRoomOwner = false,
}: VideoGridProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <RoomAudioRenderer />
      <GridLayout tracks={tracks} style={{ height: '100%' }}>
        <InteractiveParticipantTile
          currentUserId={currentUserId}
          roomName={roomName}
          isRoomOwner={isRoomOwner}
        />
      </GridLayout>
    </div>
  );
}
