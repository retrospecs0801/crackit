import { createClient } from '@/lib/supabase/client';
import { StudyStatsData } from '@/types';

export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export async function logRoomJoin(userId: string, roomId: string): Promise<boolean> {
  try {
    const todayStr = formatLocalDate(new Date());
    const sessionKey = `studyhall_joined_${userId}_${roomId}_${todayStr}`;
    
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
      return true;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('room_joins')
      .insert({
        user_id: userId,
        room_id: roomId,
      });

    if (error) {
      console.error('Error inserting room join:', error.message);
      return false;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, '1');
    }
    return true;
  } catch (err) {
    console.error('Failed to log room join:', err);
    return false;
  }
}

export function computeStudyStats(
  joins: { joined_at: string }[],
  referenceDate?: Date
): StudyStatsData {
  const activityMap: Record<string, number> = {};

  for (const join of joins) {
    const d = new Date(join.joined_at);
    if (!isNaN(d.getTime())) {
      const key = formatLocalDate(d);
      activityMap[key] = (activityMap[key] || 0) + 1;
    }
  }

  const activeDaysList = Object.keys(activityMap).sort();
  const totalActiveDays = activeDaysList.length;

  const today = referenceDate || new Date();
  const todayStr = formatLocalDate(today);
  const yesterday = new Date(today.getTime() - 86400000);
  const yesterdayStr = formatLocalDate(yesterday);

  let currentStreak = 0;
  let startCheckingDate: Date | null = null;

  if (activityMap[todayStr] && activityMap[todayStr] > 0) {
    startCheckingDate = today;
  } else if (activityMap[yesterdayStr] && activityMap[yesterdayStr] > 0) {
    startCheckingDate = yesterday;
  }

  if (startCheckingDate) {
    let checkDate = new Date(startCheckingDate);
    while (true) {
      const dateStr = formatLocalDate(checkDate);
      if (activityMap[dateStr] && activityMap[dateStr] > 0) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  let longestStreak = currentStreak;
  if (activeDaysList.length > 0) {
    let runningStreak = 1;
    let maxRun = 1;

    for (let i = 1; i < activeDaysList.length; i++) {
      const prevDate = parseLocalDate(activeDaysList[i - 1]);
      const currDate = parseLocalDate(activeDaysList[i]);
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / 86400000
      );

      if (diffDays === 1) {
        runningStreak++;
        if (runningStreak > maxRun) {
          maxRun = runningStreak;
        }
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    longestStreak = Math.max(maxRun, currentStreak);
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    activityMap,
  };
}

export async function fetchUserStudyStats(userId: string): Promise<StudyStatsData> {
  try {
    const supabase = createClient();
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('room_joins')
      .select('joined_at')
      .eq('user_id', userId)
      .gte('joined_at', oneYearAgo);

    if (error) {
      console.error('Error fetching room joins:', error.message);
      return computeStudyStats([]);
    }

    return computeStudyStats(data || []);
  } catch (err) {
    console.error('Failed to fetch user study stats:', err);
    return computeStudyStats([]);
  }
}
