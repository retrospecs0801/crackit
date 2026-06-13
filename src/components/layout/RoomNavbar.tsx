import Link from 'next/link';
import { MusicPlayer } from '../room/MusicPlayer';

export function RoomNavbar({ roomName, onToggleSidebar }: { roomName: string, onToggleSidebar: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-[52px] bg-[rgba(24,24,27,0.95)] backdrop-blur-[12px] border-b border-[#2A2A2D] flex items-center justify-between px-6 z-50">
      <div className="flex-1">
        <Link href="/" className="font-sans font-medium text-[13px] text-[#71717A] hover:text-[#FAFAF8] transition-colors duration-150">
          ← Leave
        </Link>
      </div>
      <div className="flex-1 text-center font-sans font-semibold text-[15px] text-[#FAFAF8] truncate px-4">
        {roomName}
      </div>
      <div className="flex-1 flex justify-end items-center gap-4">
        {/* Mobile sidebar toggle button (visible only on small screens) */}
        <button onClick={onToggleSidebar} className="md:hidden font-sans text-[13px] text-[#FAFAF8] border border-[#3F3F46] px-2 py-1 rounded">
          Chat / Timer
        </button>
        <MusicPlayer />
      </div>
    </nav>
  );
}
