'use client';

import { useState, useEffect } from 'react';
import { getAvatarColor } from '@/lib/utils';

interface DisplayNameModalProps {
  onComplete: (displayName: string) => void;
}

export function DisplayNameModal({ onComplete }: DisplayNameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const existingName = localStorage.getItem('studyhall_display_name');
    if (existingName) {
      // If it exists, skip modal
      onComplete(existingName);
    } else {
      setIsVisible(true);
    }
  }, [onComplete]);

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    // Save to local storage
    localStorage.setItem('studyhall_display_name', trimmed);
    
    const initials = trimmed.substring(0, 2).toUpperCase();
    const color = getAvatarColor(trimmed);
    
    // Create random ID for local mock user if they don't have one? 
    // The spec doesn't require an ID in local storage but we can assume ID is generated later or locally
    const id = `local-${Math.random().toString(36).substring(2, 9)}`;
    
    const currentUser = {
      id,
      displayName: trimmed,
      avatarInitials: initials,
      avatarColor: color
    };
    
    localStorage.setItem('studyhall_current_user', JSON.stringify(currentUser));
    
    setIsVisible(false);
    onComplete(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-[#2D2A26]/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-canvas border-[2px] border-ink shadow-[8px_8px_0px_var(--color-ink)] p-6 flex flex-col">
        <h2 className="font-serif text-[20px] text-ink mb-1">What should we call you?</h2>
        <p className="font-sans text-[12px] text-ink-muted mb-5">Your name is only visible to others in the room.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            maxLength={20}
            placeholder="e.g. Arjun, StudyBot99..."
            className={`w-full h-[40px] px-3 font-sans text-[14px] text-ink bg-white outline-none rounded-none border ${error ? 'border-[#BC6C4F]' : 'border-ink focus:border-[2px]'}`}
            autoFocus
          />
          {error && (
            <div className="font-mono text-[11px] text-[#BC6C4F] mt-1">{error}</div>
          )}
          
          <button
            type="submit"
            className="w-full h-[44px] bg-ink text-canvas font-sans text-[14px] mt-4 border border-ink hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_#7A8B76] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
          >
            Enter Room
          </button>
        </form>
      </div>
    </div>
  );
}
