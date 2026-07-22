'use client';

import { useEffect, useState } from 'react'
import { useTrackToggle, useLocalParticipant } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Share, Check, Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react'

interface MediaControlsProps {
  micDisabled?: boolean;
  cameraDisabled?: boolean;
  isFocusMicLocked?: boolean;
  forceUnmuteTrigger?: number;
}

export default function MediaControls({
  micDisabled = false,
  cameraDisabled = false,
  isFocusMicLocked = false,
  forceUnmuteTrigger,
}: MediaControlsProps) {
  const { buttonProps: micProps, enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone })
  const { buttonProps: camProps, enabled: camEnabled } = useTrackToggle({ source: Track.Source.Camera })
  const { buttonProps: screenProps, enabled: screenEnabled } = useTrackToggle({ source: Track.Source.ScreenShare })
  const { localParticipant } = useLocalParticipant()

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

  // Handle native browser "Stop sharing" trigger by listening for track.ended event
  useEffect(() => {
    if (!localParticipant) return;
    const screenPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
    const track = screenPub?.track?.mediaStreamTrack;
    if (track) {
      const handleEnded = () => {
        if (screenPub && screenPub.track) {
          try {
            localParticipant.unpublishTrack(screenPub.track);
          } catch (e) {
            console.warn('Error cleanly stopping display media track:', e);
          }
        }
      };
      track.addEventListener('ended', handleEnded);
      return () => track.removeEventListener('ended', handleEnded);
    }
  }, [localParticipant, screenEnabled]);

  // Auto-mute if host locks microphone or focus lock engages
  useEffect(() => {
    if ((micDisabled || isFocusMicLocked) && micEnabled && micProps.onClick) {
      const mockEvent = { preventDefault: () => {} } as React.MouseEvent<HTMLButtonElement>;
      micProps.onClick(mockEvent);
    }
  }, [micDisabled, isFocusMicLocked, micEnabled, micProps]);

  // When mic gets disabled by focus lock or host settings, auto-mute.
  // When re-enabled, only the button becomes enabled (`disabled={false}` below);
  // the mic stays muted (off by default) until the user manually toggles it on.

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
        disabled={micDisabled || isFocusMicLocked}
        title={micDisabled || isFocusMicLocked ? "Microphone is locked during focus sessions" : "Toggle Mic"}
        className={`w-10 h-10 border-none rounded-[8px] flex items-center justify-center transition-colors duration-150 text-white disabled:opacity-40 disabled:cursor-not-allowed ${
          micEnabled && !micDisabled && !isFocusMicLocked
            ? 'bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-text-primary' 
            : 'bg-[#C1654A] hover:bg-[#B5563E] text-white'
        }`}
      >
        {micEnabled && !micDisabled && !isFocusMicLocked
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
        {...screenProps}
        title={screenEnabled ? "Stop Screen Share" : "Share Screen"}
        className={`w-10 h-10 border-none rounded-[8px] flex items-center justify-center transition-colors duration-150 text-white ${
          screenEnabled
            ? 'bg-accent-green hover:bg-accent-green/90 text-white shadow-[0_0_12px_rgba(92,122,90,0.5)]' 
            : 'bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-text-primary'
        }`}
      >
        <Monitor size={18} className={screenEnabled ? "text-white" : "text-text-primary"} />
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
