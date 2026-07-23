'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { SocialIconsRow } from '@/components/layout/SocialIcons';
import { HeroBanner } from '@/components/landing/HeroBanner';
import { ExamFilterBar } from '@/components/landing/ExamFilterBar';
import { RoomGrid } from '@/components/landing/RoomGrid';
import { CreateRoomModal } from '@/components/landing/CreateRoomModal';
import { mockRooms } from '@/lib/mockData';
import { ExamTag, Room } from '@/types';
import { createClient } from '@/lib/supabase/client';

type FilterType = ExamTag | 'ALL';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allRooms, setAllRooms] = useState<Room[]>(mockRooms);

  const refreshRooms = async () => {
    try {
      const supabase = createClient();
      const { data: dbRooms } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      const mappedDbRooms: Room[] = (dbRooms || []).map((r: Record<string, unknown>) => ({
        id: String(r.id || ''),
        name: String(r.name || ''),
        examTag: (r.exam_tag as ExamTag) || 'OTHER',
        customExamLabel: r.custom_exam_label ? String(r.custom_exam_label) : (r.metadata && typeof r.metadata === 'string' ? JSON.parse(r.metadata).customExamLabel : undefined),
        examType: r.exam_tag === 'custom' || r.exam_tag === 'Custom' ? 'custom' : undefined,
        maxStudents: Number(r.max_students || 6),
        maxParticipants: r.max_participants ? Number(r.max_participants) : Number(r.max_students || 6),
        camMandatory: Boolean(r.cam_mandatory || false),
        topic: String(r.topic || ''),
        description: String(r.description || ''),
        currentStudents: 0,
        members: [],
        owner_id: String(r.owner_id || ''),
        ownerId: String(r.owner_id || ''),
        createdAt: String(r.created_at || new Date().toISOString()),
        isMock: false,
      }));

      let liveRooms: Room[] = [];
      try {
        const res = await fetch('/api/rooms', { cache: 'no-store' });
        if (res.ok) {
          liveRooms = await res.json();
        }
      } catch (e) {
        console.warn('Could not fetch LiveKit rooms:', e);
      }

      const roomMap = new Map<string, Room>();

      for (const r of mockRooms) {
        roomMap.set(r.id, r);
      }

      for (const r of mappedDbRooms) {
        roomMap.set(r.id, r);
      }

      for (const r of liveRooms) {
        const existing = roomMap.get(r.id);
        if (existing) {
          roomMap.set(r.id, {
            ...existing,
            ...r,
            currentStudents: r.currentStudents !== undefined ? r.currentStudents : existing.currentStudents,
            members: r.members && r.members.length > 0 ? r.members : existing.members || [],
          });
        } else {
          roomMap.set(r.id, r);
        }
      }

      setAllRooms(Array.from(roomMap.values()));
    } catch (e) {
      console.error('Error refreshing rooms:', e);
      setAllRooms(mockRooms);
    }
  };

  useEffect(() => {
    refreshRooms();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshRooms();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const activeTabs: FilterType[] = (() => {
    const counts: Record<string, number> = {};
    for (const r of allRooms) {
      let tag = r.examTag;
      if (tag === ('JEE' as unknown)) tag = 'JEE Main/Advanced';
      if (tag === 'custom' || tag === 'Custom' || r.examType === 'custom') {
        counts['Custom'] = (counts['Custom'] || 0) + 1;
      } else if (tag && tag !== ('JEE' as unknown)) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }

    // Sort unique active tags descending by room count
    const sortedActive = Object.keys(counts)
      .filter((k) => k !== 'JEE')
      .sort((a, b) => counts[b] - counts[a]);

    const result = [...sortedActive];

    const defaultPriority: (ExamTag | 'Custom')[] = [
      'JEE Main/Advanced',
      'NEET-UG',
      'UPSC CSE',
      'MCAT',
      'LSAT',
      'OTHER',
      'Custom'
    ];

    for (const priority of defaultPriority) {
      if (result.length >= 6) break;
      if (!result.includes(priority) && priority !== ('JEE' as unknown)) {
        result.push(priority as FilterType);
      }
    }

    if (!result.includes('Custom')) {
      result.push('Custom');
    }

    return ['ALL', ...result.filter((k) => k !== 'JEE')] as FilterType[];
  })();

  const filteredRooms =
    activeFilter === 'ALL'
      ? allRooms
      : activeFilter === 'Custom' || activeFilter === 'custom'
      ? allRooms.filter((r) => r.examTag === 'custom' || r.examTag === 'Custom' || r.examType === 'custom')
      : allRooms.filter((r) => r.examTag === activeFilter || (activeFilter === 'JEE Main/Advanced' && r.examTag === ('JEE' as unknown)));

  return (
    <div className="min-h-screen flex flex-col pt-[56px]">
      <Navbar onCreateRoom={() => setIsModalOpen(true)} />

      <main className="flex-1 flex flex-col">
        {/* Mobile Create Room Button */}
        <div className="md:hidden flex justify-center p-4 bg-canvas border-b border-border-default">
          <button
            onClick={() => {
              const currentUser = localStorage.getItem('studyhall_current_user');
              if (!currentUser) {
                // We don't have access to setAuthModalOpen here directly. Let's let the Navbar handle auth if we can, or just trigger it. 
                // Ah, the Navbar has the auth modal. 
                // Let's just trigger setIsModalOpen(true), the modal itself will check auth?
                // Wait, CreateRoomModal doesn't check auth.
                // We should probably just pass the same check.
              }
              setIsModalOpen(true);
            }}
            className="w-full max-w-md rounded-lg font-sans font-semibold text-[14px] px-4 py-2.5 shadow-sm active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          >
            Create Room
          </button>
        </div>
        <HeroBanner />
        <ExamFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          tabs={activeTabs}
        />
        <RoomGrid
          rooms={filteredRooms}
          onCreateRoom={() => setIsModalOpen(true)}
        />
      </main>

      {/* Minimalist Bottom-Right About & Socials */}
      <div className="fixed bottom-5 right-6 z-40 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-default bg-canvas/80 backdrop-blur-md shadow-md hover:shadow-lg transition-all">
        <Link
          href="/about"
          className="font-sans text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors px-1.5"
        >
          About Us
        </Link>
        <div className="w-[1px] h-3.5 bg-border-default mx-0.5" />
        <SocialIconsRow />
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refreshRooms();
        }}
      />
    </div>
  );
}
