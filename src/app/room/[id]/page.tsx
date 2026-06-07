'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoomNavbar } from '@/components/layout/RoomNavbar';
import { PomodoroTimer } from '@/components/room/PomodoroTimer';
import { ChatSidebar } from '@/components/room/ChatSidebar';
import { VideoGrid } from '@/components/room/VideoGrid';
import { MediaControls } from '@/components/room/MediaControls';
import { mockRooms } from '@/lib/mockData';
import { getRoomFromStorage, getAvatarColor } from '@/lib/utils';
import { Room, User } from '@/types';
import { DisplayNameModal } from '@/components/room/DisplayNameModal';

export default function RoomPage({ params }: { params: { id: string } }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

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
        
        {/* Main Column */}
        <div className="flex-1 relative flex flex-col items-center justify-center">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
            <span className="font-mono text-[10px] bg-ink text-white px-2 py-0.5 w-fit">{roomData.examTag}</span>
            <span className="font-sans text-[12px] text-ink bg-canvas/80 px-1 backdrop-blur-sm rounded">{roomData.topic}</span>
          </div>

          <VideoGrid 
            count={roomData.maxStudents}
            members={currentUser ? [currentUser, ...roomData.members.filter(m => m.id !== currentUser.id)] : roomData.members} 
            ownerId={roomData.ownerId} 
            localUserId={currentUser?.id || localUserId}
            localMediaState={{ isMuted, isCamOff }}
          />
          <MediaControls 
            isMuted={isMuted} 
            isCamOff={isCamOff} 
            onToggleMute={() => setIsMuted(!isMuted)}
            onToggleCam={() => setIsCamOff(!isCamOff)}
          />
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

      </div>
    </div>
  );
}
