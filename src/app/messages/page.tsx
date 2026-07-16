'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { Profile } from '@/types';
import { MessageSquareText, ShieldCheck } from 'lucide-react';

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; displayName: string } | null>(
    null
  );
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: profile.id,
            displayName: profile.display_name,
          });
        }
      } catch (err) {
        console.error('Auth check error in messaging hub:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSelectConversation = (conversationId: string, otherUser: Profile) => {
    setActiveConversationId(conversationId);
    setActiveOtherUser(otherUser);
  };

  const handleBackToMobileList = () => {
    setActiveConversationId(null);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen pt-[56px] flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin" />
          <span className="font-sans text-xs text-text-secondary">Loading messaging hub...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="pt-[56px] h-screen w-full bg-canvas flex flex-col overflow-hidden">
      <div className="flex-1 max-w-7xl w-full mx-auto p-0 md:p-4 lg:p-6 flex overflow-hidden">
        <div className="flex-1 bg-card-bg md:rounded-2xl border-0 md:border border-border-default shadow-sm overflow-hidden flex flex-row">
          {/* LEFT PANE: ConversationList (40% desktop, full mobile if unselected) */}
          <div
            className={`w-full md:w-[40%] lg:w-[36%] h-full shrink-0 ${
              activeConversationId ? 'hidden md:block' : 'block'
            }`}
          >
            <ConversationList
              currentUserId={currentUser.id}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
            />
          </div>

          {/* RIGHT PANE: MessageThread (60% desktop, full mobile if selected) */}
          <div
            className={`w-full md:w-[60%] lg:w-[64%] h-full flex flex-col ${
              activeConversationId ? 'block' : 'hidden md:flex'
            }`}
          >
            {activeConversationId && activeOtherUser ? (
              <MessageThread
                conversationId={activeConversationId}
                currentUserId={currentUser.id}
                otherUser={activeOtherUser}
                onBack={handleBackToMobileList}
              />
            ) : (
              /* Welcome / Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-canvas/40 gap-4">
                <div className="w-16 h-16 rounded-3xl bg-accent-green/10 flex items-center justify-center text-accent-green shadow-sm border border-accent-green/20 animate-in zoom-in-90 duration-300">
                  <MessageSquareText size={32} />
                </div>
                <div className="flex flex-col gap-1.5 max-w-sm">
                  <h2 className="font-serif font-bold text-xl text-text-primary">
                    Your StudyHall Inbox
                  </h2>
                  <p className="font-sans text-xs text-text-secondary leading-relaxed">
                    Select a friend on the left or click <span className="font-semibold text-text-primary">&quot;New&quot;</span> to start messaging. Direct messaging is strictly limited to accepted friends for your safety and privacy.
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-raised border border-border-default text-text-secondary font-sans text-[11px]">
                  <ShieldCheck size={15} className="text-accent-green" />
                  <span>Realtime delivery &bull; Read receipts &bull; Friends only</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
