'use client';

import { useEffect, useState } from 'react'
import { useTrackToggle } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { useRouter } from 'next/navigation'
import { Share, Check, Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface MediaControlsProps {
  micDisabled?: boolean;
  cameraDisabled?: boolean;
}

export default function MediaControls({
  micDisabled = false,
  cameraDisabled = false,
}: MediaControlsProps) {
  const router = useRouter()
  const { buttonProps: micProps, enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone })
  const { buttonProps: camProps, enabled: camEnabled } = useTrackToggle({ source: Track.Source.Camera })

  const [copied, setCopied] = useState(false)

  const handleInvite = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href
      const textToCopy = `join me on crackit to study together: ${url}`
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err)
        })
    }
  }

  // Auto-mute if host locks microphone
  useEffect(() => {
    if (micDisabled && micEnabled && micProps.onClick) {
      const mockEvent = { preventDefault: () => {} } as React.MouseEvent<HTMLButtonElement>;
      micProps.onClick(mockEvent);
    }
  }, [micDisabled, micEnabled, micProps]);

  // Auto-disable video if host locks camera
  useEffect(() => {
    if (cameraDisabled && camEnabled && camProps.onClick) {
      const mockEvent = { preventDefault: () => {} } as React.MouseEvent<HTMLButtonElement>;
      camProps.onClick(mockEvent);
    }
  }, [cameraDisabled, camEnabled, camProps]);

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
        disabled={micDisabled}
        title={micDisabled ? "Microphone is disabled by host" : "Toggle Mic"}
        className={`w-10 h-10 border-none rounded-[8px] flex items-center justify-center transition-colors duration-150 text-white disabled:opacity-40 disabled:cursor-not-allowed ${
          micEnabled && !micDisabled
            ? 'bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-text-primary' 
            : 'bg-[#C1654A] hover:bg-[#B5563E] text-white'
        }`}
      >
        {micEnabled && !micDisabled
          ? <Mic size={18} className="text-text-primary" />
          : <MicOff size={18} className="text-white" />
        }
      </button>

      <button
        {...camProps}
        disabled={cameraDisabled}
        title={cameraDisabled ? "Camera is disabled by host" : "Toggle Camera"}
        className={`w-10 h-10 border-none rounded-[8px] flex items-center justify-center transition-colors duration-150 text-white disabled:opacity-40 disabled:cursor-not-allowed ${
          camEnabled && !cameraDisabled
            ? 'bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-text-primary' 
            : 'bg-[#C1654A] hover:bg-[#B5563E] text-white'
        }`}
      >
        {camEnabled && !cameraDisabled
          ? <Video size={18} className="text-text-primary" />
          : <VideoOff size={18} className="text-white" />
        }
      </button>

      <button
        onClick={handleInvite}
        className="bg-transparent border border-border-default rounded-[8px] flex items-center gap-2 px-3 h-10 font-sans font-semibold text-[12px] text-text-secondary hover:bg-accent-green hover:border-accent-green hover:text-white transition-colors duration-150 cursor-pointer"
      >
        {copied ? <Check size={14} /> : <Share size={14} />}
        {copied ? 'Link copied!' : 'Invite'}
      </button>
    </div>
  )
}
