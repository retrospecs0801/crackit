'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { sendMessage, setTyping, removeTyping } from '@/lib/messaging';

interface ComposerProps {
  conversationId: string;
  currentUserId: string;
  onMessageSent?: () => void;
}

export function Composer({ conversationId, currentUserId, onMessageSent }: ComposerProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const clearTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    removeTyping(conversationId, currentUserId).catch(() => {});
  }, [conversationId, currentUserId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);

    if (newVal.trim().length > 0) {
      // Debounce typing indicator
      if (!typingTimeoutRef.current) {
        setTyping(conversationId, currentUserId).catch(() => {});
      } else {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        clearTyping();
      }, 1200);
    } else {
      clearTyping();
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    clearTyping();
    const currentText = trimmed;
    setText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      await sendMessage(conversationId, currentText, currentUserId);
      onMessageSent?.();
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore text if send failed
      setText(currentText);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // IME check: do not send if composing or keyCode === 229
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      clearTyping();
    };
  }, [clearTyping]);

  // Auto-resize textarea up to max height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  return (
    <div className="p-3 border-t bg-card-bg border-border-default transition-colors">
      <div
        className="flex items-end gap-2 p-1.5 pl-3.5 rounded-2xl bg-canvas border border-border-default focus-within:border-accent-green focus-within:ring-1 focus-within:ring-accent-green/30 transition-all duration-200"
        style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--border-default)' }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={clearTyping}
          placeholder="Type a message..."
          disabled={isSending}
          className="w-full bg-transparent border-0 focus:outline-none font-sans text-sm text-text-primary placeholder:text-text-muted resize-none max-h-[120px] py-1.5 scrollbar-thin leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="p-2.5 rounded-xl bg-accent-green text-white hover:opacity-90 hover:shadow-md transition-all duration-200 shrink-0 disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed flex items-center justify-center"
          title="Send message"
          aria-label="Send message"
        >
          <Send size={16} className={isSending ? 'animate-pulse' : ''} />
        </button>
      </div>
    </div>
  );
}
