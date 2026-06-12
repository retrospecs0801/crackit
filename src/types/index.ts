export type ExamTag = 'JEE' | 'NEET' | 'UPSC' | 'CBSE' | 'CAT' | 'OTHER';

export type User = {
  id: string;
  displayName: string;
  avatarInitials: string;
  avatarColor: string;
};

export type Room = {
  id: string;
  name: string;
  examTag: ExamTag;
  topic: string;
  description: string;
  maxStudents: number;
  currentStudents: number;
  members: User[];
  ownerId: string;
  createdAt: string;
  isMock?: boolean;
};

export type Message = {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: string; // formatted as "HH:MM AM/PM"
};
