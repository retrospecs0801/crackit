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
  topic?: string;
  description?: string;
  maxStudents: number;
  currentStudents: number;
  members: User[];
  owner_id: string;
  ownerId?: string;
  createdAt: string;
  isMock?: boolean;
  welcomeMessageEnabled?: boolean;
  welcomeMessageText?: string;
  micDisabled?: boolean;
  cameraDisabled?: boolean;
  chatDisabled?: boolean;
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
