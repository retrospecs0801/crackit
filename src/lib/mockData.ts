import { Room, User, Message } from '@/types';
import { getAvatarColor } from './utils';

const createUser = (id: string, displayName: string): User => ({
  id,
  displayName,
  avatarInitials: displayName.slice(0, 2).toUpperCase(),
  avatarColor: getAvatarColor(displayName),
});

export const mockUsers: User[] = [
  createUser('u1', 'Rahul Sharma'),
  createUser('u2', 'Priya Patel'),
  createUser('u3', 'Amit Kumar'),
  createUser('u4', 'Neha Gupta'),
  createUser('u5', 'Vikram Singh'),
  createUser('u6', 'Anjali Desai'),
  createUser('u7', 'Rohan Verma'),
  createUser('u8', 'Kavya Reddy'),
];

export const mockRooms: Room[] = [
  {
    id: 'r1',
    name: 'JEE Mains Grind',
    examTag: 'JEE Main/Advanced',
    topic: 'Rotational Motion + Electrostatics revision',
    description: 'Strict 25/5 pomodoro sessions. Mics off, cams optional. Let us crush these concepts today.',
    maxStudents: 6,
    currentStudents: 4,
    members: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
    owner_id: 'u1',
    ownerId: 'u1',
    createdAt: '2023-10-27T08:00:00Z',
    isMock: true,
  }
];

export const mockMessages: Record<string, Message[]> = {
  r1: [
    { id: 'm1', userId: 'u1', displayName: 'Rahul Sharma', text: 'Starting the timer now.', timestamp: '10:00 AM' },
    { id: 'm2', userId: 'u2', displayName: 'Priya Patel', text: 'Let\'s go!', timestamp: '10:01 AM' },
    { id: 'm3', userId: 'u3', displayName: 'Amit Kumar', text: 'Is anyone doing HCV?', timestamp: '10:15 AM' },
    { id: 'm4', userId: 'u1', displayName: 'Rahul Sharma', text: 'Yes, after I finish this section.', timestamp: '10:16 AM' },
    { id: 'm5', userId: 'u4', displayName: 'Neha Gupta', text: 'Taking a 5 min break.', timestamp: '10:25 AM' },
    { id: 'm6', userId: 'u1', displayName: 'Rahul Sharma', text: 'Timer paused for break.', timestamp: '10:25 AM' },
  ]
};
