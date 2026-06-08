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
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        boxShadow: '2px 2px 0px #2D2A26'
      }}
      className="bg-[#F4F0EB] border border-[#2D2A26] flex items-center gap-3 px-5 py-2"
    >
      <button
        {...micProps}
        className="w-10 h-10 border border-[#2D2A26] flex items-center justify-center"
        style={{ background: micEnabled ? 'transparent' : '#BC6C4F' }}
      >
        {micEnabled
          ? <Mic size={18} color="#2D2A26" />
          : <MicOff size={18} color="#F4F0EB" />
        }
      </button>

      <button
        {...camProps}
        className="w-10 h-10 border border-[#2D2A26] flex items-center justify-center"
        style={{ background: camEnabled ? 'transparent' : '#BC6C4F' }}
      >
        {camEnabled
          ? <Video size={18} color="#2D2A26" />
          : <VideoOff size={18} color="#F4F0EB" />
        }
      </button>

      <button
        onClick={() => router.push('/')}
        className="border border-[#2D2A26] flex items-center gap-2 px-3 h-10 text-sm"
        style={{ fontFamily: 'var(--font-geist)', fontSize: '12px' }}
      >
        <LogOut size={14} />
        Leave
      </button>
    </div>
  )
}
