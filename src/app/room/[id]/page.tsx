'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { RoomNavbar } from '@/components/layout/RoomNavbar';
import { PomodoroTimer } from '@/components/room/PomodoroTimer';
import { ChatSidebar } from '@/components/room/ChatSidebar';
import { AppsTray } from '@/components/room/AppsTray';
import  VideoGrid  from '@/components/room/VideoGrid';
import  MediaControls  from '@/components/room/MediaControls';
import { mockRooms } from '@/lib/mockData';
import { getAvatarColor } from '@/lib/utils';
import { Room, User } from '@/types';
import { DisplayNameModal } from '@/components/room/DisplayNameModal';

export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'focus' | 'apps'>('focus');

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
    try {
      const stored = localStorage.getItem('studyhall_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && !parsed.avatarColor) {
          parsed.avatarColor = getAvatarColor(parsed.displayName);
          parsed.avatarInitials = parsed.displayName.substring(0, 2).toUpperCase();
          localStorage.setItem('studyhall_current_user', JSON.stringify(parsed));
        }
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const fetchRoom = async () => {
      // 1. Check sessionStorage first — available immediately for the room creator
      //    without racing against LiveKit API propagation delay
      try {
        const cached = sessionStorage.getItem(`crackit_room_${params.id}`);
        if (cached) {
          setRoomData(JSON.parse(cached));
          return;
        }
      } catch {}

      // 2. Check mock rooms
      const mockRoom = mockRooms.find(r => r.id === params.id);
      if (mockRoom) {
        setRoomData(mockRoom);
        return;
      }
      
      // 3. Fetch from LiveKit API (for users joining via shared link)
      try {
        const res = await fetch('/api/rooms');
        if (res.ok) {
          const liveRooms: Room[] = await res.json();
          const found = liveRooms.find(r => r.id === params.id);
          if (found) {
            setRoomData(found);
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching live rooms:', e);
      }
      
      // 4. Fallback for unknown rooms (joined via link before any participant joined)
      const fallbackRoom: Room = {
        id: params.id,
        name: `Room ${params.id.substring(0, 8)}`,
        examTag: 'OTHER',
        topic: 'Joined via link',
        description: 'A room joined via shared link.',
        maxStudents: 10,
        currentStudents: 1,
        members: [],
        ownerId: 'unknown',
        createdAt: new Date().toISOString()
      };
      
      setRoomData(fallbackRoom);
    };

    fetchRoom();
  }, [params.id]);

  useEffect(() => {
    let abortFn: (() => void) | null = null;
    
    if (roomData && currentUser && !livekitToken) {
      fetchToken(roomData.id, currentUser.displayName).then(cleanup => {
        abortFn = cleanup ?? null;
      });
    }
    
    return () => {
      if (abortFn) abortFn();
    };
  }, [roomData, currentUser, livekitToken]);

  useEffect(() => {
    if (livekitToken) {
      console.log('[StudyHall] LiveKit token ready:', livekitToken.substring(0, 30) + '...');
      const timer = setTimeout(() => setShowReady(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [livekitToken]);

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
    <div className="h-screen w-full overflow-hidden flex flex-col bg-[#18181B]">
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
            <div className="flex-1 relative flex flex-col items-center justify-between pb-6">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <span className="font-mono text-[10px] bg-ink text-white px-2 py-0.5 w-fit">{roomData.examTag}</span>
                <span className="font-sans text-[12px] text-ink bg-canvas/80 px-1 backdrop-blur-sm rounded">{roomData.topic}</span>
              </div>

              <div className="w-full flex-1 p-4 pb-0 overflow-hidden flex flex-col justify-center">
                <VideoGrid />
              </div>
              
              <div className="pt-4 shrink-0">
                <MediaControls />
              </div>
            </div>

            {/* Sidebar */}
            <div 
              className={`
                fixed inset-0 z-40 top-[52px] flex flex-col md:static md:w-[300px] md:min-w-[300px] md:z-0
                transition-transform duration-300
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
              `}
              style={{ backgroundColor: '#111113', borderLeft: '1px solid #1E1E21' }}
            >
              {/* Tab Bar */}
              <div className="flex w-full shrink-0 px-2 py-1" style={{ height: '44px', borderBottom: '1px solid #1E1E21', backgroundColor: '#111113' }}>
                <button
                  onClick={() => setActiveTab('focus')}
                  className="flex-1 flex items-center justify-center font-sans text-[13px] transition-all duration-150 rounded-[6px]"
                  style={{
                    color: activeTab === 'focus' ? '#E8E8E8' : '#888888',
                    backgroundColor: activeTab === 'focus' ? '#27272A' : 'transparent',
                    opacity: activeTab === 'focus' ? 1 : 0.7,
                  }}
                >
                  Focus
                </button>
                <button
                  onClick={() => setActiveTab('apps')}
                  className="flex-1 flex items-center justify-center font-sans text-[13px] transition-all duration-150 rounded-[6px]"
                  style={{
                    color: activeTab === 'apps' ? '#E8E8E8' : '#888888',
                    backgroundColor: activeTab === 'apps' ? '#27272A' : 'transparent',
                    opacity: activeTab === 'apps' ? 1 : 0.7,
                  }}
                >
                  Apps
                </button>
              </div>

              {/* Tab Content — always mounted, hidden via display to preserve timer & chat state */}
              <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
                {/* Focus Tab */}
                <div
                  className="absolute inset-0 flex flex-col"
                  style={{ display: activeTab === 'focus' ? 'flex' : 'none' }}
                >
                  <div style={{ backgroundColor: '#1C1C1F', borderRadius: '8px', border: '1px solid #2A2A2D', margin: '12px', padding: '16px' }}>
                    <PomodoroTimer isOwner={currentUser?.displayName === roomData?.ownerId} currentUserId={currentUser?.displayName ?? ''} />
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col justify-center" style={{ padding: '0 12px 12px' }}>
                    <div className="my-auto h-[60%] min-h-[300px]">
                      <ChatSidebar roomId={roomData.id} />
                    </div>
                  </div>
                </div>
                
                {/* Apps Tab */}
                <div
                  className="absolute inset-0 flex flex-col"
                  style={{ display: activeTab === 'apps' ? 'flex' : 'none' }}
                >
                  <AppsTray roomId={roomData.id} currentUserId={currentUser?.displayName ?? ''} />
                </div>
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
