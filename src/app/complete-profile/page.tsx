'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAvatarColor } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { createUserProfile } from '@/lib/messaging';

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') ?? '/';

  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setUserId(user.id);
      const googleName =
        user.user_metadata?.full_name || user.user_metadata?.name || '';
      const gAvatar =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      setDisplayName(googleName);
      setGoogleAvatarUrl(gAvatar);
      setLoading(false);
    }

    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    if (!userId) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    let duplicate = false;
    const { data: isAvailable, error: rpcError } = await supabase.rpc('check_display_name_available', {
      check_name: trimmed,
      exclude_user_id: userId,
    });

    if (!rpcError && typeof isAvailable === 'boolean') {
      duplicate = !isAvailable;
    } else {
      const { data: dupData } = await supabase
        .from('profiles')
        .select('id')
        .ilike('display_name', trimmed)
        .neq('id', userId)
        .maybeSingle();
      duplicate = !!dupData;
    }

    if (duplicate) {
      setError('This display name is already taken by another student. Please choose a unique display name.');
      setSubmitting(false);
      return;
    }

    const initials = trimmed.substring(0, 2).toUpperCase();
    const color = getAvatarColor(trimmed);

    try {
      await createUserProfile({
        id: userId,
        display_name: trimmed,
        avatar_url: googleAvatarUrl,
        avatar_initials: initials,
        avatar_color: color,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile.';
      setError(msg);
      setSubmitting(false);
      return;
    }

    // Cache in localStorage for immediate client UI access
    try {
      localStorage.setItem(
        'studyhall_current_user',
        JSON.stringify({
          id: userId,
          displayName: trimmed,
          avatarInitials: initials,
          avatarColor: color,
          avatarUrl: googleAvatarUrl,
        })
      );
      localStorage.setItem('studyhall_display_name', trimmed);
    } catch {}

    router.push(nextUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#18181B] text-[#F4F0EB] font-sans">
        <span className="font-mono text-[14px]">Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#18181B] px-4">
      <div
        className="w-full max-w-md rounded-2xl p-8 border"
        style={{
          backgroundColor: 'var(--card-bg, #222226)',
          borderColor: 'var(--card-border, #2E2E33)',
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7A8B76]"></div>
          <h1 className="font-sans font-bold text-[22px] text-text-primary">
            Complete your profile
          </h1>
        </div>

        <p className="font-sans text-[13px] text-text-secondary mb-6">
          Welcome to CrackIt! How should other students see you in study rooms?
        </p>

        <div className="flex justify-center mb-6">
          <Avatar
            name={displayName || 'Student'}
            avatarUrl={googleAvatarUrl}
            sizeClassName="w-20 h-20 text-[24px] shadow-sm"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block font-sans font-semibold text-[12px] text-text-primary mb-2 uppercase tracking-wide">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              maxLength={30}
              required
              className="w-full border border-border-default bg-surface rounded-lg font-sans text-[14px] px-3 h-[42px] text-text-primary outline-none focus:border-[#7A8B76] transition-all"
            />
          </div>

          {error && (
            <p className="font-mono text-[12px] text-[#BC6C4F]">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[44px] bg-[#7A8B76] text-[#F4F0EB] rounded-lg font-sans font-semibold text-[13px] hover:opacity-90 transition-all disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Continue to CrackIt'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#18181B] text-[#F4F0EB] font-sans">
          <span className="font-mono text-[14px]">Loading...</span>
        </div>
      }
    >
      <CompleteProfileForm />
    </Suspense>
  );
}
