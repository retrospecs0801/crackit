'use client';

import { useTrackToggle } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { useRouter } from 'next/navigation'
import { LogOut, Mic, MicOff, Video, VideoOff } from 'lucide-react'

export default function MediaControls() {
  const router = useRouter()
  const { buttonProps: micProps, enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone })
  const { buttonProps: camProps, enabled: camEnabled } = useTrackToggle({ source: Track.Source.Camera })

  return (
    <div
      style={{
        zIndex: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
      }}
      className="bg-surface-raised border border-border-default rounded-[12px] flex items-center gap-3 px-5 py-2 shadow-2xl"
    >
      <button
        {...micProps}
        className={`w-10 h-10 border-none rounded-[8px] flex items-center justify-center transition-colors duration-150 text-white ${micEnabled ? 'bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-text-primary' : 'bg-[#C1654A] hover:bg-[#B5563E] text-white'
          }`}
      >
        {micEnabled
          ? <Mic size={18} className="text-text-primary" />
          : <MicOff size={18} className="text-white" />
        }
      </button>

      <button
        {...camProps}
        className={`w-10 h-10 border-none rounded-[8px] flex items-center justify-center transition-colors duration-150 text-white ${camEnabled ? 'bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-text-primary' : 'bg-[#C1654A] hover:bg-[#B5563E] text-white'
          }`}
      >
        {camEnabled
          ? <Video size={18} className="text-text-primary" />
          : <VideoOff size={18} className="text-white" />
        }
      </button>

      <button
        onClick={() => router.push('/')}
        className="bg-transparent border border-border-default rounded-[8px] flex items-center gap-2 px-3 h-10 font-sans font-semibold text-[12px] text-text-secondary hover:bg-[#C1654A] hover:border-[#C1654A] hover:text-white transition-colors duration-150"
      >
        <LogOut size={14} />
        Leave
      </button>
    </div>
  )
}
