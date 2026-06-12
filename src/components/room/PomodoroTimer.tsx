'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDataChannel, useParticipants } from '@livekit/components-react';
import { usePomodoro, PomodoroEvent } from '@/hooks/usePomodoro';

interface PomodoroTimerProps {
  isOwner: boolean;
  currentUserId: string;
}

type Preset = '25/5' | '50/10';

export function PomodoroTimer({ isOwner, currentUserId }: PomodoroTimerProps) {
  const [externalEvent, setExternalEvent] = useState<PomodoroEvent | null>(null);
  const [preset, setPreset] = useState<Preset>('25/5');

  const focusDuration = preset === '25/5' ? 25 * 60 : 50 * 60;
  const breakDuration = preset === '25/5' ? 5 * 60 : 10 * 60;

  // DataChannel hook — must be called before we reference send
  const { send, message } = useDataChannel('pomodoro');
  const sendRef = useRef(send);
  useEffect(() => { sendRef.current = send; }, [send]);

  const onBroadcast = useCallback((event: PomodoroEvent) => {
    // Encode and send via DataChannel
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(event));
      sendRef.current(encoded, { reliable: true });
    } catch (e) {
      console.error('[Pomodoro] Failed to send broadcast:', e);
    }
    // Also apply locally so the owner's own timer responds
    setExternalEvent(event);
  }, []);

  const { timeLeft, phase, isRunning, start, pause, reset } = usePomodoro({
    isOwner,
    onBroadcast,
    externalEvent,
    focusDuration,
    breakDuration,
  });

  // Handle incoming DataChannel messages
  useEffect(() => {
    if (!message) return;
    try {
      const event: PomodoroEvent = JSON.parse(new TextDecoder().decode(message.payload));
      setExternalEvent(event);
    } catch (e) {
      console.error('[Pomodoro] Failed to parse DataChannel message:', e);
    }
  }, [message]);

  // Late-joiner SYNC — when a new participant joins and the timer is running,
  // the owner auto-broadcasts the current state so they catch up immediately
  const participants = useParticipants();
  const prevParticipantCountRef = useRef(participants.length);
  const isRunningRef = useRef(isRunning);
  const timeLeftRef = useRef(timeLeft);
  const phaseRef = useRef(phase);
  const focusDurationRef = useRef(focusDuration);
  const breakDurationRef = useRef(breakDuration);

  // Keep refs in sync with latest values so the effect below has fresh data
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { focusDurationRef.current = focusDuration; }, [focusDuration]);
  useEffect(() => { breakDurationRef.current = breakDuration; }, [breakDuration]);

  useEffect(() => {
    const currentCount = participants.length;
    const prevCount = prevParticipantCountRef.current;

    if (isOwner && currentCount > prevCount && isRunningRef.current) {
      // A new participant joined while the timer is running — send them a SYNC
      const syncEvent: PomodoroEvent = {
        type: 'SYNC',
        timestamp: Date.now(),
        timeLeft: timeLeftRef.current,
        phase: phaseRef.current,
        duration: phaseRef.current === 'FOCUS' ? focusDurationRef.current : breakDurationRef.current,
      };
      try {
        const encoded = new TextEncoder().encode(JSON.stringify(syncEvent));
        sendRef.current(encoded, { reliable: true });
      } catch (e) {
        console.error('[Pomodoro] Failed to send SYNC to late joiner:', e);
      }
    }

    prevParticipantCountRef.current = currentCount;
  }, [participants.length, isOwner]);

  const handlePresetChange = (newPreset: Preset) => {
    if (isRunning || !isOwner) return;
    setPreset(newPreset);
    // Reset with new durations after preset change
    const newFocus = newPreset === '25/5' ? 25 * 60 : 50 * 60;
    const event: PomodoroEvent = {
      type: 'RESET',
      timestamp: Date.now(),
      timeLeft: newFocus,
      phase: 'FOCUS',
      duration: newFocus,
    };
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(event));
      sendRef.current(encoded, { reliable: true });
    } catch (e) {
      console.error('[Pomodoro] Failed to broadcast preset change:', e);
    }
    setExternalEvent(event);
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      
      {/* Phase Label */}
      <div 
        className="font-mono text-[11px] tracking-[0.15em] mb-2"
        style={{ color: phase === 'FOCUS' ? '#7A8B76' : '#888888' }}
      >
        {phase}
      </div>

      {/* Phase Preset Selector — owner only */}
      {isOwner && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => handlePresetChange('25/5')}
            disabled={isRunning}
            className="font-sans text-[12px] px-3 py-1 transition-colors rounded-[6px]"
            style={{
              backgroundColor: preset === '25/5' ? '#7A8B76' : '#333333',
              color: preset === '25/5' ? '#F4F0EB' : '#888888',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.5 : 1,
            }}
          >
            25 / 5
          </button>
          <button
            onClick={() => handlePresetChange('50/10')}
            disabled={isRunning}
            className="font-sans text-[12px] px-3 py-1 transition-colors rounded-[6px]"
            style={{
              backgroundColor: preset === '50/10' ? '#7A8B76' : '#333333',
              color: preset === '50/10' ? '#F4F0EB' : '#888888',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.5 : 1,
            }}
          >
            50 / 10
          </button>
        </div>
      )}

      {/* Timer Digits */}
      <div className="font-mono text-[48px] leading-none mb-1 tabular-nums" style={{ color: '#E8E8E8' }}>
        {minutes}:{seconds}
      </div>

      {/* Sync status for non-owners */}
      {!isOwner && isRunning && (
        <div className="font-sans text-[10px] mb-3" style={{ color: '#888888' }}>
          Synced with room
        </div>
      )}
      {!isOwner && !isRunning && (
        <div className="font-sans text-[11px] mb-3" style={{ color: '#888888' }}>
          Waiting for owner to start...
        </div>
      )}

      {/* Spacer for owner when no status message */}
      {isOwner && <div className="mb-3" />}

      {/* Controls — owner only */}
      {isOwner && (
        <>
          <div className="flex gap-2 mb-3">
            {!isRunning ? (
              <button 
                onClick={start}
                className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-[#333333] hover:text-[#E8E8E8] transition-colors rounded-[6px]"
                style={{ border: '1px solid #333333', color: '#E8E8E8', backgroundColor: 'transparent' }}
              >
                Start
              </button>
            ) : (
              <button 
                onClick={pause}
                className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-[#333333] hover:text-[#E8E8E8] transition-colors rounded-[6px]"
                style={{ border: '1px solid #333333', color: '#E8E8E8', backgroundColor: 'transparent' }}
              >
                Pause
              </button>
            )}
            <button 
              onClick={reset}
              className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-[#7A8B76] hover:border-[#7A8B76] hover:text-[#1A1A1A] transition-colors rounded-[6px]"
              style={{ border: '1px solid #333333', color: '#E8E8E8', backgroundColor: 'transparent' }}
            >
              Reset
            </button>
          </div>

          {/* Owner label */}
          <div className="font-sans text-[10px]" style={{ color: '#7A8B76' }}>
            You control the timer
          </div>
        </>
      )}
    </div>
  );
}
