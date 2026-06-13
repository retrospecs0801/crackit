'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Pencil, Moon, Sun } from 'lucide-react';
import { getAvatarColor } from '@/lib/utils';

export function Navbar({ onCreateRoom }: { onCreateRoom: () => void }) {
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    displayName: string;
    avatarInitials: string;
    avatarColor: string;
  } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('studyhall_current_user');
      if (raw) setCurrentUser(JSON.parse(raw));
      
      const theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditClick = () => {
    setEditValue(currentUser?.displayName || '');
    setIsEditing(true);
  };

  const handleConfirm = () => {
    const trimmed = editValue.trim();
    if (trimmed.length < 2) return;

    const initials = trimmed.substring(0, 2).toUpperCase();
    const color = getAvatarColor(trimmed);
    
    const id = currentUser?.id || `local-${Math.random().toString(36).substring(2, 9)}`;

    const updatedUser = {
      id,
      displayName: trimmed,
      avatarInitials: initials,
      avatarColor: color
    };

    localStorage.setItem('studyhall_current_user', JSON.stringify(updatedUser));
    localStorage.setItem('studyhall_display_name', trimmed);
    setCurrentUser(updatedUser);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-[56px] flex items-center justify-between px-6 z-50 border-b" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--card-border)', backdropFilter: 'blur(12px)' }}>
      <Link href="/" className="flex items-center gap-2 font-sans text-[20px] font-semibold text-text-primary hover:opacity-80 transition-opacity">
        <div className="w-[8px] h-[8px] rounded-full bg-accent-green"></div>
        StudyHall
      </Link>
      
      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Profile Section */}
        {isEditing ? (
          <div className="flex items-center h-[32px]">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              className="w-[160px] h-[32px] border border-ink bg-[#FFFFFF] font-sans text-[13px] px-[8px] outline-none rounded-none"
            />
            <button
              onClick={handleConfirm}
              className="w-[32px] h-[32px] border border-ink ml-[-1px] bg-[#7A8B76] text-[#F4F0EB] text-[16px] flex items-center justify-center hover:opacity-90"
            >
              ✓
            </button>
          </div>
        ) : (
          currentUser ? (
            <button
              onClick={handleEditClick}
              className="flex items-center h-[32px] rounded-full border border-border-default bg-canvas hover:shadow-sm hover:border-border-strong transition-all overflow-hidden"
            >
              <div 
                className="w-[28px] h-[28px] ml-[1px] rounded-full flex items-center justify-center font-mono text-[11px] text-white shrink-0"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.avatarInitials}
              </div>
              <span className="font-sans font-medium text-[13px] text-text-primary pl-[8px] pr-[10px] flex items-center gap-1.5">
                {currentUser.displayName}
                <Pencil size={12} className="text-text-muted" />
              </span>
            </button>
          ) : (
            <button
              onClick={handleEditClick}
              className="border border-dashed border-border-strong rounded-full py-[6px] px-[12px] font-sans text-[13px] text-text-muted hover:text-text-primary hover:border-solid transition-colors"
            >
              Set name
            </button>
          )
        )}

        <button
          onClick={onCreateRoom}
          className="rounded-lg font-sans font-semibold text-[13px] px-4 py-2 hover:opacity-90 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
        >
          Create Room
        </button>
      </div>
    </nav>
  );
}
