import { Room } from '@/types';
import { RoomCard } from './RoomCard';

interface RoomGridProps {
  rooms: Room[];
  onCreateRoom?: () => void;
}

export function RoomGrid({ rooms, onCreateRoom }: RoomGridProps) {
  if (rooms.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <h3 className="font-serif text-[18px] text-ink mb-1">No rooms open right now.</h3>
        <p className="font-sans text-[13px] text-ink-muted">
          Be the first to start one.{' '}
          {onCreateRoom && (
            <button 
              onClick={onCreateRoom}
              className="text-ink hover:underline font-medium"
            >
              Create Room →
            </button>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
