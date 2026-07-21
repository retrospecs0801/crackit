'use client';

import { useState } from 'react';
import { Room } from '@/types';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GoogleSignInModal } from '@/components/auth/GoogleSignInModal';
import { Avatar } from '@/components/ui/Avatar';
import { Loader2, Video } from 'lucide-react';

export function RoomCard({ room }: { room: Room }) {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  
  const displayMembers = room.members.slice(0, 4);
  const extraMembers = room.members.length - 4;

  const maxCapacity = room.maxParticipants ?? room.maxStudents ?? 6;
  const isUnlimited = maxCapacity >= 20;
  const isFull = !isUnlimited && room.currentStudents >= maxCapacity;
  const studentCountText = isUnlimited ? `${room.currentStudents}/∞` : `${room.currentStudents}/${maxCapacity}`;

  const handleJoin = async () => {
    if (room.isMock || isJoining || isFull) return;
    setJoinError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setIsJoining(true);
    try {
      router.push(`/room/${room.id}`);
      // Safety reset after 12s if navigation stalls
      setTimeout(() => {
        setIsJoining(false);
      }, 12000);
    } catch (e) {
      console.error('Failed to navigate:', e);
      setIsJoining(false);
      setJoinError('Failed to join room. Try again.');
    }
  };

  const getStatusColor = () => {
    const ratio = room.currentStudents / maxCapacity;
    if (isFull || ratio >= 1) return 'var(--accent-terracotta)';
    if (ratio >= 0.5) return '#D97706';
    return 'var(--accent-green)';
  };

  const isCustomExam = room.examTag === 'custom' || room.examTag === 'Custom' || room.examType === 'custom';
  const examBadgeText = isCustomExam ? (room.customExamLabel || 'Custom Exam') : room.examTag;

  return (
    <>
      <div 
        className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[3px] border shadow-sm hover:shadow-hover"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        
        {/* Header with Exam Badge & Title */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center gap-2">
            <span 
              className="font-mono text-[11px] font-semibold rounded-full px-2.5 py-0.5 border border-border-default bg-surface-raised text-accent-green inline-block w-fit shadow-xs truncate max-w-[200px]"
            >
              {examBadgeText}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {room.camMandatory && (
                <span title="Camera required (recommended by host)" className="flex items-center gap-1 text-[11px] font-mono text-accent-terracotta bg-accent-terracotta/10 px-1.5 py-0.5 rounded-md border border-accent-terracotta/20">
                  <Video size={12} className="shrink-0" />
                  <span>Cam Req</span>
                </span>
              )}
              <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: getStatusColor() }}></span>
              <span className="font-mono text-[12px] text-text-secondary shrink-0">
                {studentCountText}
              </span>
            </div>
          </div>

          <h3 className="font-sans text-[16px] font-bold text-text-primary leading-tight truncate">
            {room.name}
          </h3>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1 flex-1 mt-0.5">
          {room.topic && (
            <p className="font-sans font-medium text-[13px] text-text-primary truncate">
              {room.topic}
            </p>
          )}
          {room.description && (
            <p className="font-sans font-normal text-[12px] text-text-secondary line-clamp-2 leading-relaxed h-9">
              {room.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-[12px] mt-1 flex justify-between items-center">
          <div className="flex items-center">
            {displayMembers.map((member, index) => (
              <div
                key={member.id}
                style={{ zIndex: 10 - index }}
                className={index > 0 ? '-ml-[6px]' : ''}
              >
                <Avatar
                  name={member.displayName}
                  avatarUrl={member.avatarUrl}
                  avatarInitials={member.avatarInitials}
                  avatarColor={member.avatarColor}
                  sizeClassName="w-[26px] h-[26px] text-[10px]"
                  className="border-[2px] border-surface-raised"
                />
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
          
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleJoin}
              disabled={room.isMock || isJoining || isFull}
              className={`border rounded-[7px] font-sans font-semibold text-[12px] px-[14px] py-[6px] transition-colors duration-200 flex items-center justify-center ${
                room.isMock || isJoining || isFull
                  ? 'opacity-70 cursor-not-allowed'
                  : 'bg-transparent border-border-default text-text-primary hover:bg-text-primary hover:text-surface-raised hover:border-text-primary'
              }`}
              style={room.isMock ? { backgroundColor: 'transparent', borderColor: 'var(--btn-demo-border)', color: 'var(--btn-demo-text)' } : {}}
            >
              {isJoining ? (
                <>
                  <Loader2 className="animate-spin w-3.5 h-3.5 inline mr-1.5" />
                  Joining...
                </>
              ) : isFull ? (
                'Room is Full'
              ) : room.isMock ? (
                'Demo Only'
              ) : (
                'Join Room'
              )}
            </button>
            {joinError && (
              <span className="font-mono text-[10px] text-accent-terracotta">{joinError}</span>
            )}
          </div>
        </div>
        
      </div>

      <GoogleSignInModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={`/room/${room.id}`}
        message="Sign in with Google to join this study room."
      />
    </>
  );
}
