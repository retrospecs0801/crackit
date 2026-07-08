'use client';

import React from 'react';
import { Profile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Pencil } from 'lucide-react';

interface ProfileViewProps {
  profile: Profile;
  isOwnProfile: boolean;
  onEditClick?: () => void;
}

export function ProfileView({
  profile,
  isOwnProfile,
  onEditClick,
}: ProfileViewProps) {
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    : 'July 2026';

  return (
    <div
      className="w-full max-w-lg mx-auto rounded-2xl p-8 border shadow-sm transition-all"
      style={{
        backgroundColor: 'var(--card-bg, #FFFFFF)',
        borderColor: 'var(--card-border, #E5E2DA)',
      }}
    >
      <div className="flex flex-col items-center text-center">
        {/* Large Avatar */}
        <div className="mb-4 relative">
          <Avatar
            name={profile.display_name}
            avatarUrl={profile.avatar_url}
            avatarInitials={profile.avatar_initials}
            avatarColor={profile.avatar_color}
            sizeClassName="w-28 h-28 text-[36px] shadow-md border-2 border-surface-raised"
          />
        </div>
        <p className="font-sans text-[12px] text-text-secondary mb-5 bg-canvas px-3 py-1 rounded-full border border-border-default">
          Profile picture is same as your Google profile
        </p>

        {/* Name Heading in Fraunces serif */}
        <h1 className="font-serif font-bold text-[28px] text-text-primary mb-1 tracking-tight">
          {profile.display_name}
        </h1>

        {/* Member Since badge */}
        <p className="font-sans text-[13px] text-text-secondary mb-8">
          Member since {memberSince}
        </p>

        {/* Edit Button for own profile */}
        {isOwnProfile && onEditClick && (
          <button
            onClick={onEditClick}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-sans font-semibold text-[13px] transition-all duration-200 shadow-sm border border-border-default hover:opacity-90 hover:shadow-md"
            style={{
              backgroundColor: 'var(--btn-primary-bg, #1C1917)',
              color: 'var(--btn-primary-text, #F4F0EB)',
            }}
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
