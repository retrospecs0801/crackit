import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Room } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarColor(name: string): string {
  const colors = ['#7A8B76', '#BC6C4F', '#6B7FA3', '#8B6F47', '#5B7A6B', '#A3756B'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function saveRoomToStorage(room: Room): void {
  const existing = getRoomsFromStorage();
  const updated = { ...existing, [room.id]: room };
  localStorage.setItem('studyhall_rooms', JSON.stringify(updated));
}

export function getRoomFromStorage(id: string): Room | null {
  try {
    const raw = localStorage.getItem('studyhall_rooms');
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[id] ?? null;
  } catch {
    return null;
  }
}

export function getRoomsFromStorage(): Record<string, Room> {
  try {
    const raw = localStorage.getItem('studyhall_rooms');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
