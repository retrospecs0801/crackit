'use client';

import { useState } from 'react';
import { Room } from '@/types';
import { useDataChannel } from '@livekit/components-react';

interface RoomSettingsAppProps {
  roomData: Room;
  onUpdateRoom: (updated: Partial<Room>) => void;
}

export function RoomSettingsApp({ roomData, onUpdateRoom }: RoomSettingsAppProps) {
  const [name, setName] = useState(roomData.name);
  const [maxStudents, setMaxStudents] = useState(roomData.maxStudents || 6);
  const [welcomeEnabled, setWelcomeEnabled] = useState(roomData.welcomeMessageEnabled || false);
  const [welcomeText, setWelcomeText] = useState(roomData.welcomeMessageText || '');
  
  const [micDisabled, setMicDisabled] = useState(roomData.micDisabled || false);
  const [cameraDisabled, setCameraDisabled] = useState(roomData.cameraDisabled || false);
  const [chatDisabled, setChatDisabled] = useState(roomData.chatDisabled || false);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { send } = useDataChannel('room-settings');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const updatedRoom: Partial<Room> = {
      id: roomData.id,
      name: name.trim(),
      examTag: roomData.examTag,
      maxStudents: Number(maxStudents),
      welcomeMessageEnabled: welcomeEnabled,
      welcomeMessageText: welcomeEnabled ? welcomeText.trim() : '',
      micDisabled,
      cameraDisabled,
      chatDisabled,
    };

    try {
      const res = await fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRoom),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update settings');
      }

      const data = await res.json();
      
      // Update local state
      onUpdateRoom(data.room);

      // Broadcast to other participants
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({
            type: 'SETTINGS_UPDATED',
            settings: data.room,
          })
        );
        send(payload, { reliable: true });
      } catch (lkErr) {
        console.warn('Failed to broadcast settings update:', lkErr);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyles = "block font-sans font-semibold text-[11px] text-text-primary uppercase tracking-[0.02em] mb-1";
  const inputStyles = "w-full border border-border-default bg-surface rounded-lg font-sans text-[13px] px-3 h-[36px] text-text-primary outline-none focus:border-accent-green transition-all duration-150";

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <h2 className="font-sans text-[14px] text-text-primary font-bold">Room Settings</h2>
      
      <div>
        <label className={labelStyles}>Room Title</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputStyles}
          required
        />
      </div>

      <div>
        <label className={labelStyles}>Exam Type </label>
        <div className="flex items-center px-3 h-[36px] border border-border-default bg-surface-raised rounded-lg text-text-secondary font-sans text-[13px]">
          {roomData.examTag}
        </div>
      </div>

      <div>
        <label className={labelStyles}>Max Students (2 - 12)</label>
        <input 
          type="number" 
          min={2}
          max={12}
          value={maxStudents}
          onChange={(e) => setMaxStudents(Number(e.target.value))}
          className={inputStyles}
          required
        />
      </div>

      {/* Welcome Message Toggle */}
      <div className="border border-border-default rounded-lg p-3 bg-surface">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setWelcomeEnabled(!welcomeEnabled)}>
          <div className="flex flex-col">
            <span className="font-sans font-semibold text-[12px] text-text-primary">Welcome Message</span>
            <span className="font-sans text-[10px] text-text-secondary">Show rules on join</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setWelcomeEnabled(!welcomeEnabled);
            }}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
              welcomeEnabled ? 'bg-accent-green' : 'bg-border-default'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                welcomeEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {welcomeEnabled && (
          <div className="mt-2 pt-2 border-t border-border-default">
            <textarea
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              placeholder="Room rules or description..."
              rows={3}
              className="w-full border border-border-default bg-surface-raised rounded-lg font-sans text-[12px] p-2 text-text-primary outline-none focus:border-accent-green transition-all resize-none"
            />
          </div>
        )}
      </div>

      {/* Lock States */}
      <div className="border border-border-default rounded-lg p-3 bg-surface flex flex-col gap-3">
        <span className="font-sans font-bold text-[11px] text-text-primary uppercase tracking-wider">
          Student Permission Locks
        </span>

        {/* Mic Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-sans text-[12px] text-text-primary">Disable Microphones</span>
            
          </div>
          <button
            type="button"
            onClick={() => setMicDisabled(!micDisabled)}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
              micDisabled ? 'bg-accent-green' : 'bg-border-default'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${micDisabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Camera Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-sans text-[12px] text-text-primary">Disable Cameras</span>
           
          </div>
          <button
            type="button"
            onClick={() => setCameraDisabled(!cameraDisabled)}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
              cameraDisabled ? 'bg-accent-green' : 'bg-border-default'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${cameraDisabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Chat Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-sans text-[12px] text-text-primary">Disable Text Chat</span>
          
          </div>
          <button
            type="button"
            onClick={() => setChatDisabled(!chatDisabled)}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
              chatDisabled ? 'bg-accent-green' : 'bg-border-default'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${chatDisabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {error && <div className="text-[11px] text-accent-terracotta">{error}</div>}
      {success && <div className="text-[11px] text-accent-green font-semibold">Settings saved successfully!</div>}

      <button
        type="submit"
        disabled={submitting}
        className="h-[36px] bg-text-primary text-surface-raised font-sans font-semibold text-[13px] rounded-lg mt-2 hover:opacity-95 transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}
