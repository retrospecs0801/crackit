import { User } from '@/types';
import { VideoTile } from './VideoTile';

interface VideoGridProps {
  count: number;
  members: User[];
  ownerId: string;
  localUserId: string;
  localMediaState: {
    isMuted: boolean;
    isCamOff: boolean;
  };
}

export function VideoGrid({ count, members, ownerId, localUserId, localMediaState }: VideoGridProps) {
  const getGridClass = (c: number) => {
    if (c === 1) return 'grid-cols-1 max-w-[800px] mx-auto';
    if (c === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (c <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 md:grid-cols-4 lg:grid-cols-4';
  };

  return (
    <div className="w-full h-full p-4 flex items-center justify-center overflow-y-auto hide-scrollbar pb-[100px]">
      <div className={`w-full max-w-6xl grid gap-4 ${getGridClass(count)}`}>
        {Array.from({ length: count }).map((_, index) => {
          const member = members[index];
          if (member) {
            const isLocal = member.id === localUserId;
            return (
              <VideoTile
                key={member.id}
                user={member}
                seatNumber={index + 1}
                isOwner={member.id === ownerId}
                isMuted={isLocal ? localMediaState.isMuted : undefined}
                isCamOff={isLocal ? localMediaState.isCamOff : undefined}
              />
            );
          } else {
            return (
              <div 
                key={`empty-${index}`} 
                data-seat={index + 1}
                className="w-full bg-video-bg border border-ink aspect-video flex flex-col items-center justify-center opacity-40 border-dashed"
              >
                <div className="font-mono text-ink text-[12px]">Empty Seat</div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
