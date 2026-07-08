'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExamTag, Room } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [examType, setExamType] = useState<ExamTag>('JEE');
  const [roomName, setRoomName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [maxStudents, setMaxStudents] = useState(6);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const existingErrors = form.querySelectorAll('.custom-error-msg');
    existingErrors.forEach(el => el.remove());
    
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.style.border = '';
    });

    let hasError = false;

    const roomNameInput = form.querySelector('input[placeholder="e.g. Late Night JEE Grind"]') as HTMLInputElement;
    const topicInput = form.querySelector('input[placeholder="What are you studying today?"]') as HTMLInputElement;

    if (!roomName.trim() && roomNameInput) {
      roomNameInput.style.border = '1px solid #BC6C4F';
      const errorMsg = document.createElement('div');
      errorMsg.className = 'custom-error-msg';
      errorMsg.style.color = '#BC6C4F';
      errorMsg.style.fontFamily = '"JetBrains Mono", monospace';
      errorMsg.style.fontSize = '11px';
      errorMsg.style.marginTop = '4px';
      errorMsg.innerText = 'Room name cannot be empty';
      roomNameInput.parentElement?.appendChild(errorMsg);
      hasError = true;
    }

    if (!topic.trim() && topicInput) {
      topicInput.style.border = '1px solid #BC6C4F';
      const errorMsg = document.createElement('div');
      errorMsg.className = 'custom-error-msg';
      errorMsg.style.color = '#BC6C4F';
      errorMsg.style.fontFamily = '"JetBrains Mono", monospace';
      errorMsg.style.fontSize = '11px';
      errorMsg.style.marginTop = '4px';
      errorMsg.innerText = 'Topic cannot be empty';
      topicInput.parentElement?.appendChild(errorMsg);
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be signed in to create a room.');
      setSubmitting(false);
      return;
    }

    const slug = roomName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomId = Math.random().toString(36).substring(2, 7);
    const id = `${slug}-${randomId}`;
    
    const room: Room = {
      id,
      name: roomName,
      examTag: examType,
      topic,
      description,
      maxStudents: Number(maxStudents),
      currentStudents: 1,
      members: [],
      owner_id: user.id,
      ownerId: user.id,
      createdAt: new Date().toISOString()
    };
    
    try {
      // 1. Insert room into Supabase database
      const { error: supabaseError } = await supabase.from('rooms').insert({
        id: room.id,
        name: room.name,
        exam_tag: room.examTag,
        topic: room.topic,
        description: room.description,
        max_students: room.maxStudents,
        owner_id: user.id,
        created_at: room.createdAt,
      });

      if (supabaseError) {
        console.warn('Supabase room insert warning:', supabaseError);
      }

      // 2. Create room via LiveKit server endpoint
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room)
      });
      
      if (!res.ok) {
        throw new Error('Failed to create room');
      }
      
      try {
        sessionStorage.setItem(`crackit_room_${room.id}`, JSON.stringify(room));
      } catch {}
      
      onClose();
      router.push(`/room/${room.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Could not create room. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyles = "w-full border border-border-default bg-surface rounded-lg font-sans text-[14px] px-3 h-[40px] text-text-primary outline-none focus:border-accent-green transition-all duration-150 placeholder:text-text-muted";
  const labelStyles = "block font-sans font-semibold text-[12px] text-text-primary mb-1.5 uppercase tracking-[0.02em]";

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center backdrop-blur-[4px]"
      style={{ backgroundColor: 'rgba(28, 25, 23, 0.5)' }}
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="w-full sm:w-[480px] max-w-[90vw] bg-surface-raised rounded-[16px] border border-border-default h-full sm:h-auto overflow-y-auto sm:overflow-visible transition-transform duration-300 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 flex flex-col"
        style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}
      >
        <div className="flex flex-col px-6 py-5 shrink-0" style={{ borderBottom: '1px solid var(--canvas)' }}>
          <div className="flex justify-between items-start">
            <h2 className="font-sans font-bold text-[20px] text-text-primary">Create a Room</h2>
            <button 
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors font-mono text-[16px] leading-none p-1"
            >
              ✕
            </button>
          </div>
          <p className="font-sans text-[13px] text-text-secondary mt-1">Your room will be live immediately</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className={labelStyles}>Exam Type</label>
            <select 
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamTag)}
              className={inputStyles}
            >
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
              <option value="UPSC">UPSC</option>
              <option value="CBSE">CBSE</option>
              <option value="CAT">CAT</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <label className={labelStyles}>Room Name</label>
            <input 
              type="text" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Late Night JEE Grind"
              className={inputStyles}
              required
            />
          </div>

          <div>
            <label className={labelStyles}>Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What are you studying today?"
              className={inputStyles}
            />
          </div>

          <div>
            <label className={labelStyles}>Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context for others..."
              rows={3}
              className={`${inputStyles} resize-none py-2 h-auto`}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div>
            <label className={labelStyles}>Max Students</label>
            <input 
              type="number" 
              min={2}
              max={12}
              value={maxStudents}
              onChange={(e) => setMaxStudents(parseInt(e.target.value))}
              className={inputStyles}
            />
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full h-[44px] bg-text-primary text-surface-raised rounded-lg font-sans font-semibold text-[13px] mt-2 hover:bg-[#2C2A27] hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-50"
          >
            {submitting ? 'Creating Room...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
