'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { RoomNavbar } from '@/components/layout/RoomNavbar';
import { PomodoroTimer } from '@/components/room/PomodoroTimer';
import { ChatSidebar } from '@/components/room/ChatSidebar';
import  VideoGrid  from '@/components/room/VideoGrid';
import  MediaControls  from '@/components/room/MediaControls';
import { mockRooms } from '@/lib/mockData';
import { getRoomFromStorage, getAvatarColor } from '@/lib/utils';
import { Room, User } from '@/types';
import { DisplayNameModal } from '@/components/room/DisplayNameModal';

export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showReady, setShowReady] = useState(true);

  async function fetchToken(roomId: string, displayName: string) {
    const controller = new AbortController();
    try {
      const res = await fetch(
        `/api/livekit-token?roomName=${encodeURIComponent(roomId)}&participantName=${encodeURIComponent(displayName)}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error('Token fetch failed');
      const data = await res.json();
      setLivekitToken(data.token);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setTokenError('Could not connect to room. Please try again.');
    }
    return () => controller.abort();
  }

  useEffect(() => {
    let abortFn: (() => void) | null = null;
    try {
      const stored = localStorage.getItem('studyhall_current_user');
      let resolvedUser = null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && !parsed.avatarColor) {
          parsed.avatarColor = getAvatarColor(parsed.displayName);
          parsed.avatarInitials = parsed.displayName.substring(0, 2).toUpperCase();
          localStorage.setItem('studyhall_current_user', JSON.stringify(parsed));
        }
        setCurrentUser(parsed);
        resolvedUser = parsed;
      }

      let resolvedRoomData = getRoomFromStorage(params.id);
      if (!resolvedRoomData) {
        resolvedRoomData = mockRooms.find(r => r.id === params.id) || null;
      }

      if (resolvedRoomData && resolvedUser) {
        fetchToken(resolvedRoomData.id, resolvedUser.displayName).then(cleanup => {
  abortFn = cleanup ?? null;
});
      }
    } catch (e) {
      console.error(e);
    }
    return () => {
      if (abortFn) abortFn();
    };
  }, [params.id]);

  useEffect(() => {
    if (livekitToken) {
      console.log('[StudyHall] LiveKit token ready:', livekitToken.substring(0, 30) + '...');
      const timer = setTimeout(() => setShowReady(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [livekitToken]);

  useEffect(() => {
    const storedRoom = getRoomFromStorage(params.id);
    if (storedRoom) {
      setRoomData(storedRoom);
      return;
    }
    
    const mockRoom = mockRooms.find(r => r.id === params.id);
    if (mockRoom) {
      setRoomData(mockRoom);
      return;
    }
    
    setIsNotFound(true);
  }, [params.id]);

  const localUserId = 'u1';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isNotFound) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-canvas">
        <h1 className="font-serif text-[24px] text-ink mb-4">Room not found</h1>
        <Link href="/" className="font-mono text-[14px] text-ink hover:text-ink-muted underline underline-offset-4">
          ← Back to StudyHall
        </Link>
      </div>
    );
  }

  if (!roomData) {
    return null;
  }

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-canvas">
      {!currentUser && (
        <DisplayNameModal 
          onComplete={(name) => {
            try {
              const stored = localStorage.getItem('studyhall_current_user');
              if (stored) {
                setCurrentUser(JSON.parse(stored));
              }
            } catch (e) {}
          }} 
        />
      )}
      
      <RoomNavbar 
        roomName={roomData.name} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <div className="flex-1 flex flex-row mt-[52px] h-[calc(100vh-52px)] relative">
        <style>{`
          @keyframes blinkCursor {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>
        
        <div className="absolute top-4 right-4 z-10">
          {livekitToken === null && tokenError === null && (
            <div className="px-3 py-1 flex items-center gap-1 rounded-full shadow-sm" style={{ background: '#EAE6DF', border: '1px solid #2D2A26' }}>
              <span className="font-mono text-[11px] text-[#2D2A26]">Connecting...</span>
              <span style={{ animation: 'blinkCursor 1s infinite alternate', width: '6px', height: '11px', background: '#2D2A26', display: 'inline-block' }}></span>
            </div>
          )}
          {livekitToken !== null && showReady && (
            <div className="px-3 py-1 rounded-full shadow-sm" style={{ background: '#7A8B76', border: '1px solid #2D2A26' }}>
              <span className="font-mono text-[11px] text-[#F4F0EB]">Ready</span>
            </div>
          )}
          {tokenError !== null && (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full shadow-sm" style={{ background: '#BC6C4F', border: '1px solid #2D2A26' }}>
                <span className="font-mono text-[11px] text-[#F4F0EB]">{tokenError}</span>
              </div>
              <button 
                onClick={() => {
                  setTokenError(null);
                  if (roomData && currentUser) {
                    fetchToken(roomData.id, currentUser.displayName);
                  }
                }}
                className="font-mono text-[11px] text-ink underline underline-offset-2 hover:text-ink-muted"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {livekitToken ? (
          <LiveKitRoom
            token={livekitToken}
            serverUrl={livekitUrl}
            connect={true}
            audio={true}
            video={true}
            onDisconnected={() => router.push('/')}
            style={{ height: '100%', display: 'contents' }}
          >
            {/* Main Column */}
            <div className="flex-1 relative flex flex-col items-center justify-center">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <span className="font-mono text-[10px] bg-ink text-white px-2 py-0.5 w-fit">{roomData.examTag}</span>
                <span className="font-sans text-[12px] text-ink bg-canvas/80 px-1 backdrop-blur-sm rounded">{roomData.topic}</span>
              </div>

              <VideoGrid />
              <MediaControls />
            </div>

            {/* Sidebar */}
            <div 
              className={`
                fixed inset-0 z-40 top-[52px] bg-canvas flex flex-col border-l-0 border-ink md:static md:w-[320px] md:min-w-[320px] md:border-l md:z-0
                transition-transform duration-300
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
              `}
            >
              <PomodoroTimer />
              <div className="flex-1 min-h-0">
                <ChatSidebar roomId={roomData.id} />
              </div>
            </div>
          </LiveKitRoom>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="px-3 py-1 flex items-center gap-1 rounded-full shadow-sm" style={{ background: '#EAE6DF', border: '1px solid #2D2A26' }}>
              <span className="font-mono text-[11px] text-[#2D2A26]">Connecting...</span>
              <span style={{ animation: 'blinkCursor 1s infinite alternate', width: '6px', height: '11px', background: '#2D2A26', display: 'inline-block' }}></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
