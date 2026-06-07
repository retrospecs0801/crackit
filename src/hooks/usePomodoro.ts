import { useState, useEffect, useCallback } from 'react';

type Phase = 'FOCUS' | 'BREAK';

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export function usePomodoro() {
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [phase, setPhase] = useState<Phase>('FOCUS');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (phase === 'FOCUS') {
        setPhase('BREAK');
        setTimeLeft(BREAK_TIME);
      } else {
        setPhase('FOCUS');
        setTimeLeft(FOCUS_TIME);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, phase]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('FOCUS');
    setTimeLeft(FOCUS_TIME);
  }, []);

  return { timeLeft, phase, isRunning, start, pause, reset };
}
