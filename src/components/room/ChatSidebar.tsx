'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@livekit/components-react';

export function ChatSidebar({ roomId }: { roomId: string }) {
  const { chatMessages, send } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await send(inputValue);
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-2" style={{ scrollbarWidth: 'thin' }}>
        {chatMessages.map((msg) => {
          const timeString = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const displayName = msg.from?.name || msg.from?.identity || 'Anonymous';

          return (
            <div key={msg.id} className="font-mono text-[12px] leading-relaxed text-text-primary">
              <span className="text-[10px] mr-2 text-text-secondary">[{timeString}]</span>
              <span className="font-bold mr-1">{displayName}:</span>
              <span>{msg.message}</span>
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
            placeholder="Type a message..."
            className="flex-1 font-sans text-[13px] px-3 py-1.5 outline-none focus:border-accent-green transition-colors placeholder-text-secondary bg-surface-raised border border-border-default rounded-[6px] text-text-primary"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="font-sans text-[12px] px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-border-default rounded-[6px] text-text-primary"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
