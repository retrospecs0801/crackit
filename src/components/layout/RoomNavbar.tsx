'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MusicPlayer } from '../room/MusicPlayer';
import { NotificationsBell } from './NotificationsBell';
import { Moon, Sun } from 'lucide-react';

export function RoomNavbar({
  roomName,
  currentUserId,
  onToggleSidebar,
}: {
  roomName: string;
  currentUserId?: string | null;
  onToggleSidebar: () => void;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-[52px] flex items-center justify-between px-6 z-50 border-b transition-colors" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--card-border)', backdropFilter: 'blur(12px)' }}>
      <div className="flex-1">
        <Link href="/" className="font-sans font-medium text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150">
          ← Leave
        </Link>
      </div>
      <div className="flex-1 text-center font-sans font-semibold text-[15px] text-text-primary truncate px-4">
        {roomName}
      </div>
      <div className="flex-1 flex justify-end items-center gap-3">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle dark mode"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {currentUserId && <NotificationsBell userId={currentUserId} />}
        <button onClick={onToggleSidebar} className="md:hidden font-sans text-[13px] text-text-primary border border-border-default px-2 py-1 rounded">
          Chat / Timer
        </button>
        <MusicPlayer />
      </div>
    </nav>
  );
}
