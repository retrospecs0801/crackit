'use client';

import { useState, useEffect } from 'react';
import { useDataChannel } from '@livekit/components-react';

import { Room } from '@/types';
import { RoomSettingsApp } from './RoomSettingsApp';

interface AppsTrayProps {
  roomId: string;
  currentUserId: string;
  currentUserIdStr?: string;
  isOwner?: boolean;
  roomData?: Room;
  onUpdateRoom?: (updated: Partial<Room>) => void;
}

type ExpandedApp = 'todo' | 'youtube' | 'settings' | null;

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export function AppsTray({
  roomId,
  currentUserId,
  isOwner = false,
  roomData,
  onUpdateRoom,
}: AppsTrayProps) {
  const [expandedApp, setExpandedApp] = useState<ExpandedApp>(null);

  // Todo App State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoInput, setTodoInput] = useState('');

  // YouTube App State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [youtubeError, setYoutubeError] = useState(false);

  const { send } = useDataChannel('youtube-status');

  // Load Todos on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`studyhall_todos_${roomId}`);
      if (stored) {
        setTodos(JSON.parse(stored));
      }
    } catch {}
  }, [roomId]);

  // Save Todos on change
  useEffect(() => {
    try {
      localStorage.setItem(`studyhall_todos_${roomId}`, JSON.stringify(todos));
    } catch {}
  }, [todos, roomId]);

  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!todoInput.trim() || todos.length >= 20) return;
    const newTodo: Todo = { id: Math.random().toString(), text: todoInput, done: false };
    setTodos([...todos, newTodo]);
    setTodoInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleLoadYouTube = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setYoutubeError(false);
    const match = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    if (match && match[1]) {
      const id = match[1];
      setVideoId(id);
      try {
        const event = { type: 'PLAYING', title: id, userId: currentUserId };
        send(new TextEncoder().encode(JSON.stringify(event)), { reliable: true });
      } catch {}
    } else {
      setVideoId(null);
      setYoutubeError(true);
    }
  };

  if (expandedApp === null) {
    return (
      <div className="absolute inset-0 flex flex-col p-4 w-full h-full bg-transparent">
        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            onClick={() => setExpandedApp('youtube')}
            className="flex flex-col items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-surface-raised rounded-[8px] border border-border-default p-4"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span className="font-sans text-[13px] text-text-primary">YouTube</span>
          </button>
          <button 
            onClick={() => setExpandedApp('todo')}
            className="flex flex-col items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-surface-raised rounded-[8px] border border-border-default p-4"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            <span className="font-sans text-[13px] text-text-primary">Todo</span>
          </button>
          {isOwner && (
            <button 
              onClick={() => setExpandedApp('settings')}
              className="flex flex-col items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-surface-raised rounded-[8px] border border-border-default p-4"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span className="font-sans text-[13px] text-text-primary">Settings</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col w-full bg-transparent">
      {/* Back Button Header */}
      <div className="shrink-0 p-4 border-b border-border-default">
        <button 
          onClick={() => setExpandedApp(null)}
          className="font-sans text-[12px] text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
        >
          <span>←</span> Apps
        </button>
      </div>

      {/* Expanded Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {expandedApp === 'todo' && (
          <>
            <h2 className="font-sans text-[14px] text-text-primary font-bold">Todo</h2>
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <input 
                type="text" 
                value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 font-sans text-[13px] px-3 py-1.5 outline-none focus:border-accent-green transition-colors placeholder-text-secondary bg-surface-raised border border-border-default rounded-[6px] text-text-primary"
              />
              <button 
                type="submit"
                className="font-sans text-[12px] px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-transparent border border-border-default rounded-[6px] text-text-primary"
              >
                Add
              </button>
            </form>
            
            <div className="flex flex-col gap-2 mt-2">
              {todos.length === 0 ? (
                <div className="text-center font-sans text-[13px] text-text-secondary mt-4">Nothing here yet.</div>
              ) : (
                todos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-3 w-full">
                    <button 
                      onClick={() => toggleTodo(todo.id)}
                      className={`shrink-0 w-4 h-4 rounded-[3px] border border-border-default flex items-center justify-center transition-colors ${
                        todo.done ? 'bg-accent-green border-accent-green' : 'bg-transparent'
                      }`}
                    >
                      {todo.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span 
                      className={`flex-1 font-sans text-[13px] truncate ${
                        todo.done ? 'text-text-secondary line-through' : 'text-text-primary'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      className="shrink-0 font-sans text-[14px] text-text-secondary hover:text-text-primary transition-colors px-1"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {expandedApp === 'youtube' && (
          <>
            <h2 className="font-sans text-[14px] text-text-primary font-bold">YouTube</h2>
            <form onSubmit={handleLoadYouTube} className="flex gap-2">
              <input 
                type="text" 
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube URL or search..."
                className="flex-1 font-sans text-[13px] px-3 py-1.5 outline-none focus:border-accent-green transition-colors placeholder-text-secondary bg-surface-raised border border-border-default rounded-[6px] text-text-primary"
              />
              <button 
                type="submit"
                className="font-sans text-[12px] px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-transparent border border-border-default rounded-[6px] text-text-primary"
              >
                Load
              </button>
            </form>
            {youtubeError && (
              <div className="font-sans text-[11px] text-accent-terracotta">Invalid YouTube URL</div>
            )}
            {videoId && !youtubeError && (
              <div className="mt-2 w-full">
                <iframe 
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  width="100%" 
                  height="180px" 
                  className="rounded-[6px] border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                />
              </div>
            )}
          </>
        )}

        {expandedApp === 'settings' && isOwner && roomData && onUpdateRoom && (
          <RoomSettingsApp
            roomData={roomData}
            onUpdateRoom={onUpdateRoom}
          />
        )}
      </div>
    </div>
  );
}
