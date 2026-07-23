'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  message?: string;
}

export function GoogleSignInModal({
  isOpen,
  onClose,
  message = 'Sign in with Google to continue to Crackit.',
}: GoogleSignInModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const getURL = () => {
        let url =
          process?.env?.NEXT_PUBLIC_SITE_URL ??
          process?.env?.NEXT_PUBLIC_VERCEL_URL ??
          (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        url = url.includes('http') ? url : `https://${url}`;
        url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
        return url;
      };

      const callbackUrl = `${getURL()}auth/callback`;

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-[4px] px-4"
      style={{ backgroundColor: 'rgba(28, 25, 23, 0.65)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[400px] rounded-[16px] border border-border-default p-6 shadow-2xl flex flex-col"
        style={{ backgroundColor: 'var(--card-bg, #222226)' }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7A8B76]"></div>
            <h2 className="font-sans font-bold text-[18px] text-text-primary">
              Sign In Required
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary font-mono text-[16px]"
          >
            ✕
          </button>
        </div>

        <p className="font-sans text-[13px] text-text-secondary mb-6 leading-relaxed">
          {message}
        </p>

        {error && (
          <p className="font-mono text-[12px] text-[#BC6C4F] mb-4">{error}</p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-[44px] flex items-center justify-center gap-3 rounded-lg border border-border-default bg-[#FFFFFF] text-[#18181B] font-sans font-semibold text-[13px] hover:bg-[#F4F0EB] transition-all disabled:opacity-50 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {loading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}
