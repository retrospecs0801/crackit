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
      className={`font-mono text-[12px] border border-ink px-3 py-1.5 transition-colors ${
        isPlaying ? 'border-ink-muted text-ink-muted' : 'text-ink'
      }`}
    >
      Lo-Fi {isPlaying ? '■' : '▶'}
      <audio ref={audioRef} src="https://stream.zeno.fm/f3wvbbqmdg8uv" loop />
    </button>
  );
}
