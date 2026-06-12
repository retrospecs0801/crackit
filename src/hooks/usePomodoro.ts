import { useState, useEffect, useCallback, useRef } from 'react';

type Phase = 'FOCUS' | 'BREAK';

export type PomodoroEvent = {
  type: 'START' | 'PAUSE' | 'RESET' | 'SYNC';
  timestamp: number;
  timeLeft: number;
  phase: Phase;
  duration: number;
};

export type PomodoroConfig = {
  isOwner: boolean;
  onBroadcast: (event: PomodoroEvent) => void;
  externalEvent: PomodoroEvent | null;
  focusDuration?: number;
  breakDuration?: number;
};

export function usePomodoro(config: PomodoroConfig) {
  const { isOwner, onBroadcast, externalEvent, focusDuration = 25 * 60, breakDuration = 5 * 60 } = config;

  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [phase, setPhase] = useState<Phase>('FOCUS');
  const [isRunning, setIsRunning] = useState(false);

  const focusDurationRef = useRef(focusDuration);
  const breakDurationRef = useRef(breakDuration);

  // Keep refs in sync with props
  useEffect(() => {
    focusDurationRef.current = focusDuration;
    breakDurationRef.current = breakDuration;
  }, [focusDuration, breakDuration]);

  // Handle external events (broadcasts from owner via DataChannel)
  useEffect(() => {
    if (!externalEvent) return;

    switch (externalEvent.type) {
      case 'START':
      case 'SYNC': {
        const elapsed = (Date.now() - externalEvent.timestamp) / 1000;
        const adjustedTimeLeft = Math.max(0, Math.round(externalEvent.timeLeft - elapsed));
        setPhase(externalEvent.phase);
        setTimeLeft(adjustedTimeLeft);
        setIsRunning(true);
        break;
      }
      case 'PAUSE': {
        setPhase(externalEvent.phase);
        setTimeLeft(externalEvent.timeLeft);
        setIsRunning(false);
        break;
      }
      case 'RESET': {
        setPhase(externalEvent.phase);
        setTimeLeft(externalEvent.duration);
        setIsRunning(false);
        break;
      }
    }
  }, [externalEvent]);

  // Countdown interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Auto-switch phase locally — each client handles independently since they're in sync
      if (phase === 'FOCUS') {
        setPhase('BREAK');
        setTimeLeft(breakDurationRef.current);
      } else {
        setPhase('FOCUS');
        setTimeLeft(focusDurationRef.current);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, phase]);

  // Owner actions — broadcast instead of acting locally
  const start = useCallback(() => {
    if (!isOwner) return;
    const event: PomodoroEvent = {
      type: 'START',
      timestamp: Date.now(),
      timeLeft,
      phase,
      duration: phase === 'FOCUS' ? focusDurationRef.current : breakDurationRef.current,
    };
    onBroadcast(event);
  }, [isOwner, timeLeft, phase, onBroadcast]);

  const pause = useCallback(() => {
    if (!isOwner) return;
    const event: PomodoroEvent = {
      type: 'PAUSE',
      timestamp: Date.now(),
      timeLeft,
      phase,
      duration: phase === 'FOCUS' ? focusDurationRef.current : breakDurationRef.current,
    };
    onBroadcast(event);
  }, [isOwner, timeLeft, phase, onBroadcast]);

  const reset = useCallback(() => {
    if (!isOwner) return;
    const event: PomodoroEvent = {
      type: 'RESET',
      timestamp: Date.now(),
      timeLeft: focusDurationRef.current,
      phase: 'FOCUS',
      duration: focusDurationRef.current,
    };
    onBroadcast(event);
  }, [isOwner, onBroadcast]);

  return { timeLeft, phase, isRunning, start, pause, reset };
}
