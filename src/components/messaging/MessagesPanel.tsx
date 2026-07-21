'use client';

import React, { useState, useEffect } from 'react';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { Profile } from '@/types';
import { MessageSquareText, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesPanel({ isOpen, onClose }: MessagesPanelProps) {
  const [currentUser, setCurrentUser] = useState<{ id: string; displayName: string } | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<Profile | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const checkAuth = async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name')
              .eq('id', user.id)
              .single();
            if (profile) {
              setCurrentUser({ id: profile.id, displayName: profile.display_name });
            }
          }
        } catch (err) {
          console.error('Auth error in panel', err);
        }
      };
      checkAuth();
    } else {
      // Delay unmounting to allow for slide-out animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSelectConversation = (conversationId: string, otherUser: Profile) => {
    setActiveConversationId(conversationId);
    setActiveOtherUser(otherUser);
  };

  const handleBackToMobileList = () => {
    setActiveConversationId(null);
  };

  if (!isVisible && !isOpen) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-transparent z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed inset-y-0 right-0 w-full max-w-[400px] bg-canvas z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border-default bg-surface">
          <h2 className="font-serif font-bold text-lg text-text-primary flex items-center gap-2">
            <MessageSquareText size={20} className="text-accent-green" />
            Messages
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary"
            aria-label="Close messages"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative bg-card-bg">
          {!currentUser ? (
             <div className="flex items-center justify-center h-full">
               <div className="w-8 h-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin" />
             </div>
          ) : (
            <>
              <div className={`absolute inset-0 bg-card-bg transition-transform duration-300 ${activeConversationId ? '-translate-x-full' : 'translate-x-0'}`}>
                <ConversationList
                  currentUserId={currentUser.id}
                  activeConversationId={activeConversationId}
                  onSelectConversation={handleSelectConversation}
                />
              </div>

              <div className={`absolute inset-0 bg-card-bg flex flex-col transition-transform duration-300 ${activeConversationId ? 'translate-x-0' : 'translate-x-full'}`}>
                {activeConversationId && activeOtherUser ? (
                  <MessageThread
                    conversationId={activeConversationId}
                    currentUserId={currentUser.id}
                    otherUser={activeOtherUser}
                    onBack={handleBackToMobileList}
                    alwaysShowBack={true}
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
