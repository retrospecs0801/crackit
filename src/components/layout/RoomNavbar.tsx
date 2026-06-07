import Link from 'next/link';
import { MusicPlayer } from '../room/MusicPlayer';

export function RoomNavbar({ roomName, onToggleSidebar }: { roomName: string, onToggleSidebar: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-[52px] bg-canvas border-b border-ink flex items-center justify-between px-6 z-50">
      <div className="flex-1">
        <Link href="/" className="font-sans text-[13px] text-ink hover:underline">
          ← Leave
        </Link>
      </div>
      <div className="flex-1 text-center font-serif text-[18px] truncate px-4">
        {roomName}
      </div>
      <div className="flex-1 flex justify-end items-center gap-4">
        {/* Mobile sidebar toggle button (visible only on small screens) */}
        <button onClick={onToggleSidebar} className="md:hidden font-sans text-[13px] border border-ink px-2 py-1">
          Chat / Timer
        </button>
        <MusicPlayer />
      </div>
    </nav>
  );
}
