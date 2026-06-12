'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroBanner } from '@/components/landing/HeroBanner';
import { ExamFilterBar } from '@/components/landing/ExamFilterBar';
import { RoomGrid } from '@/components/landing/RoomGrid';
import { CreateRoomModal } from '@/components/landing/CreateRoomModal';
import { mockRooms } from '@/lib/mockData';
import { ExamTag, Room } from '@/types';

type FilterType = ExamTag | 'ALL';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allRooms, setAllRooms] = useState<Room[]>(mockRooms);

  const refreshRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const liveRooms = await res.json();
        setAllRooms([...mockRooms, ...liveRooms]);
      } else {
        console.error('Failed to fetch live rooms');
        setAllRooms(mockRooms);
      }
    } catch (e) {
      console.error(e);
      setAllRooms(mockRooms);
    }
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  const filteredRooms = activeFilter === 'ALL' 
    ? allRooms 
    : allRooms.filter(r => r.examTag === activeFilter);

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
