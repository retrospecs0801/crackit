'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
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
        topic: String(r.topic || ''),
        description: String(r.description || ''),
        maxStudents: Number(r.max_students || 6),
        currentStudents: 0,
        members: [],
        owner_id: String(r.owner_id || ''),
        ownerId: String(r.owner_id || ''),
        createdAt: String(r.created_at || new Date().toISOString()),
        isMock: false,
      }));

      let liveRooms: Room[] = [];
      try {
        const res = await fetch(`/api/rooms?t=${Date.now()}`, { cache: 'no-store' });
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

  const filteredRooms =
    activeFilter === 'ALL'
      ? allRooms
      : allRooms.filter((r) => r.examTag === activeFilter);

  return (
    <div className="min-h-screen flex flex-col pt-[56px]">
      <Navbar onCreateRoom={() => setIsModalOpen(true)} />

      <main className="flex-1 flex flex-col">
        <HeroBanner />
        <ExamFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <RoomGrid
          rooms={filteredRooms}
          onCreateRoom={() => setIsModalOpen(true)}
        />
      </main>

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
