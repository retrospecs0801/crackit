/**
 * ============================================================================
 * SOUND EFFECT REFERENCE & CONFIGURATION
 * ============================================================================
 * This file (`src/lib/soundEffects.ts`) controls the subtle sound effects 
 * played when:
 *   1. Focus Timer completes (Pomodoro focus phase finishes)
 *   2. Break Timer completes (Pomodoro break phase finishes)
 *
 * REFERENCE / WHERE IT IS CALLED:
 * Called inside `src/hooks/usePomodoro.ts` right when the countdown hits 0.
 *
 * HOW TO CUSTOMIZE OR CHANGE THE SOUNDS:
 * 
 * Option A (Synthesized Subtle Chime - Current Default):
 * Modify the frequencies (in Hz) and duration below inside `playTimerCompletionSound`.
 * For reference:
 *   C5 = 523.25 Hz
 *   E5 = 659.25 Hz
 *   G5 = 783.99 Hz
 *   A5 = 880.00 Hz
 * 
 * Option B (Use Custom MP3 / WAV Audio Files):
 * If you want to use custom audio files instead of the synthesized chime:
 * 1. Put your audio files inside `public/sounds/` (e.g. `public/sounds/focus-complete.mp3`).
 * 2. Replace the body of `playTimerCompletionSound` below with:
 *
 *   const audioUrl = phase === 'FOCUS' 
 *     ? '/sounds/focus-complete.mp3' 
 *     : '/sounds/break-complete.mp3';
 *   const audio = new Audio(audioUrl);
 *   audio.volume = 0.5; // Adjust volume (0.0 to 1.0)
 *   audio.play().catch(err => console.warn('Audio playback blocked/failed:', err));
 * ============================================================================
 */

let lastPlayedTime = 0;

export function playTimerCompletionSound(phase: 'FOCUS' | 'BREAK'): void {
  try {
    if (typeof window === 'undefined') return;

    // Throttle: avoid duplicate audio if both Room and Personal timers reach 0 simultaneously
    const nowTimestamp = Date.now();
    if (nowTimestamp - lastPlayedTime < 1000) return;
    lastPlayedTime = nowTimestamp;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Focus end: Soft, calming relaxing two-note chime (E5 -> C5) indicating rest time
    // Break end: Gentle, uplifting two-note chime (C5 -> G5) indicating study time
    const frequencies = phase === 'FOCUS' 
      ? [659.25, 523.25]  // E5 -> C5
      : [523.25, 783.99]; // C5 -> G5

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine'; // Sine wave produces a smooth, subtle, pleasant chime/bell
      osc.frequency.setValueAtTime(freq, now + index * 0.18);

      // Smooth envelope for a subtle chime decay
      gain.gain.setValueAtTime(0, now + index * 0.18);
      gain.gain.linearRampToValueAtTime(0.12, now + index * 0.18 + 0.03); // peak volume 0.12 (very subtle)
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.18 + 0.85); // fade out gently

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.18);
      osc.stop(now + index * 0.18 + 0.9);
    });
  } catch (err) {
    console.warn('[SoundEffects] Could not play timer sound:', err);
  }
}
