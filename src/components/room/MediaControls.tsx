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
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}
      className="bg-[#27272A] border border-[#3F3F46] rounded-[12px] flex items-center gap-3 px-5 py-2"
    >
      <button
        {...micProps}
        className={`w-10 h-10 border-none rounded-[8px] flex items-center justify-center transition-colors duration-150 ${micEnabled ? 'bg-[#3F3F46] hover:bg-[#52525B]' : 'bg-[#C1654A] hover:bg-[#B5563E]'}`}
      >
        {micEnabled
          ? <Mic size={18} color="#FAFAF8" />
          : <MicOff size={18} color="#FAFAF8" />
        }
      </button>

      <button
        {...camProps}
        className={`w-10 h-10 border-none rounded-[8px] flex items-center justify-center transition-colors duration-150 ${camEnabled ? 'bg-[#3F3F46] hover:bg-[#52525B]' : 'bg-[#C1654A] hover:bg-[#B5563E]'}`}
      >
        {camEnabled
          ? <Video size={18} color="#FAFAF8" />
          : <VideoOff size={18} color="#FAFAF8" />
        }
      </button>

      <button
        onClick={() => router.push('/')}
        className="bg-transparent border border-[#3F3F46] rounded-[8px] flex items-center gap-2 px-3 h-10 font-sans font-semibold text-[12px] text-[#71717A] hover:bg-[#C1654A] hover:border-[#C1654A] hover:text-[#FAFAF8] transition-colors duration-150"
      >
        <LogOut size={14} />
        Leave
      </button>
    </div>
  )
}
