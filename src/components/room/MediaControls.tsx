'use client';

import { Mic, MicOff, Video, VideoOff, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MediaControlsProps {
  isMuted: boolean;
  isCamOff: boolean;
  onToggleMute: () => void;
  onToggleCam: () => void;
}

export function MediaControls({ isMuted, isCamOff, onToggleMute, onToggleCam }: MediaControlsProps) {
  const router = useRouter();

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-canvas border border-ink shadow-[2px_2px_0px_var(--color-ink)] px-5 py-2.5 flex items-center gap-3 z-50">
      
      <button
        onClick={onToggleMute}
        className={`w-10 h-10 flex items-center justify-center border border-ink transition-colors ${
          isMuted ? 'bg-accent text-white' : 'bg-transparent text-ink hover:bg-surface'
        }`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      <button
        onClick={onToggleCam}
        className={`w-10 h-10 flex items-center justify-center border border-ink transition-colors ${
          isCamOff ? 'bg-accent text-white' : 'bg-transparent text-ink hover:bg-surface'
        }`}
        title={isCamOff ? "Turn on camera" : "Turn off camera"}
      >
        {isCamOff ? <VideoOff size={18} /> : <Video size={18} />}
      </button>

      <div className="w-[1px] h-6 bg-ink/20 mx-1"></div>

      <button
        onClick={() => router.push('/')}
        className="h-10 flex items-center justify-center gap-2 px-4 border border-ink bg-transparent text-ink hover:bg-ink hover:text-white transition-colors font-sans text-[12px]"
      >
        <LogOut size={16} />
        <span>Leave</span>
      </button>

    </div>
  );
}
