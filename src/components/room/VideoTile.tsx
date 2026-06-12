import { User } from '@/types';
import { MicOff, VideoOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDataChannel } from '@livekit/components-react';

interface VideoTileProps {
  user: User;
  seatNumber: number;
  isOwner: boolean;
  isMuted?: boolean;
  isCamOff?: boolean;
}

export function VideoTile({ user, seatNumber, isOwner, isMuted, isCamOff }: VideoTileProps) {
  // Mock cam-off state for some non-local users if not explicitly provided
  const displayCamOff = isCamOff ?? (seatNumber % 3 === 0);
  const displayMicOff = isMuted ?? true; // All others muted by default in this study room mock

  const [isPlayingYouTube, setIsPlayingYouTube] = useState(false);
  const { message } = useDataChannel('youtube-status');

  useEffect(() => {
    if (!message) return;
    try {
      const payload = JSON.parse(new TextDecoder().decode(message.payload));
      if (payload.type === 'PLAYING' && payload.userId === user.displayName) {
        setIsPlayingYouTube(true);
      }
    } catch(e) {}
  }, [message, user.displayName]);

  return (
    <div 
      data-seat={seatNumber}
      className="relative w-full bg-video-bg border border-ink aspect-video flex items-center justify-center overflow-hidden"
    >
      {/* Center Avatar */}
      {displayCamOff && (
        <div 
          className="w-[48px] h-[48px] rounded-full flex items-center justify-center font-mono text-[16px] text-white border border-ink"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.avatarInitials}
        </div>
      )}

      {/* Top Right Status Icons */}
      <div className="absolute top-2 right-2 flex gap-1">
        {displayMicOff && (
          <div className="bg-ink/75 p-1 rounded-none text-white">
            <MicOff size={12} strokeWidth={2.5} />
          </div>
        )}
        {displayCamOff && (
          <div className="bg-ink/75 p-1 rounded-none text-white">
            <VideoOff size={12} strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Bottom Nameplate */}
      <div className="absolute left-2 bottom-2 flex flex-col gap-1 items-start">
        <div className="bg-ink/75 text-white font-mono text-[11px] px-2 py-[3px] flex items-center gap-1.5 backdrop-blur-sm">
          {isOwner && (
            <span className="text-accent font-bold">HOST</span>
          )}
          <span>{user.displayName}</span>
        </div>
        
        {isPlayingYouTube && (
          <div 
            className="font-mono text-[10px]"
            style={{ backgroundColor: 'rgba(26,26,26,0.8)', color: '#7A8B76', borderRadius: '4px', padding: '2px 6px', fontFamily: '"JetBrains Mono", monospace' }}
          >
            ▶ YouTube
          </div>
        )}
      </div>
    </div>
  );
}
