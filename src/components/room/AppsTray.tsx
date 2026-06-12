'use client';

import { useState, useEffect } from 'react';
import { useDataChannel } from '@livekit/components-react';

interface AppsTrayProps {
  roomId: string;
  currentUserId: string;
}

type ExpandedApp = 'todo' | 'youtube' | null;

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export function AppsTray({ roomId, currentUserId }: AppsTrayProps) {
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
    } catch (e) {}
  }, [roomId]);

  // Save Todos on change
  useEffect(() => {
    try {
      localStorage.setItem(`studyhall_todos_${roomId}`, JSON.stringify(todos));
    } catch (e) {}
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
      } catch (e) {}
    } else {
      setVideoId(null);
      setYoutubeError(true);
    }
  };

  if (expandedApp === null) {
    return (
      <div className="absolute inset-0 flex flex-col p-4 w-full h-full bg-[#1A1A1A]">
        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            onClick={() => setExpandedApp('youtube')}
            className="flex flex-col items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-colors"
            style={{ backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #333333', padding: '16px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8E8E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span className="font-sans text-[13px] text-[#E8E8E8]">YouTube</span>
          </button>
          <button 
            onClick={() => setExpandedApp('todo')}
            className="flex flex-col items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-colors"
            style={{ backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #333333', padding: '16px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8E8E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            <span className="font-sans text-[13px] text-[#E8E8E8]">Todo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col w-full bg-[#1A1A1A]">
      {/* Back Button Header */}
      <div className="shrink-0 p-4 border-b border-[#333333]">
        <button 
          onClick={() => setExpandedApp(null)}
          className="font-sans text-[12px] text-[#888888] hover:text-[#E8E8E8] transition-colors flex items-center gap-1"
        >
          <span>←</span> Apps
        </button>
      </div>

      {/* Expanded Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {expandedApp === 'todo' && (
          <>
            <h2 className="font-sans text-[14px] text-[#E8E8E8] font-bold">Todo</h2>
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <input 
                type="text"
                value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 font-sans text-[13px] px-3 py-1.5 outline-none focus:border-[#7A8B76] transition-colors placeholder-[#888888]"
                style={{ backgroundColor: '#242424', border: '1px solid #333333', borderRadius: '6px', color: '#E8E8E8' }}
              />
              <button 
                type="submit"
                className="font-sans text-[12px] px-3 py-1.5 hover:bg-[#333333] transition-colors"
                style={{ backgroundColor: 'transparent', border: '1px solid #333333', borderRadius: '6px', color: '#E8E8E8' }}
              >
                Add
              </button>
            </form>
            
            <div className="flex flex-col gap-2 mt-2">
              {todos.length === 0 ? (
                <div className="text-center font-sans text-[13px] text-[#888888] mt-4">Nothing here yet.</div>
              ) : (
                todos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-3 w-full">
                    <button 
                      onClick={() => toggleTodo(todo.id)}
                      className="shrink-0 w-4 h-4 rounded-[3px] border border-[#333333] flex items-center justify-center transition-colors"
                      style={{ backgroundColor: todo.done ? '#7A8B76' : 'transparent' }}
                    >
                      {todo.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span 
                      className="flex-1 font-sans text-[13px] truncate"
                      style={{ 
                        color: todo.done ? '#888888' : '#E8E8E8',
                        textDecoration: todo.done ? 'line-through' : 'none'
                      }}
                    >
                      {todo.text}
                    </span>
                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      className="shrink-0 font-sans text-[14px] text-[#888888] hover:text-[#E8E8E8] transition-colors px-1"
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
            <h2 className="font-sans text-[14px] text-[#E8E8E8] font-bold">YouTube</h2>
            <form onSubmit={handleLoadYouTube} className="flex gap-2">
              <input 
                type="text"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube URL or search..."
                className="flex-1 font-sans text-[13px] px-3 py-1.5 outline-none focus:border-[#7A8B76] transition-colors placeholder-[#888888]"
                style={{ backgroundColor: '#242424', border: '1px solid #333333', borderRadius: '6px', color: '#E8E8E8' }}
              />
              <button 
                type="submit"
                className="font-sans text-[12px] px-3 py-1.5 hover:bg-[#333333] transition-colors"
                style={{ backgroundColor: 'transparent', border: '1px solid #333333', borderRadius: '6px', color: '#E8E8E8' }}
              >
                Load
              </button>
            </form>
            {youtubeError && (
              <div className="font-sans text-[11px] text-[#BC6C4F]">Invalid YouTube URL</div>
            )}
            {videoId && !youtubeError && (
              <div className="mt-2 w-full">
                <iframe 
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  width="100%" 
                  height="180px" 
                  style={{ borderRadius: '6px', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
