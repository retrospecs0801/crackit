import React, { useState, useEffect } from 'react';
import {
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  useMaybeTrackRefContext,
  useMaybeParticipantContext,
  VideoTrack,
  TrackRefContextIfNeeded,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Crown, ShieldCheck, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { ParticipantMenu } from '@/components/room/ParticipantMenu';
import { Avatar } from '@/components/ui/Avatar';
import { RoomRoleState } from '@/types';

interface VideoGridProps {
  currentUserId?: string | null;
  roomName?: string;
  isRoomOwner?: boolean;
  isCoOwner?: boolean;
  canControlRoom?: boolean;
  ownerId?: string | null;
  roomRoles?: RoomRoleState;
  onUpdateRoles?: (updater: (prev: RoomRoleState) => RoomRoleState) => void;
  onTransferOwnership?: (newOwnerId: string, newOwnerName: string) => void;
}

function InteractiveParticipantTile({
  currentUserId,
  roomName,
  isRoomOwner,
  isCoOwner,
  ownerId = null,
  roomRoles,
  onUpdateRoles,
  onTransferOwnership,
  isPinned,
  onPinToggle,
}: {
  currentUserId: string | null;
  roomName?: string;
  isRoomOwner: boolean;
  isCoOwner?: boolean;
  ownerId?: string | null;
  roomRoles?: RoomRoleState;
  onUpdateRoles?: (updater: (prev: RoomRoleState) => RoomRoleState) => void;
  onTransferOwnership?: (newOwnerId: string, newOwnerName: string) => void;
  isPinned?: boolean;
  onPinToggle?: (identity: string) => void;
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

  const isScreenShareTile = trackRef?.source === Track.Source.ScreenShare;
  // If this is a normal camera tile and camera is off, show the profile card.
  // If this is a screen share tile, DO NOT show the profile card even if camera is off, because screen share is visible.
  const isCameraOff = !participant.isCameraEnabled && !isScreenShareTile;
  const isTileOwner = Boolean((roomRoles?.owner && (displayName === roomRoles.owner || identity === roomRoles.owner)) || identity === ownerId || (parsedUserId !== null && parsedUserId === ownerId));
  const isTileCoOwner = Boolean(!isTileOwner && roomRoles && Array.isArray(roomRoles.coOwners) && (roomRoles.coOwners.includes(displayName) || roomRoles.coOwners.includes(identity) || (parsedUserId !== null && roomRoles.coOwners.includes(parsedUserId))));

  // Check if camera track exists for PiP when showing screen share
  const cameraPub = participant.getTrackPublication(Track.Source.Camera);
  const showPiPCamera = isScreenShareTile && participant.isCameraEnabled && cameraPub && cameraPub.track;

  return (
    <div
      className={`group relative w-full h-full rounded-xl overflow-hidden border bg-surface shadow-sm transition-all ${
        isTileOwner ? 'border-[#F59E0B]/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : isTileCoOwner ? 'border-[#3B82F6]/80 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'border-border-default'
      }`}
      onClick={() => {
        if (!participant.isLocal) {
          setShowMenu(!showMenu);
        }
      }}
    >
      <ParticipantTile />

      {/* Desktop Maximize/Pin Button */}
      {onPinToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPinToggle(participant.identity);
          }}
          className="hidden md:flex absolute top-3 left-3 z-40 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 backdrop-blur-sm"
          title={isPinned ? "Unpin Video" : "Pin Video"}
        >
          {isPinned ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      )}

      {/* Picture-in-Picture (PiP) Camera Feed when screen sharing */}
      {showPiPCamera && cameraPub && (
        <div 
          className="absolute bottom-3 right-3 z-30 w-48 max-md:w-20 aspect-video rounded-lg overflow-hidden border-2 border-surface shadow-2xl bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          <VideoTrack 
            trackRef={{ 
              participant, 
              source: Track.Source.Camera, 
              publication: cameraPub 
            }} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] max-md:text-[8px] text-white font-mono flex items-center gap-1 backdrop-blur-xs">
            <span>{displayName} (Cam)</span>
          </div>
        </div>
      )}

      {/* Screen Share badge */}
      {isScreenShareTile && (
        <div className="absolute top-2.5 left-2.5 max-md:top-1.5 max-md:left-1.5 z-20 px-2.5 max-md:px-1.5 py-0.5 rounded-full bg-accent-green text-white font-sans font-semibold text-[10px] max-md:text-[8px] flex items-center gap-1 shadow-md">
          <span>Screen Share • {displayName}</span>
        </div>
      )}

      {/* Room Owner badge for active video or tile header */}
      {isTileOwner && !isScreenShareTile && (
        <div className="absolute top-2.5 right-2.5 max-md:top-1 max-md:right-1 z-20 px-2.5 max-md:px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-black font-sans font-bold text-[10px] max-md:text-[8px] flex items-center gap-1 shadow-lg tracking-wide">
          <Crown size={11} strokeWidth={2.5} className="max-md:w-[9px] max-md:h-[9px]" />
          <span>Owner</span>
        </div>
      )}

      {/* Co-Owner badge for active video or tile header */}
      {isTileCoOwner && !isScreenShareTile && (
        <div className="absolute top-2.5 right-2.5 max-md:top-1 max-md:right-1 z-20 px-2.5 max-md:px-1.5 py-0.5 rounded-full bg-[#3B82F6] text-white font-sans font-bold text-[10px] max-md:text-[8px] flex items-center gap-1 shadow-lg tracking-wide">
          <ShieldCheck size={11} strokeWidth={2.5} className="max-md:w-[9px] max-md:h-[9px]" />
          <span>Co-Owner</span>
        </div>
      )}

      {/* If camera is off on a normal camera tile, display elegant profile picture card */}
      {isCameraOff && (
        <div className="absolute inset-0 z-10 bg-surface border border-border-default rounded-xl flex flex-col items-center justify-center gap-3 max-md:gap-1.5 p-4 max-md:p-2 select-none">
          <div className="relative">
            <Avatar
              name={displayName}
              avatarUrl={avatarUrl}
              avatarColor={avatarColor}
              avatarInitials={avatarInitials}
              sizeClassName={`w-20 h-20 max-md:w-12 max-md:h-12 text-2xl max-md:text-sm shadow-xl border-2 ${
                isTileOwner ? 'border-[#F59E0B] shadow-[0_0_16px_rgba(245,158,11,0.5)]' : isTileCoOwner ? 'border-[#3B82F6] shadow-[0_0_16px_rgba(59,130,246,0.5)]' : 'border-border-default'
              }`}
            />
            {participant.isSpeaking && (
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 max-md:w-3 max-md:h-3 rounded-full bg-accent-green border-2 border-surface animate-pulse" />
            )}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-sans text-sm max-md:text-[10px] font-semibold text-text-primary flex items-center gap-1.5">
              <span>{displayName}</span>
            </span>
            <span className="font-mono text-[10px] max-md:text-[8px] text-text-secondary">
              {isTileOwner ? 'Owner • Camera Off' : isTileCoOwner ? 'Co-Owner • Camera Off' : 'Camera Off'}
            </span>
          </div>
        </div>
      )}

      {showMenu && !participant.isLocal && (
        <div
          className="absolute z-50 top-3 right-3 md:top-3 md:right-3 md:left-auto"
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
            isCoOwner={isCoOwner}
            roomRoles={roomRoles}
            onUpdateRoles={onUpdateRoles}
            onTransferOwnership={onTransferOwnership}
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
  isCoOwner = false,
  ownerId = null,
  roomRoles,
  onUpdateRoles,
  onTransferOwnership,
}: VideoGridProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Group tracks by participant: if a participant has ScreenShare, show ONLY their ScreenShare track in the grid
  // (their Camera track will be rendered as PiP inside the ScreenShare tile via InteractiveParticipantTile).
  const screenShareIdentities = new Set(
    tracks
      .filter((t) => t.source === Track.Source.ScreenShare)
      .map((t) => t.participant.identity)
  );

  const combinedTracks = tracks.filter((t) => {
    if (t.source === Track.Source.Camera && screenShareIdentities.has(t.participant.identity)) {
      return false; // Exclude separate camera tile when screen sharing
    }
    return true;
  });

  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 767);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(combinedTracks.length / itemsPerPage);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const displayedTracks = isMobile 
    ? combinedTracks.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    : combinedTracks;

  if (pinnedIdentity && !isMobile) {
    const pinnedTrack = combinedTracks.find(t => t.participant.identity === pinnedIdentity);
    if (pinnedTrack) {
      return (
        <div className="w-full h-full relative p-4 bg-canvas/50">
          <RoomAudioRenderer />
          <TrackRefContextIfNeeded trackRef={pinnedTrack}>
            <InteractiveParticipantTile
              currentUserId={currentUserId}
              roomName={roomName}
              isRoomOwner={isRoomOwner}
              isCoOwner={isCoOwner}
              ownerId={ownerId}
              roomRoles={roomRoles}
              onUpdateRoles={onUpdateRoles}
              onTransferOwnership={onTransferOwnership}
              isPinned={true}
              onPinToggle={() => setPinnedIdentity(null)}
            />
          </TrackRefContextIfNeeded>
        </div>
      );
    }
  }

  return (
    <div className="w-full h-full relative flex flex-col">
      <RoomAudioRenderer />
      <div className="flex-1 min-h-0 relative">
        <GridLayout tracks={displayedTracks} style={{ height: '100%' }}>
        <InteractiveParticipantTile
          currentUserId={currentUserId}
          roomName={roomName}
          isRoomOwner={isRoomOwner}
          isCoOwner={isCoOwner}
          ownerId={ownerId}
          roomRoles={roomRoles}
          onUpdateRoles={onUpdateRoles}
          onTransferOwnership={onTransferOwnership}
          isPinned={false}
          onPinToggle={(identity) => setPinnedIdentity(identity)}
        />
      </GridLayout>
      </div>

      {/* Mobile Pagination Controls */}
      {isMobile && totalPages > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center z-40">
          <div className="bg-surface/90 backdrop-blur-md border border-border-default shadow-md rounded-full px-3 py-1.5 flex items-center gap-3 transition-all">
            <button 
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded-full text-text-secondary hover:bg-black/5 hover:text-text-primary disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-mono text-[13px] font-semibold text-text-primary min-w-[32px] text-center">
              {currentPage + 1}/{totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded-full text-text-secondary hover:bg-black/5 hover:text-text-primary disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
