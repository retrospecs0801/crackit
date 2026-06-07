'use client';

import { useState } from 'react';
import { Message } from '@/types';
import { mockMessages } from '@/lib/mockData';

export function ChatSidebar({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>(mockMessages[roomId] || []);
  const [inputValue, setInputValue] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMessage: Message = {
      id: Math.random().toString(),
      userId: 'local-user', // Mock local user
      displayName: 'You',
      text: inputValue,
      timestamp: timeString,
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.map((msg) => (
          <div key={msg.id} className="font-mono text-[12px] text-ink leading-relaxed">
            <span className="text-ink-muted text-[10px] mr-2">[{msg.timestamp}]</span>
            <span className="font-bold mr-1">{msg.displayName}:</span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-ink p-[10px] bg-canvas shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-ink bg-white font-sans text-[13px] px-3 py-1.5 outline-none focus:border-[2px] focus:p-[5px]"
          />
          <button
            type="submit"
            className="border border-ink bg-transparent text-ink font-sans text-[12px] px-3 py-1.5 hover:bg-ink hover:text-white transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
