'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
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
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('studyhall_current_user');
      if (raw) setCurrentUser(JSON.parse(raw));
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

  return (
    <nav className="fixed top-0 left-0 right-0 h-[56px] bg-canvas border-b border-ink flex items-center justify-between px-6 z-50">
      <Link href="/" className="font-serif text-24px font-bold text-ink hover:opacity-80 transition-opacity">
        StudyHall
      </Link>
      
      <div className="flex items-center gap-4">
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
              className="flex items-center h-[32px] border border-ink hover:shadow-[2px_2px_0px_#2D2A26] transition-shadow"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              <div className="w-[28px] h-[28px] ml-[1px] rounded-full bg-black/15 flex items-center justify-center font-mono text-[11px] text-white">
                {currentUser.avatarInitials}
              </div>
              <span className="font-sans text-[13px] text-[#F4F0EB] pl-[8px] pr-[10px] flex items-center gap-1.5">
                {currentUser.displayName}
                <Pencil size={12} className="text-[#F4F0EB] opacity-70" />
              </span>
            </button>
          ) : (
            <button
              onClick={handleEditClick}
              className="border border-dashed border-ink py-[6px] px-[12px] font-sans text-[13px] text-ink-muted hover:text-ink hover:border-solid transition-colors"
            >
              Set name
            </button>
          )
        )}

        <button
          onClick={onCreateRoom}
          className="bg-ink text-white font-sans text-[14px] px-4 py-2 border border-ink hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_var(--color-ink-muted)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          Create Room
        </button>
      </div>
    </nav>
  );
}
