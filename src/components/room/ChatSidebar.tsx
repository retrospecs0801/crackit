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
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {messages.map((msg) => (
          <div key={msg.id} className="font-mono text-[12px] leading-relaxed" style={{ color: '#E8E8E8' }}>
            <span className="text-[10px] mr-2" style={{ color: '#888888' }}>[{msg.timestamp}]</span>
            <span className="font-bold mr-1">{msg.displayName}:</span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="shrink-0 mt-2">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 font-sans text-[13px] px-3 py-1.5 outline-none focus:border-[#7A8B76] transition-colors placeholder-[#888888]"
            style={{ 
              backgroundColor: '#242424', 
              border: '1px solid #333333', 
              borderRadius: '6px', 
              color: '#E8E8E8' 
            }}
          />
          <button
            type="submit"
            className="font-sans text-[12px] px-3 py-1.5 hover:bg-[#333333] transition-colors"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #333333',
              borderRadius: '6px',
              color: '#E8E8E8'
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
