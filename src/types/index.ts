export type ExamTag =
  | 'JEE Main/Advanced'
  | 'NEET-UG'
  | 'UPSC CSE'
  | 'MCAT'
  | 'LSAT'
  | 'Suneung (CSAT)'
  | 'UCAT'
  | 'USMLE Step 1'
  | 'CFA (All Levels)'
  | 'Abitur'
  | 'CAT'
  | 'GATE'
  | 'BMAT'
  | 'LNAT'
  | 'Civil Service (5,7,9)'
  | 'TestDaF/DSH'
  | 'TMS (Med)'
  | 'Bar Exam'
  | 'NCLEX'
  | 'ENEM'
  | 'OTHER'
  | 'JEE'
  | 'NEET'
  | 'UPSC'
  | 'CBSE';

export type ExamOption = {
  id: ExamTag;
  name: string;
};

export const EXAM_OPTIONS: ExamOption[] = [
  { name: 'JEE Main/Advanced', id: 'JEE Main/Advanced' },
  { name: 'NEET-UG', id: 'NEET-UG' },
  { name: 'UPSC CSE', id: 'UPSC CSE' },
  { name: 'MCAT', id: 'MCAT' },
  { name: 'LSAT', id: 'LSAT' },
  { name: 'Suneung (CSAT)', id: 'Suneung (CSAT)' },
  { name: 'UCAT', id: 'UCAT' },
  { name: 'USMLE Step 1', id: 'USMLE Step 1' },
  { name: 'CFA (All Levels)', id: 'CFA (All Levels)' },
  { name: 'Abitur', id: 'Abitur' },
  { name: 'CAT', id: 'CAT' },
  { name: 'GATE', id: 'GATE' },
  { name: 'BMAT', id: 'BMAT' },
  { name: 'LNAT', id: 'LNAT' },
  { name: 'Civil Service (5,7,9)', id: 'Civil Service (5,7,9)' },
  { name: 'TestDaF/DSH', id: 'TestDaF/DSH' },
  { name: 'TMS (Med)', id: 'TMS (Med)' },
  { name: 'Bar Exam', id: 'Bar Exam' },
  { name: 'NCLEX', id: 'NCLEX' },
  { name: 'ENEM', id: 'ENEM' },
  { name: 'JEE (Short)', id: 'JEE' },
  { name: 'NEET (Short)', id: 'NEET' },
  { name: 'UPSC (Short)', id: 'UPSC' },
  { name: 'CBSE', id: 'CBSE' },
  { name: 'OTHER', id: 'OTHER' },
];

export type User = {
  id: string;
  displayName: string;
  avatarInitials: string;
  avatarColor: string;
  avatarUrl?: string | null;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_initials: string;
  avatar_color: string;
  created_at?: string;
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
  owner_id: string;
  ownerId?: string;
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

export type RoomJoin = {
  id: string;
  user_id: string;
  room_id: string;
  joined_at: string;
};

export type StudyStatsData = {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  activityMap: Record<string, number>; // "YYYY-MM-DD" => count
};

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

export type FriendRequestWithProfile = Friendship & {
  requester: Profile;
};

export type RelationshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';
