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
import VideoGrid from '@/components/room/VideoGrid';
import MediaControls from '@/components/room/MediaControls';
import { RoomParticipantSidebar } from '@/components/room/RoomParticipantSidebar';
import { EyeOff, LayoutGrid, Loader2, ShieldAlert } from 'lucide-react';
import { useConnectionState } from '@livekit/components-react';
import { mockRooms } from '@/lib/mockData';

function RoomConnectionStatus({ roomName, examTag }: { roomName: string; examTag: string }) {
  const connectionState = useConnectionState();

  if (connectionState === 'connecting' || connectionState === 'disconnected') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-canvas/90 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-surface border border-border-default shadow-2xl max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-accent-green/10 border border-accent-green flex items-center justify-center text-accent-green animate-pulse">
            <Loader2 className="animate-spin" size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-border-default text-text-secondary self-center">
              {examTag}
            </span>
            <h3 className="font-sans text-lg font-bold text-text-primary mt-1">
              Joining {roomName}...
            </h3>
            <p className="font-sans text-xs text-text-secondary">
              Connecting audio, video & study tools via LiveKit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
import { getAvatarColor } from '@/lib/utils';
import { logRoomJoin } from '@/lib/supabase/stats';
import { Room, User } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { GoogleSignInModal } from '@/components/auth/GoogleSignInModal';

export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showVideoGrid, setShowVideoGrid] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [isNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'focus' | 'apps'>('focus');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showReady, setShowReady] = useState(true);

  async function fetchToken(roomId: string, user: User) {
    setTokenError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setTokenError('Connection timed out after 12 seconds. Please check your network and retry.');
    }, 12000);

    try {
      const query = new URLSearchParams({
        roomName: roomId,
        participantName: user.displayName,
        userId: user.id,
      });
      if (user.avatarUrl) query.set('avatarUrl', user.avatarUrl);
      if (user.avatarColor) query.set('avatarColor', user.avatarColor);
      if (user.avatarInitials) query.set('avatarInitials', user.avatarInitials);

      const res = await fetch(
        `/api/livekit-token?${query.toString()}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Token fetch failed');
      }
      const data = await res.json();
      setLivekitToken(data.token);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setTokenError((prev) => prev || 'Connection timed out after 12 seconds. Please check your network and retry.');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Could not connect to room.';
      setTokenError(msg);
    }
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAuthModalOpen(true);
        // Fallback check localStorage if testing without live Supabase session
        try {
          const stored = localStorage.getItem('studyhall_current_user');
          if (stored) {
            setCurrentUser(JSON.parse(stored));
          }
        } catch {}
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const displayName = profile?.display_name || user.user_metadata?.full_name || 'Student';
      const userObj: User = {
        id: user.id,
        displayName,
        avatarInitials: profile?.avatar_initials || displayName.substring(0, 2).toUpperCase(),
        avatarColor: profile?.avatar_color || getAvatarColor(displayName),
      };

      setCurrentUser(userObj);
      try {
        localStorage.setItem('studyhall_current_user', JSON.stringify(userObj));
      } catch {}
    };

    checkAuthAndProfile();
  }, []);

  useEffect(() => {
    const fetchRoom = async () => {
      // 1. Check sessionStorage first — available immediately for the room creator
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
      
      // 3. Check Supabase rooms table
      try {
        const supabase = createClient();
        const { data: dbRoom } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', params.id)
          .single();

        if (dbRoom) {
          setRoomData({
            id: dbRoom.id,
            name: dbRoom.name,
            examTag: dbRoom.exam_tag,
            topic: dbRoom.topic || '',
            description: dbRoom.description || '',
            maxStudents: dbRoom.max_students || 6,
            currentStudents: 1,
            members: [],
            owner_id: dbRoom.owner_id,
            ownerId: dbRoom.owner_id,
            createdAt: dbRoom.created_at,
            isMock: false,
          });
          return;
        }
      } catch (e) {
        console.warn('Could not fetch room from Supabase:', e);
      }

      // 4. Fetch from LiveKit API (for users joining via shared link)
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
      
      // 5. Fallback for unknown rooms
      const fallbackRoom: Room = {
        id: params.id,
        name: `Room ${params.id.substring(0, 8)}`,
        examTag: 'OTHER',
        topic: 'Joined via link',
        description: 'A room joined via shared link.',
        maxStudents: 10,
        currentStudents: 1,
        members: [],
        owner_id: 'unknown',
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
      fetchToken(roomData.id, currentUser).then(cleanup => {
        abortFn = cleanup ?? null;
      });
    }
    
    return () => {
      if (abortFn) abortFn();
    };
  }, [roomData, currentUser, livekitToken]);

  useEffect(() => {
    if (livekitToken) {
      const timer = setTimeout(() => setShowReady(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [livekitToken]);

  useEffect(() => {
    if (livekitToken && currentUser?.id && roomData?.id) {
      logRoomJoin(currentUser.id, roomData.id);
    }
  }, [livekitToken, currentUser, roomData]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isOwner = Boolean(
    currentUser && roomData && (
      currentUser.id === roomData.owner_id ||
      currentUser.id === roomData.ownerId
    )
  );

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
    <>
      <div className="h-screen w-full overflow-hidden flex flex-col bg-canvas text-text-primary">
        <RoomNavbar 
          roomName={roomData.name} 
          currentUserId={currentUser?.id}
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
              <div className="px-3 py-1 flex items-center gap-1 rounded-full shadow-sm bg-surface border border-border-default">
                <span className="font-mono text-[11px] text-text-secondary">Connecting...</span>
                <span style={{ animation: 'blinkCursor 1s infinite alternate', width: '6px', height: '11px', background: 'var(--text-secondary)', display: 'inline-block' }}></span>
              </div>
            )}
            {livekitToken !== null && showReady && (
              <div className="px-3 py-1 rounded-full shadow-sm bg-accent-green text-surface-raised border border-border-default">
                <span className="font-mono text-[11px]">Ready</span>
              </div>
            )}
            {tokenError !== null && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full shadow-sm bg-accent-terracotta text-surface-raised border border-border-default">
                  <span className="font-mono text-[11px]">{tokenError}</span>
                </div>
                <button 
                  onClick={() => {
                    setTokenError(null);
                    if (roomData && currentUser) {
                      fetchToken(roomData.id, currentUser);
                    }
                  }}
                  className="font-mono text-[11px] text-text-primary underline underline-offset-2 hover:text-text-secondary"
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
              audio={false}
              video={false}
              onDisconnected={() => router.push('/')}
              style={{ height: '100%', display: 'contents' }}
            >
              <RoomConnectionStatus roomName={roomData.name} examTag={roomData.examTag} />

              {/* Left Participant Avatars Dock */}
              <RoomParticipantSidebar
                showVideoGrid={showVideoGrid}
                onToggleVideoGrid={() => setShowVideoGrid(!showVideoGrid)}
                ownerId={roomData.owner_id || roomData.ownerId}
                currentUserId={currentUser?.id}
                roomName={roomData.id}
                isRoomOwner={isOwner}
              />

              {/* Main Column */}
              <div className="flex-1 relative flex flex-col items-center justify-between p-4 overflow-hidden bg-canvas">
                {/* Main Study Stage Window Container */}
                <div className="w-full flex-1 relative rounded-2xl border border-border-default bg-surface shadow-2xl overflow-hidden flex flex-col">
                  {/* Top Overlay Badge */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="font-mono text-[11px] bg-surface-raised text-text-primary border border-border-default px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm">
                      {roomData.examTag}
                    </span>
                    {roomData.topic && (
                      <span className="font-sans text-xs text-text-secondary bg-surface-raised/80 backdrop-blur-md px-2.5 py-0.5 border border-border-default rounded-md shadow-sm">
                        {roomData.topic}
                      </span>
                    )}
                  </div>

                  {/* Stage Content: Video Grid OR Ambient Background */}
                  <div className="w-full flex-1 p-4 overflow-hidden flex flex-col justify-center">
                    {showVideoGrid ? (
                      <VideoGrid
                        currentUserId={currentUser?.id}
                        roomName={roomData.id}
                        isRoomOwner={isOwner}
                        ownerId={roomData.owner_id || roomData.ownerId}
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl border border-border-default bg-gradient-to-br from-surface via-canvas to-surface-raised flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-default)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-default)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

                        <div className="relative z-10 max-w-md bg-surface-raised/90 border border-border-default backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-2xl">
                          <div className="w-14 h-14 rounded-2xl bg-surface border border-border-default flex items-center justify-center text-accent-green shadow-inner">
                            <EyeOff size={26} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <h3 className="font-sans text-lg font-bold text-text-primary tracking-tight">
                              Ambient Study Mode
                            </h3>
                            <p className="font-sans text-xs text-text-secondary leading-relaxed">
                              Video screens are hidden for deep focus. Audio, timers, and chat remain connected and active.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowVideoGrid(true)}
                            className="mt-2 px-4 py-2 rounded-xl bg-surface hover:bg-surface-raised border border-border-default text-xs font-medium text-text-primary transition-colors flex items-center gap-2"
                          >
                            <LayoutGrid size={14} />
                            <span>Show Video Cards</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Bottom Controls Pill */}
                <div className="pt-4 shrink-0 z-20">
                  <MediaControls />
                </div>
              </div>

              {/* Sidebar */}
              <div 
                className={`
                  fixed inset-0 z-40 top-[52px] flex flex-col md:static md:w-[300px] md:min-w-[300px] md:z-0
                  transition-transform duration-300 bg-surface border-l border-border-default
                  ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}
              >
                {/* Tab Bar */}
                <div className="flex w-full shrink-0 px-2 py-1 h-[44px] border-b border-border-default bg-surface">
                  <button
                    onClick={() => setActiveTab('focus')}
                    className="flex-1 flex items-center justify-center font-sans text-[13px] transition-all duration-150 rounded-[6px]"
                    style={{
                      color: activeTab === 'focus' ? 'var(--tab-active-text)' : 'var(--tab-inactive-text)',
                      backgroundColor: activeTab === 'focus' ? 'var(--tab-active-bg)' : 'transparent',
                    }}
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => setActiveTab('apps')}
                    className="flex-1 flex items-center justify-center font-sans text-[13px] transition-all duration-150 rounded-[6px]"
                    style={{
                      color: activeTab === 'apps' ? 'var(--tab-active-text)' : 'var(--tab-inactive-text)',
                      backgroundColor: activeTab === 'apps' ? 'var(--tab-active-bg)' : 'transparent',
                    }}
                  >
                    Apps
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
                  {/* Focus Tab */}
                  <div
                    className="absolute inset-0 flex flex-col"
                    style={{ display: activeTab === 'focus' ? 'flex' : 'none' }}
                  >
                    <div className="bg-surface-raised rounded-lg border border-border-default m-3 p-4">
                      <PomodoroTimer isOwner={isOwner} currentUserId={currentUser?.id || currentUser?.displayName || ''} />
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col justify-center px-3 pb-3">
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
          ) : tokenError ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-canvas p-6 z-50">
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-surface border border-border-default shadow-2xl max-w-md text-center">
                <div className="w-12 h-12 rounded-full bg-accent-terracotta/10 border border-accent-terracotta flex items-center justify-center text-accent-terracotta">
                  <ShieldAlert size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-sans text-lg font-bold text-text-primary">
                    Connection Failed
                  </h3>
                  <p className="font-sans text-xs text-text-secondary">
                    {tokenError}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => {
                      setTokenError(null);
                      if (roomData && currentUser) {
                        fetchToken(roomData.id, currentUser);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-text-primary text-surface-raised font-sans text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Retry Connection
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 rounded-lg border border-border-default text-text-primary font-sans text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    ← Back to StudyHall
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-canvas p-6 z-50">
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-surface border border-border-default shadow-2xl max-w-sm text-center">
                <div className="w-12 h-12 rounded-full bg-accent-green/10 border border-accent-green flex items-center justify-center text-accent-green animate-pulse">
                  <Loader2 className="animate-spin" size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-border-default text-text-secondary self-center">
                    {roomData.examTag}
                  </span>
                  <h3 className="font-sans text-lg font-bold text-text-primary mt-1">
                    Joining {roomData.name}...
                  </h3>
                  <p className="font-sans text-xs text-text-secondary">
                    Retrieving secure access token...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <GoogleSignInModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={`/room/${params.id}`}
        message="Sign in with Google to enter this study room."
      />
    </>
  );
}
