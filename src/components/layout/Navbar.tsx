'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Sun, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GoogleSignInModal } from '@/components/auth/GoogleSignInModal';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationsBell } from '@/components/layout/NotificationsBell';
import { MessagesButton } from '@/components/messaging/MessagesButton';

export function Navbar({ onCreateRoom }: { onCreateRoom: () => void }) {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    displayName: string;
    avatarInitials: string;
    avatarColor: string;
    avatarUrl?: string | null;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('studyhall_current_user');
        if (cached) return JSON.parse(cached);
      } catch { }
    }
    return null;
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile) {
            let avatarUrl = profile.avatar_url;
            const googlePhoto =
              user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
            if (!avatarUrl && googlePhoto) {
              avatarUrl = googlePhoto;
              try {
                await supabase
                  .from('profiles')
                  .update({ avatar_url: googlePhoto })
                  .eq('id', profile.id);
              } catch { }
            }

            const u = {
              id: profile.id,
              displayName: profile.display_name,
              avatarInitials: profile.avatar_initials,
              avatarColor: profile.avatar_color,
              avatarUrl,
            };
            setCurrentUser(u);
            try {
              localStorage.setItem('studyhall_current_user', JSON.stringify(u));
            } catch { }
          }
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      }
    };

    fetchProfile();

    const supabase = createClient();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setCurrentUser(null);
      localStorage.removeItem('studyhall_current_user');
      window.location.reload();
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const handleCreateRoomClick = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
    } else {
      onCreateRoom();
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-[56px] flex items-center justify-between px-6 z-50 border-b" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--card-border)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" className="flex items-center gap-2 font-sans text-[20px] font-semibold text-text-primary hover:opacity-80 transition-opacity">
          <div className="w-[8px] h-[8px] rounded-full bg-accent-green"></div>
          StudyHall
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Profile Section */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <NotificationsBell userId={currentUser.id} />
              <MessagesButton userId={currentUser.id} />
              <Link
                href="/profile"
                className="flex items-center h-[32px] rounded-full border border-border-default bg-canvas overflow-hidden pr-3 hover:opacity-80 transition-opacity"
              >
                <Avatar
                  name={currentUser.displayName}
                  avatarUrl={currentUser.avatarUrl}
                  avatarInitials={currentUser.avatarInitials}
                  avatarColor={currentUser.avatarColor}
                  sizeClassName="w-[28px] h-[28px] text-[11px]"
                  className="ml-[1px]"
                />
                <span className="font-sans font-medium text-[13px] text-text-primary pl-[8px]">
                  {currentUser.displayName}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full text-text-secondary hover:text-[#BC6C4F] transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="border border-border-strong rounded-full py-[6px] px-[14px] font-sans text-[13px] text-text-primary hover:bg-text-primary hover:text-surface-raised transition-all"
            >
              Sign In
            </button>
          )}

          <button
            onClick={handleCreateRoomClick}
            className="rounded-lg font-sans font-semibold text-[13px] px-4 py-2 hover:opacity-90 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
            style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          >
            Create Room
          </button>
        </div>
      </nav>

      <GoogleSignInModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo="/"
        message="Sign in with Google to create or join study rooms."
      />
    </>
  );
}
