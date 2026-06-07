'use client';

import { Room } from '@/types';
import { useRouter } from 'next/navigation';

export function RoomCard({ room }: { room: Room }) {
  const router = useRouter();
  
  const displayMembers = room.members.slice(0, 4);
  const extraMembers = room.members.length - 4;

  const handleJoin = () => {
    router.push(`/room/${room.id}`);
  };

  return (
    <div className="bg-white border border-ink p-4 flex flex-col gap-3 transition-[transform,box-shadow] duration-100 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_var(--color-ink)]">
      
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-serif text-[16px] font-bold text-ink leading-tight flex-1">
          {room.name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-ink-muted"></span>
          <span className="font-mono text-[12px] text-ink shrink-0">
            {room.currentStudents}/{room.maxStudents}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 flex-1">
        <div>
          <span className="font-mono text-[11px] bg-ink-muted text-white px-2 py-0.5 whitespace-nowrap">
            {room.examTag}
          </span>
        </div>
        <p className="font-sans text-[13px] text-ink/70 truncate mt-1">
          {room.topic}
        </p>
        <p className="font-sans text-[12px] text-ink-muted line-clamp-2 leading-relaxed h-9">
          {room.description}
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-ink pt-[10px] mt-1 flex justify-between items-center">
        <div className="flex items-center">
          {displayMembers.map((member, index) => (
            <div
              key={member.id}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] text-white border border-ink overflow-hidden shrink-0 ${
                index > 0 ? '-ml-[6px]' : ''
              }`}
              style={{ backgroundColor: member.avatarColor, zIndex: 10 - index }}
              title={member.displayName}
            >
              {member.avatarInitials}
            </div>
          ))}
          {extraMembers > 0 && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] text-white bg-ink shrink-0 -ml-[6px] border border-ink z-0"
            >
              +{extraMembers}
            </div>
          )}
        </div>
        
        <button
          onClick={handleJoin}
          className="border border-ink bg-transparent text-ink font-sans text-[13px] px-3 py-1 hover:bg-ink hover:text-white transition-colors"
        >
          Join Room
        </button>
      </div>
      
    </div>
  );
}
