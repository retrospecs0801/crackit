'use client';

import React, { useState, useRef } from 'react';
import { Profile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { createClient } from '@/lib/supabase/client';
import { uploadAvatar } from '@/lib/supabase/storage';
import { Upload, X, Check, Loader2 } from 'lucide-react';

interface ProfileEditFormProps {
  profile: Profile;
  onSave: (updated: Profile) => void;
  onCancel: () => void;
}

export function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile.avatar_url
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const computedInitials =
    displayName.trim().length > 0
      ? displayName.trim().substring(0, 2).toUpperCase()
      : profile.avatar_initials;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUseGooglePhoto = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const googlePhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
    if (googlePhoto) {
      setPreviewUrl(googlePhoto);
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      let newAvatarUrl: string | null = profile.avatar_url;

      if (selectedFile) {
        try {
          newAvatarUrl = await uploadAvatar(profile.id, selectedFile);
        } catch (uploadErr: unknown) {
          const errMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          if (
            errMsg.toLowerCase().includes('not found') ||
            errMsg.toLowerCase().includes('bucket') ||
            errMsg.toLowerCase().includes('storage')
          ) {
            // If the storage bucket is not created, fetch Google account photo as fallback
            const { data: { user } } = await supabase.auth.getUser();
            const gPhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
            newAvatarUrl = gPhoto || profile.avatar_url;
            setError('Notice: Storage bucket not created yet on Supabase. Using your Google profile picture instead.');
          } else {
            throw uploadErr;
          }
        }
      }

      const updatedFields = {
        display_name: displayName.trim(),
        avatar_initials: computedInitials,
        avatar_url: newAvatarUrl,
      };

      const { error: dbError } = await supabase
        .from('profiles')
        .update(updatedFields)
        .eq('id', profile.id);

      if (dbError) {
        throw new Error(dbError.message);
      }

      const updatedProfile: Profile = {
        ...profile,
        ...updatedFields,
      };

      try {
        const userObj = {
          id: updatedProfile.id,
          displayName: updatedProfile.display_name,
          avatarInitials: updatedProfile.avatar_initials,
          avatarColor: updatedProfile.avatar_color,
          avatarUrl: updatedProfile.avatar_url,
        };
        localStorage.setItem('studyhall_current_user', JSON.stringify(userObj));
      } catch { }

      onSave(updatedProfile);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save profile changes';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyles =
    'w-full border border-border-default bg-surface rounded-xl font-sans text-[14px] px-3.5 h-[42px] text-text-primary outline-none focus:border-accent-green transition-all duration-150';

  return (
    <div
      className="w-full max-w-lg mx-auto rounded-2xl p-8 border shadow-sm"
      style={{
        backgroundColor: 'var(--card-bg, #FFFFFF)',
        borderColor: 'var(--card-border, #E5E2DA)',
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif font-bold text-[22px] text-text-primary">
          Edit Profile
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-full text-text-secondary hover:text-text-primary transition-colors"
          title="Cancel"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-xs font-mono"
          style={{
            backgroundColor: 'rgba(188, 108, 79, 0.1)',
            color: '#BC6C4F',
            border: '1px solid rgba(188, 108, 79, 0.3)',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar
              name={displayName}
              avatarUrl={previewUrl}
              avatarInitials={computedInitials}
              avatarColor={profile.avatar_color}
              sizeClassName="w-28 h-28 text-[36px] shadow-md border-2 border-surface-raised"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload size={22} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-sans text-xs font-semibold text-text-secondary hover:text-text-primary underline underline-offset-4"
              >
                Upload Custom Picture
              </button>
              <span className="text-border-strong">•</span>
              <button
                type="button"
                onClick={handleUseGooglePhoto}
                className="font-sans text-xs font-semibold text-accent-green hover:underline underline-offset-4"
              >
                Use Google Profile Photo
              </button>
            </div>
            <p className="font-sans text-[11px] text-text-muted mt-0.5">
              Profile picture is same as your Google account profile
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Display Name Input */}
        <div>
          <label className="block font-sans font-semibold text-[12px] text-text-primary mb-2 uppercase tracking-[0.02em]">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputStyles}
            placeholder="Enter your display name"
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl font-sans font-medium text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-sans font-semibold text-[13px] transition-all duration-200 shadow-sm"
            style={{
              backgroundColor: 'var(--btn-primary-bg, #1C1917)',
              color: 'var(--btn-primary-text, #F4F0EB)',
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
