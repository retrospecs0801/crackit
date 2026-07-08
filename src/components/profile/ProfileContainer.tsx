'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { StudyStats } from '@/components/profile/StudyStats';
import { Profile, StudyStatsData } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { fetchUserStudyStats } from '@/lib/supabase/stats';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ProfileContainerProps {
  targetUserId?: string;
}

export function ProfileContainer({ targetUserId }: ProfileContainerProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<StudyStatsData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);
        }

        const idToFetch = targetUserId || user?.id;

        if (!idToFetch) {
          setError('User not signed in or user ID missing.');
          setLoading(false);
          return;
        }

        const { data: fetched, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', idToFetch)
          .single();

        if (dbError || !fetched) {
          setError('Profile not found.');
        } else {
          setProfile(fetched as Profile);
          const fetchedStats = await fetchUserStudyStats(idToFetch);
          setStats(fetchedStats);
        }
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUserId]);

  const isOwnProfile = Boolean(
    profile && currentUserId && profile.id === currentUserId
  );

  return (
    <div className="min-h-screen flex flex-col pt-[56px] bg-canvas text-text-primary">
      <Navbar onCreateRoom={() => router.push('/')} />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Back to StudyHall
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-text-secondary" />
          </div>
        ) : error || !profile ? (
          <div
            className="w-full max-w-lg rounded-2xl p-8 border text-center shadow-sm"
            style={{
              backgroundColor: 'var(--card-bg, #FFFFFF)',
              borderColor: 'var(--card-border, #E5E2DA)',
            }}
          >
            <h2 className="font-serif font-bold text-xl text-text-primary mb-2">
              {error || 'Profile Not Found'}
            </h2>
            <Link
              href="/"
              className="font-sans text-xs font-semibold text-accent-green hover:underline"
            >
              Return to Home
            </Link>
          </div>
        ) : isEditing && isOwnProfile ? (
          <ProfileEditForm
            profile={profile}
            onSave={(updated) => {
              setProfile(updated);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <ProfileView
              profile={profile}
              isOwnProfile={isOwnProfile}
              onEditClick={() => setIsEditing(true)}
            />
            {stats && <StudyStats stats={stats} />}
          </div>
        )}
      </main>
    </div>
  );
}
