'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MusicPlayer } from '../room/MusicPlayer';
import { NotificationsBell } from './NotificationsBell';
import { MessagesButton } from '@/components/messaging/MessagesButton';
import { MessagesPanel } from '@/components/messaging/MessagesPanel';
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
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

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
    <>
      {/* Desktop Navbar — unchanged from original */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-[52px] items-center justify-between px-6 z-50 border-b transition-colors" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--card-border)', backdropFilter: 'blur(12px)' }}>
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
          {currentUserId && <MessagesButton userId={currentUserId} onClick={() => setIsMessagesOpen(true)} />}
          <MusicPlayer />
        </div>
      </nav>

      {/* Mobile Navbar — compact 44px, full room name, no Chat/Timer button */}
      <nav className="flex md:hidden fixed top-0 left-0 right-0 h-[44px] items-center justify-between px-3 z-50 border-b transition-colors" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--card-border)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" className="font-sans font-medium text-[11px] text-text-secondary hover:text-text-primary transition-colors duration-150 shrink-0">
          ← Leave
        </Link>
        <div className="flex-1 text-center font-sans font-semibold text-[12px] text-text-primary truncate px-2">
          {roomName}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <MusicPlayer />
        </div>
      </nav>

      <MessagesPanel isOpen={isMessagesOpen} onClose={() => setIsMessagesOpen(false)} />
    </>
  );
}
