'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDataChannel, useParticipants } from '@livekit/components-react';
import { usePomodoro, PomodoroEvent } from '@/hooks/usePomodoro';
import { Pencil, Check, X } from 'lucide-react';

interface PomodoroTimerProps {
  isOwner: boolean;
  currentUserId: string;
  focusMicLockEnabled?: boolean;
  focusChatLockEnabled?: boolean;
  onPomodoroStateChange?: (state: { isRunning: boolean; phase: 'FOCUS' | 'BREAK'; lastEventType?: string }) => void;
}

type Preset = '25/5' | '50/10' | 'custom';

export function PomodoroTimer({ isOwner, focusMicLockEnabled, focusChatLockEnabled, onPomodoroStateChange }: PomodoroTimerProps) {
  const [activeTab, setActiveTab] = useState<'room' | 'personal'>('room');

  // --- ROOM TIMER STATE ---
  const [preset, setPreset] = useState<Preset>('25/5');
  const [customFocus, setCustomFocus] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [isEditing, setIsEditing] = useState(false);
  const [editFocus, setEditFocus] = useState('25');
  const [editBreak, setEditBreak] = useState('5');
  const [externalEvent, setExternalEvent] = useState<PomodoroEvent | null>(null);

  const focusDuration = (preset === '25/5' ? 25 : preset === '50/10' ? 50 : customFocus) * 60;
  const breakDuration = (preset === '25/5' ? 5 : preset === '50/10' ? 10 : customBreak) * 60;

  // --- PERSONAL TIMER STATE ---
  const [personalPreset, setPersonalPreset] = useState<Preset>('25/5');
  const [personalCustomFocus, setPersonalCustomFocus] = useState(25);
  const [personalCustomBreak, setPersonalCustomBreak] = useState(5);
  const [isPersonalEditing, setIsPersonalEditing] = useState(false);
  const [personalEditFocus, setPersonalEditFocus] = useState('25');
  const [personalEditBreak, setPersonalEditBreak] = useState('5');
  const [personalExternalEvent, setPersonalExternalEvent] = useState<PomodoroEvent | null>(null);

  const personalFocusDuration = (personalPreset === '25/5' ? 25 : personalPreset === '50/10' ? 50 : personalCustomFocus) * 60;
  const personalBreakDuration = (personalPreset === '25/5' ? 5 : personalPreset === '50/10' ? 10 : personalCustomBreak) * 60;

  // --- DATA CHANNEL FOR ROOM TIMER ---
  const { send, message } = useDataChannel('pomodoro');
  const sendRef = useRef(send);
  useEffect(() => { sendRef.current = send; }, [send]);

  const onBroadcast = useCallback((event: PomodoroEvent) => {
    try {
      const eventWithDurations = {
        ...event,
        focusDuration,
        breakDuration,
      };
      const encoded = new TextEncoder().encode(JSON.stringify(eventWithDurations));
      sendRef.current(encoded, { reliable: true });
    } catch (e) {
      console.error('[Pomodoro] Failed to send broadcast:', e);
    }
    setExternalEvent(event);
  }, [focusDuration, breakDuration]);

  // Room Pomodoro Hook
  const { timeLeft, phase, isRunning, start, pause, reset } = usePomodoro({
    isOwner,
    onBroadcast,
    externalEvent,
    focusDuration,
    breakDuration,
  });

  // Personal Pomodoro Hook (client-side only, isOwner = true so it works locally)
  const {
    timeLeft: personalTimeLeft,
    phase: personalPhase,
    isRunning: personalIsRunning,
    start: personalStart,
    pause: personalPause,
    reset: personalReset,
  } = usePomodoro({
    isOwner: true,
    onBroadcast: (event) => setPersonalExternalEvent(event),
    externalEvent: personalExternalEvent,
    focusDuration: personalFocusDuration,
    breakDuration: personalBreakDuration,
  });

  // Handle incoming DataChannel messages (Room timer sync)
  useEffect(() => {
    if (!message) return;
    try {
      const event: PomodoroEvent = JSON.parse(new TextDecoder().decode(message.payload));
      if (event.focusDuration && event.breakDuration) {
        const fMin = event.focusDuration / 60;
        const bMin = event.breakDuration / 60;
        if (fMin === 25 && bMin === 5) {
          setPreset('25/5');
        } else if (fMin === 50 && bMin === 10) {
          setPreset('50/10');
        } else {
          setPreset('custom');
          setCustomFocus(fMin);
          setCustomBreak(bMin);
        }
      }
      setExternalEvent(event);
    } catch (e) {
      console.error('[Pomodoro] Failed to parse DataChannel message:', e);
    }
  }, [message]);

  // Late-joiner SYNC for Room timer
  const participants = useParticipants();
  const prevParticipantCountRef = useRef(participants.length);
  const isRunningRef = useRef(isRunning);
  const timeLeftRef = useRef(timeLeft);
  const phaseRef = useRef(phase);
  const focusDurationRef = useRef(focusDuration);
  const breakDurationRef = useRef(breakDuration);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  useEffect(() => {
    onPomodoroStateChange?.({
      isRunning,
      phase,
      lastEventType: externalEvent?.type,
    });
  }, [isRunning, phase, externalEvent, onPomodoroStateChange]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { focusDurationRef.current = focusDuration; }, [focusDuration]);
  useEffect(() => { breakDurationRef.current = breakDuration; }, [breakDuration]);

  useEffect(() => {
    const currentCount = participants.length;
    const prevCount = prevParticipantCountRef.current;

    if (isOwner && currentCount > prevCount && isRunningRef.current) {
      const syncEvent: PomodoroEvent = {
        type: 'SYNC',
        timestamp: Date.now(),
        timeLeft: timeLeftRef.current,
        phase: phaseRef.current,
        duration: phaseRef.current === 'FOCUS' ? focusDurationRef.current : breakDurationRef.current,
        focusDuration: focusDurationRef.current,
        breakDuration: breakDurationRef.current,
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

  // Room timer actions
  const handleRoomPresetChange = (newPreset: Exclude<Preset, 'custom'>) => {
    if (isRunning || !isOwner) return;
    setPreset(newPreset);
    const newFocus = newPreset === '25/5' ? 25 * 60 : 50 * 60;
    const newBreak = newPreset === '25/5' ? 5 * 60 : 10 * 60;
    const event: PomodoroEvent = {
      type: 'RESET',
      timestamp: Date.now(),
      timeLeft: newFocus,
      phase: 'FOCUS',
      duration: newFocus,
      focusDuration: newFocus,
      breakDuration: newBreak,
    };
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(event));
      sendRef.current(encoded, { reliable: true });
    } catch (e) {
      console.error('[Pomodoro] Failed to broadcast preset change:', e);
    }
    setExternalEvent(event);
  };

  const handleConfirmRoomCustom = () => {
    const fVal = parseInt(editFocus, 10);
    const bVal = parseInt(editBreak, 10);
    if (isNaN(fVal) || fVal <= 0 || isNaN(bVal) || bVal <= 0) {
      return;
    }
    setCustomFocus(fVal);
    setCustomBreak(bVal);
    setPreset('custom');
    setIsEditing(false);

    const newFocus = fVal * 60;
    const newBreak = bVal * 60;
    const event: PomodoroEvent = {
      type: 'RESET',
      timestamp: Date.now(),
      timeLeft: newFocus,
      phase: 'FOCUS',
      duration: newFocus,
      focusDuration: newFocus,
      breakDuration: newBreak,
    };
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(event));
      sendRef.current(encoded, { reliable: true });
    } catch (e) {
      console.error('[Pomodoro] Failed to broadcast custom duration change:', e);
    }
    setExternalEvent(event);
  };

  // Personal timer actions
  const handlePersonalPresetChange = (newPreset: Exclude<Preset, 'custom'>) => {
    if (personalIsRunning) return;
    setPersonalPreset(newPreset);
    const newFocus = newPreset === '25/5' ? 25 * 60 : 50 * 60;
    const newBreak = newPreset === '25/5' ? 5 * 60 : 10 * 60;
    const event: PomodoroEvent = {
      type: 'RESET',
      timestamp: Date.now(),
      timeLeft: newFocus,
      phase: 'FOCUS',
      duration: newFocus,
      focusDuration: newFocus,
      breakDuration: newBreak,
    };
    setPersonalExternalEvent(event);
  };

  const handleConfirmPersonalCustom = () => {
    const fVal = parseInt(personalEditFocus, 10);
    const bVal = parseInt(personalEditBreak, 10);
    if (isNaN(fVal) || fVal <= 0 || isNaN(bVal) || bVal <= 0) {
      return;
    }
    setPersonalCustomFocus(fVal);
    setPersonalCustomBreak(bVal);
    setPersonalPreset('custom');
    setIsPersonalEditing(false);

    const newFocus = fVal * 60;
    const newBreak = bVal * 60;
    const event: PomodoroEvent = {
      type: 'RESET',
      timestamp: Date.now(),
      timeLeft: newFocus,
      phase: 'FOCUS',
      duration: newFocus,
      focusDuration: newFocus,
      breakDuration: newBreak,
    };
    setPersonalExternalEvent(event);
  };

  const roomMinutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const roomSeconds = (timeLeft % 60).toString().padStart(2, '0');

  const personalMinutes = Math.floor(personalTimeLeft / 60).toString().padStart(2, '0');
  const personalSeconds = (personalTimeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center w-full">
      {/* Tab switcher */}
      <div className="flex w-full px-1 py-1 h-[36px] border-b border-border-default bg-surface mb-4">
        <button
          onClick={() => setActiveTab('room')}
          className="flex-1 flex items-center justify-center font-sans text-[12px] font-medium transition-all duration-150 rounded-[4px] cursor-pointer"
          style={{
            color: activeTab === 'room' ? 'var(--tab-active-text)' : 'var(--tab-inactive-text)',
            backgroundColor: activeTab === 'room' ? 'var(--tab-active-bg)' : 'transparent',
          }}
        >
          Room
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className="flex-1 flex items-center justify-center font-sans text-[12px] font-medium transition-all duration-150 rounded-[4px] cursor-pointer"
          style={{
            color: activeTab === 'personal' ? 'var(--tab-active-text)' : 'var(--tab-inactive-text)',
            backgroundColor: activeTab === 'personal' ? 'var(--tab-active-bg)' : 'transparent',
          }}
        >
          Personal
        </button>
      </div>

      {activeTab === 'room' ? (
        <div className="flex flex-col items-center w-full">
          {/* Phase Label */}
          <div 
            className={`font-mono text-[11px] tracking-[0.15em] mb-2 ${
              phase === 'FOCUS' ? 'text-accent-green font-semibold' : 'text-text-secondary'
            }`}
          >
            {phase}
          </div>

          {/* Phase Preset Selector — owner only */}
          {isOwner && (
            <div className="flex items-center gap-2 mb-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => handleRoomPresetChange('25/5')}
                    disabled={isRunning}
                    className={`font-sans text-[12px] px-3 py-1 transition-colors rounded-[6px] border ${
                      preset === '25/5'
                        ? 'bg-accent-green text-surface-raised border-accent-green'
                        : 'bg-surface text-text-secondary border-border-default hover:text-text-primary'
                    } ${isRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    25 / 5
                  </button>
                  <button
                    onClick={() => handleRoomPresetChange('50/10')}
                    disabled={isRunning}
                    className={`font-sans text-[12px] px-3 py-1 transition-colors rounded-[6px] border ${
                      preset === '50/10'
                        ? 'bg-accent-green text-surface-raised border-accent-green'
                        : 'bg-surface text-text-secondary border-border-default hover:text-text-primary'
                    } ${isRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    50 / 10
                  </button>
                  {preset === 'custom' && (
                    <span className="font-sans text-[12px] px-3 py-1 bg-accent-green text-surface-raised border border-accent-green rounded-[6px]">
                      {customFocus} / {customBreak}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (isRunning) return;
                      setEditFocus(customFocus.toString());
                      setEditBreak(customBreak.toString());
                      setIsEditing(true);
                    }}
                    disabled={isRunning}
                    className={`p-1.5 rounded-[6px] border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface transition-colors ${
                      isRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                    title="Edit custom duration"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={editFocus}
                    onChange={(e) => setEditFocus(e.target.value)}
                    className="w-12 text-[12px] px-1.5 py-0.5 rounded-[4px] border border-border-default bg-surface text-text-primary focus:outline-none focus:border-accent-green [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Focus"
                  />
                  <span className="text-text-secondary text-[12px]">/</span>
                  <input
                    type="number"
                    value={editBreak}
                    onChange={(e) => setEditBreak(e.target.value)}
                    className="w-12 text-[12px] px-1.5 py-0.5 rounded-[4px] border border-border-default bg-surface text-text-primary focus:outline-none focus:border-accent-green [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Break"
                  />
                  <button
                    onClick={handleConfirmRoomCustom}
                    className="p-1 text-accent-green hover:bg-surface rounded-[4px] transition-colors cursor-pointer"
                    title="Confirm"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface rounded-[4px] transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timer Digits */}
          <div className="font-mono text-[48px] leading-none mb-1 tabular-nums text-text-primary">
            {roomMinutes}:{roomSeconds}
          </div>

          {/* Sync status for non-owners */}
          {!isOwner && isRunning && (
            <div className="font-sans text-[10px] mb-3 text-text-secondary">
              Synced with room
            </div>
          )}
          {!isOwner && !isRunning && (
            <div className="font-sans text-[11px] mb-3 text-text-secondary">
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
                    className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-text-primary hover:text-surface-raised transition-colors rounded-[6px] border border-border-default text-text-primary bg-transparent cursor-pointer"
                  >
                    Start
                  </button>
                ) : (
                  <button 
                    onClick={pause}
                    className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-text-primary hover:text-surface-raised transition-colors rounded-[6px] border border-border-default text-text-primary bg-transparent cursor-pointer"
                  >
                    Pause
                  </button>
                )}
                <button 
                  onClick={reset}
                  className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-accent-green hover:border-accent-green hover:text-surface-raised transition-colors rounded-[6px] border border-border-default text-text-primary bg-transparent cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Owner label */}
              <div className="font-sans text-[10px] text-accent-green font-medium">
                You control the timer
              </div>
            </>
          )}

          {/* Focus Lock Hint */}
          {(focusMicLockEnabled !== false || focusChatLockEnabled !== false) && (
            <div className="font-sans text-[11px] text-text-secondary mt-2 text-center">
              {focusMicLockEnabled !== false && focusChatLockEnabled !== false
                ? "Mic and chat are disabled during focus"
                : focusMicLockEnabled !== false
                ? "Mic is disabled during focus"
                : "Chat is disabled during focus"}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          {/* Phase Label */}
          <div 
            className={`font-mono text-[11px] tracking-[0.15em] mb-2 ${
              personalPhase === 'FOCUS' ? 'text-accent-green font-semibold' : 'text-text-secondary'
            }`}
          >
            {personalPhase}
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2 mb-3">
            {!isPersonalEditing ? (
              <>
                <button
                  onClick={() => handlePersonalPresetChange('25/5')}
                  disabled={personalIsRunning}
                  className={`font-sans text-[12px] px-3 py-1 transition-colors rounded-[6px] border ${
                    personalPreset === '25/5'
                      ? 'bg-accent-green text-surface-raised border-accent-green'
                      : 'bg-surface text-text-secondary border-border-default hover:text-text-primary'
                  } ${personalIsRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  25 / 5
                </button>
                <button
                  onClick={() => handlePersonalPresetChange('50/10')}
                  disabled={personalIsRunning}
                  className={`font-sans text-[12px] px-3 py-1 transition-colors rounded-[6px] border ${
                    personalPreset === '50/10'
                      ? 'bg-accent-green text-surface-raised border-accent-green'
                      : 'bg-surface text-text-secondary border-border-default hover:text-text-primary'
                  } ${personalIsRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  50 / 10
                </button>
                {personalPreset === 'custom' && (
                  <span className="font-sans text-[12px] px-3 py-1 bg-accent-green text-surface-raised border border-accent-green rounded-[6px]">
                    {personalCustomFocus} / {personalCustomBreak}
                  </span>
                )}
                <button
                  onClick={() => {
                    if (personalIsRunning) return;
                    setPersonalEditFocus(personalCustomFocus.toString());
                    setPersonalEditBreak(personalCustomBreak.toString());
                    setIsPersonalEditing(true);
                  }}
                  disabled={personalIsRunning}
                  className={`p-1.5 rounded-[6px] border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface transition-colors ${
                    personalIsRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                  title="Edit custom duration"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={personalEditFocus}
                  onChange={(e) => setPersonalEditFocus(e.target.value)}
                  className="w-12 text-[12px] px-1.5 py-0.5 rounded-[4px] border border-border-default bg-surface text-text-primary focus:outline-none focus:border-accent-green [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Focus"
                />
                <span className="text-text-secondary text-[12px]">/</span>
                <input
                  type="number"
                  value={personalEditBreak}
                  onChange={(e) => setPersonalEditBreak(e.target.value)}
                  className="w-12 text-[12px] px-1.5 py-0.5 rounded-[4px] border border-border-default bg-surface text-text-primary focus:outline-none focus:border-accent-green [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Break"
                />
                <button
                  onClick={handleConfirmPersonalCustom}
                  className="p-1 text-accent-green hover:bg-surface rounded-[4px] transition-colors cursor-pointer"
                  title="Confirm"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPersonalEditing(false)}
                  className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface rounded-[4px] transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Timer Digits */}
          <div className="font-mono text-[48px] leading-none mb-1 tabular-nums text-text-primary">
            {personalMinutes}:{personalSeconds}
          </div>

          <div className="mb-3" />

          {/* Controls */}
          <div className="flex gap-2 mb-3">
            {!personalIsRunning ? (
              <button 
                onClick={personalStart}
                className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-text-primary hover:text-surface-raised transition-colors rounded-[6px] border border-border-default text-text-primary bg-transparent cursor-pointer"
              >
                Start
              </button>
            ) : (
              <button 
                onClick={personalPause}
                className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-text-primary hover:text-surface-raised transition-colors rounded-[6px] border border-border-default text-text-primary bg-transparent cursor-pointer"
              >
                Pause
              </button>
            )}
            <button 
              onClick={personalReset}
              className="font-sans text-[12px] px-[14px] py-[6px] hover:bg-accent-green hover:border-accent-green hover:text-surface-raised transition-colors rounded-[6px] border border-border-default text-text-primary bg-transparent cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Personal label */}
          <div className="font-sans text-[10px] text-text-secondary">
            Your private private timer
          </div>
        </div>
      )}
    </div>
  );
}
