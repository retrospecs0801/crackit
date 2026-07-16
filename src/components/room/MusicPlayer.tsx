'use client';

import { useState, useRef } from 'react';

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <button
      onClick={togglePlay}
      className={`font-sans font-medium text-[12px] border rounded-[6px] px-3 py-1.5 transition-colors ${
        isPlaying
          ? 'bg-accent-green/10 border-accent-green text-accent-green'
          : 'bg-surface-raised border-border-default text-text-secondary hover:text-text-primary'
      }`}
    >
      Lo-Fi {isPlaying ? '■' : '▶'}
      <audio ref={audioRef} src="https://stream.zeno.fm/f3wvbbqmdg8uv" loop />
    </button>
  );
}
