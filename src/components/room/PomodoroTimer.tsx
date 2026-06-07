'use client';

import { usePomodoro } from '@/hooks/usePomodoro';

export function PomodoroTimer() {
  const { timeLeft, phase, isRunning, start, pause, reset } = usePomodoro();

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="bg-surface border-b border-ink p-5 flex flex-col items-center">
      
      {/* Phase Label */}
      <div 
        className={`font-mono text-[11px] tracking-[0.15em] mb-2 ${
          phase === 'FOCUS' ? 'text-accent' : 'text-ink-muted'
        }`}
      >
        {phase}
      </div>

      {/* Timer Digits */}
      <div className="font-mono text-[48px] text-ink leading-none mb-4 tabular-nums">
        {minutes}:{seconds}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        {!isRunning ? (
          <button 
            onClick={start}
            className="border border-ink font-sans text-[12px] px-[14px] py-[6px] hover:bg-ink-muted hover:text-white transition-colors"
          >
            Start
          </button>
        ) : (
          <button 
            onClick={pause}
            className="border border-ink font-sans text-[12px] px-[14px] py-[6px] hover:bg-ink hover:text-white transition-colors"
          >
            Pause
          </button>
        )}
        <button 
          onClick={reset}
          className="border border-ink font-sans text-[12px] px-[14px] py-[6px] hover:bg-accent hover:text-white transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Note */}
      <div className="font-sans text-[11px] text-ink/60">
        Owner controls timer for all
      </div>

    </div>
  );
}
