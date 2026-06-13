'use client';

import { Room } from '@/types';
import { useRouter } from 'next/navigation';

export function RoomCard({ room }: { room: Room }) {
  const router = useRouter();
  
  const displayMembers = room.members.slice(0, 4);
  const extraMembers = room.members.length - 4;

  const handleJoin = () => {
    if (room.isMock) return;
    router.push(`/room/${room.id}`);
  };

  const getStatusColor = () => {
    const ratio = room.currentStudents / room.maxStudents;
    if (ratio >= 1) return 'var(--accent-terracotta)';
    if (ratio >= 0.5) return '#D97706';
    return 'var(--accent-green)';
  };

  return (
    <div 
      className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[3px] border shadow-sm hover:shadow-hover"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-sans text-[15px] font-semibold text-text-primary leading-tight flex-1">
          {room.name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: getStatusColor() }}></span>
          <span className="font-mono text-[12px] text-text-secondary shrink-0">
            {room.currentStudents}/{room.maxStudents}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 flex-1 mt-1">
        <div>
          <span 
            className="font-sans font-medium text-[11px] rounded-full px-[10px] py-[2px] whitespace-nowrap"
            style={{ 
              backgroundColor: `var(--tag-${room.examTag.toLowerCase()}-bg, var(--border-default))`,
              color: `var(--tag-${room.examTag.toLowerCase()}-text, var(--text-primary))` 
            }}
          >
            {room.examTag}
          </span>
        </div>
        <p className="font-sans font-medium text-[13px] text-text-primary truncate mt-1">
          {room.topic}
        </p>
        <p className="font-sans font-normal text-[12px] text-text-secondary line-clamp-2 leading-relaxed h-9">
          {room.description}
        </p>
      </div>

      {/* Footer */}
      <div className="pt-[12px] mt-1 flex justify-between items-center">
        <div className="flex items-center">
          {displayMembers.map((member, index) => (
            <div
              key={member.id}
              className={`w-[26px] h-[26px] rounded-full flex items-center justify-center font-sans font-semibold text-[10px] text-surface-raised border-[2px] border-surface-raised overflow-hidden shrink-0 ${
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
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-sans font-semibold text-[10px] text-surface-raised bg-text-primary shrink-0 -ml-[6px] border-[2px] border-surface-raised z-0"
            >
              +{extraMembers}
            </div>
          )}
        </div>
        
        <button
          onClick={handleJoin}
          disabled={room.isMock}
          className={`border rounded-[7px] font-sans font-semibold text-[12px] px-[14px] py-[6px] transition-colors duration-200 ${
            room.isMock 
              ? '' 
              : 'bg-transparent border-border-default text-text-primary hover:bg-text-primary hover:text-surface-raised hover:border-text-primary'
          }`}
          style={room.isMock ? { backgroundColor: 'transparent', borderColor: 'var(--btn-demo-border)', color: 'var(--btn-demo-text)' } : {}}
        >
          {room.isMock ? 'Demo Only' : 'Join Room'}
        </button>
      </div>
      
    </div>
  );
}
