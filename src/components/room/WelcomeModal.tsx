'use client';

import React from 'react';
import { EXAM_OPTIONS, ExamTag } from '@/types';

interface WelcomeModalProps {
  roomName: string;
  examTag: ExamTag | string;
  welcomeMessageText: string;
  onConfirm: () => void;
}

export function WelcomeModal({
  roomName,
  examTag,
  welcomeMessageText,
  onConfirm,
}: WelcomeModalProps) {
  const examInfo = EXAM_OPTIONS.find((opt) => opt.id === examTag || opt.name === examTag);
  const flag = examInfo ? examInfo.flag : '🇮🇳';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(28, 25, 23, 0.75)' }}
    >
      <div
        className="w-full max-w-[460px] bg-surface-raised rounded-[20px] border border-border-default flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex flex-col px-6 pt-6 pb-4 border-b border-border-default bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-green/15 text-accent-green font-sans font-semibold text-[11px] uppercase tracking-wider border border-accent-green/30">
              <span>{flag}</span>
              <span>{examTag}</span>
            </span>
            <span className="font-mono text-[11px] text-text-secondary uppercase tracking-widest">
              Room Expectations
            </span>
          </div>
          <h2 className="font-sans font-bold text-[20px] text-text-primary leading-tight">
            {roomName}
          </h2>
        </div>

        {/* Welcome Message Body */}
        <div className="p-6 flex flex-col gap-4 max-h-[50vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex items-start gap-3 p-4 rounded-[12px] bg-surface border border-border-default">
            <div className="text-[20px] shrink-0 mt-0.5"></div>
            <div className="flex flex-col gap-1.5 flex-1 font-sans text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">
              <span className="font-bold text-[12px] uppercase tracking-wider text-accent-green">
                Welcome Message from Host:
              </span>
              <span>{welcomeMessageText}</span>
            </div>
          </div>
          <p className="font-sans text-[12px] text-text-secondary text-center">
           
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default bg-surface flex justify-end">
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-2.5 bg-accent-green hover:bg-accent-green/90 text-surface-raised font-sans font-bold text-[13px] rounded-[10px] transition-all duration-150 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
          >
            <span>I Understand / Proceed to Room</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
