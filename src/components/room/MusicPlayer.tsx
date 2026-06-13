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
        isPlaying ? 'bg-[#27272A] border-[#5C7A5A] text-[#5C7A5A]' : 'bg-[#27272A] border-[#3F3F46] text-[#A1A1AA]'
      }`}
    >
      Lo-Fi {isPlaying ? '■' : '▶'}
      <audio ref={audioRef} src="https://stream.zeno.fm/f3wvbbqmdg8uv" loop />
    </button>
  );
}
