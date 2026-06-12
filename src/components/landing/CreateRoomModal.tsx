'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExamTag, Room } from '@/types';

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
      ownerId: 'local-user',
      createdAt: new Date().toISOString()
    };
    
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room)
      });
      
      if (!res.ok) {
        throw new Error('Failed to create room');
      }
      
      onClose();
      router.push(`/room/${room.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Could not create room. Please try again.');
    }
  };

  const inputStyles = "w-full border border-ink bg-white font-sans text-[14px] px-3 py-2 text-ink outline-none focus:border-[2px] focus:p-[7px] placeholder:text-ink/40";
  const labelStyles = "block font-mono text-[12px] text-ink mb-1";

  return (
    <div 
      className="fixed inset-0 bg-ink/60 z-[100] flex items-end sm:items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="w-full sm:w-[480px] max-w-[90vw] bg-canvas sm:border-[2px] border-ink sm:shadow-[8px_8px_0px_var(--color-ink)] h-full sm:h-auto overflow-y-auto sm:overflow-visible transition-transform duration-300 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 flex flex-col"
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-ink shrink-0">
          <h2 className="font-serif text-[22px] text-ink">Initialize Room</h2>
          <button 
            onClick={onClose}
            className="text-ink hover:text-ink-muted transition-colors font-mono text-[16px] leading-none p-1"
          >
            ✕
          </button>
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
              className={`${inputStyles} resize-none`}
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
            className="w-full h-[44px] bg-ink text-white font-sans text-[14px] border border-ink mt-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_var(--color-ink-muted)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
