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
  ownerId?: string | null;
}

function InteractiveParticipantTile({
  currentUserId,
  roomName,
  isRoomOwner,
  ownerId = null,
}: {
  currentUserId: string | null;
  roomName?: string;
  isRoomOwner: boolean;
  ownerId?: string | null;
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
  let parsedUserId: string | null = null;

  try {
    if (participant.metadata) {
      const parsed = JSON.parse(participant.metadata);
      if (parsed.displayName) displayName = parsed.displayName;
      if (parsed.avatarUrl) avatarUrl = parsed.avatarUrl;
      if (parsed.avatarColor) avatarColor = parsed.avatarColor;
      if (parsed.avatarInitials) avatarInitials = parsed.avatarInitials;
      if (parsed.userId) parsedUserId = parsed.userId;
    }
  } catch { }

  const isCameraOff = !participant.isCameraEnabled;
  const isTileOwner = identity === ownerId || (parsedUserId !== null && parsedUserId === ownerId);

  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden border bg-surface shadow-sm transition-all ${isTileOwner ? 'border-[#F59E0B]/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'border-border-default'
        }`}
      onClick={() => {
        if (!participant.isLocal) {
          setShowMenu(!showMenu);
        }
      }}
    >
      <ParticipantTile />

      {/* Room Owner badge for active video or tile header */}
      {isTileOwner && (
        <div className="absolute top-2.5 right-2.5 z-20 px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-black font-sans font-bold text-[10px] flex items-center gap-1 shadow-lg tracking-wide">
          <span> </span>
          <span>Room Owner</span>
        </div>
      )}

      {/* If camera is off, display elegant profile picture card */}
      {isCameraOff && (
        <div className="absolute inset-0 z-10 bg-surface border border-border-default rounded-xl flex flex-col items-center justify-center gap-3 p-4 select-none">
          <div className="relative">
            <Avatar
              name={displayName}
              avatarUrl={avatarUrl}
              avatarColor={avatarColor}
              avatarInitials={avatarInitials}
              sizeClassName={`w-20 h-20 text-2xl shadow-xl border-2 ${isTileOwner ? 'border-[#F59E0B] shadow-[0_0_16px_rgba(245,158,11,0.5)]' : 'border-border-default'
                }`}
            />
            {participant.isSpeaking && (
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-accent-green border-2 border-surface animate-pulse" />
            )}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-sans text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <span>{displayName}</span>
            </span>
            <span className="font-mono text-[10px] text-text-secondary">
              {isTileOwner ? '  Room Owner • Camera Off' : 'Camera Off'}
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
            targetAvatarUrl={avatarUrl}
            targetAvatarColor={avatarColor}
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
  ownerId = null,
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
          ownerId={ownerId}
        />
      </GridLayout>
    </div>
  );
}
