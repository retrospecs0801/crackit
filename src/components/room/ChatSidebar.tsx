'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@livekit/components-react';

export function ChatSidebar({
  chatDisabled = false,
  welcomeMessageText,
  isFocusChatLocked = false,
  focusChatLockEnabled,
  systemBubbles = [],
}: {
  roomId: string;
  chatDisabled?: boolean;
  welcomeMessageText?: string;
  isFocusChatLocked?: boolean;
  focusChatLockEnabled?: boolean;
  systemBubbles?: Array<{ id: string; text: string; timestamp: number; type?: 'system' | 'log' }>;
}) {
  const { chatMessages, send } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveChatDisabled = chatDisabled || Boolean(isFocusChatLocked);

  // Auto-scroll to bottom on new message or system bubble
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, systemBubbles]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || effectiveChatDisabled) return;

    try {
      await send(inputValue);
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const displayWelcomeText = welcomeMessageText
    ? welcomeMessageText + (focusChatLockEnabled !== false ? '\n\n• Chat will be locked during focus sessions.' : '')
    : (focusChatLockEnabled !== false ? '• Chat will be locked during focus sessions.' : undefined);

  type FeedItem =
    | { type: 'chat'; id: string; timestamp: number; message: string; displayName: string }
    | { type: 'system'; id: string; timestamp: number; text: string }
    | { type: 'log'; id: string; timestamp: number; text: string };

  const feedItems: FeedItem[] = [
    ...chatMessages.map((msg) => ({
      type: 'chat' as const,
      id: msg.id,
      timestamp: msg.timestamp,
      message: msg.message,
      displayName: msg.from?.name || msg.from?.identity || 'Anonymous',
    })),
    ...systemBubbles.map((b) => ({
      type: b.type === 'log' ? 'log' as const : 'system' as const,
      id: b.id,
      timestamp: b.timestamp,
      text: b.text,
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-2" style={{ scrollbarWidth: 'thin' }}>
        {/* Local Welcome/Rules banner at top of the feed */}
        {displayWelcomeText && (
          <div className="mb-3 p-3.5 rounded-[10px] border border-accent-green/30 bg-accent-green/5 text-[12px] font-sans text-text-primary flex flex-col gap-1.5 shadow-sm">
            <span className="font-bold text-accent-green text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <span></span> Room Rules & Info
            </span>
            <div className="whitespace-pre-wrap leading-relaxed text-text-secondary">{displayWelcomeText}</div>
          </div>
        )}

        {feedItems.map((item) => {
          const timeString = new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          if (item.type === 'log') {
            return (
              <div key={item.id} className="text-center font-mono text-[10px] text-text-secondary my-2 opacity-80">
                {item.text} &middot; {timeString}
              </div>
            );
          }

          if (item.type === 'system') {
            return (
              <div key={item.id} className="my-1.5 p-3 rounded-[10px] border border-accent-green/30 bg-accent-green/5 text-[12px] font-sans text-text-primary flex items-center gap-2 shadow-sm">
                <span className="text-[10px] text-text-secondary font-mono">[{timeString}]</span>
                <span className="font-semibold text-accent-green">{item.text}</span>
              </div>
            );
          }

          return (
            <div key={item.id} className="font-mono text-[12px] leading-relaxed text-text-primary">
              <span className="text-[10px] mr-2 text-text-secondary">[{timeString}]</span>
              <span className="font-bold mr-1">{item.displayName}:</span>
              <span>{item.message}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 mt-2 pt-2 border-t border-border-default bg-transparent">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={effectiveChatDisabled}
            placeholder={effectiveChatDisabled ? "Chat is locked..." : "Type a message..."}
            className="flex-1 font-sans text-[13px] px-3 py-1.5 outline-none focus:border-accent-green transition-colors placeholder-text-secondary bg-surface-raised border border-border-default rounded-[6px] text-text-primary disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || effectiveChatDisabled}
            className="font-sans text-[12px] px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-border-default rounded-[6px] text-text-primary"
          >
            Send
          </button>
        </form>
        {isFocusChatLocked ? (
          <div className="font-sans text-[10px] text-accent-terracotta mt-1 text-center font-medium">
            Chat and mics are disabled during focus sessions.
          </div>
        ) : chatDisabled ? (
          <div className="font-sans text-[10px] text-accent-terracotta mt-1 text-center font-medium">
            Chat has been disabled by the room owner.
          </div>
        ) : null}
      </div>
    </div>
  );
}
