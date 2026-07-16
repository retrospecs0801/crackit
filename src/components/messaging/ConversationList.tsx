'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, MessageSquarePlus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { PresenceIndicator, formatRelativeTime } from '@/components/messaging/PresenceIndicator';
import {
  ConversationWithDetails,
  getConversations,
  getFriends,
  findOrCreateConversation,
} from '@/lib/messaging';
import { Profile } from '@/types';

interface ConversationListProps {
  currentUserId: string;
  activeConversationId?: string | null;
  onSelectConversation: (conversationId: string, otherUser: Profile) => void;
  onListUpdated?: () => void;
}

export function ConversationList({
  currentUserId,
  activeConversationId,
  onSelectConversation,
  onListUpdated,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchConvs = useCallback(async () => {
    try {
      const data = await getConversations(currentUserId);
      setConversations(data);
      setIsLoading(false);
      onListUpdated?.();
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setIsLoading(false);
    }
  }, [currentUserId, onListUpdated]);

  const fetchFriendList = async () => {
    setFriendsLoading(true);
    setActionError(null);
    try {
      const list = await getFriends(currentUserId);
      setFriends(list);
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchConvs();

    const supabase = createClient();
    const channel = supabase
      .channel(`conv-list-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
        },
        () => {
          fetchConvs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConvs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          fetchConvs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchConvs]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchFriendList();
  };

  const handleStartConversation = async (friend: Profile) => {
    setActionError(null);
    try {
      const { conversation, otherUser } = await findOrCreateConversation(currentUserId, friend.id);
      setIsModalOpen(false);
      await fetchConvs();
      onSelectConversation(conversation.id, otherUser);
    } catch (err: any) {
      console.error('Error starting conversation:', err);
      setActionError(err.message || 'Failed to start conversation');
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card-bg border-r border-border-default overflow-hidden relative">
      {/* Top Bar */}
      <div className="p-4 border-b border-border-default flex items-center justify-between shrink-0 bg-card-bg">
        <div className="flex items-center gap-2">
          <h1 className="font-serif font-bold text-xl text-text-primary">Messages</h1>
          {conversations.some((c) => c.unread_count > 0) && (
            <span className="px-2 py-0.5 rounded-full bg-accent-green/15 text-accent-green font-mono text-[11px] font-bold">
              {conversations.reduce((sum, c) => sum + c.unread_count, 0)} new
            </span>
          )}
        </div>

        <button
          onClick={handleOpenModal}
          className="p-2 rounded-full bg-accent-green text-white hover:opacity-90 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5 px-3 text-xs font-sans font-semibold"
          title="New Conversation"
        >
          <Plus size={15} />
          <span>New</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-default/50 scrollbar-thin">
        {isLoading ? (
          <div className="p-6 text-center text-text-secondary font-sans text-sm">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3 text-text-secondary my-auto">
            <div className="w-12 h-12 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green">
              <MessageSquarePlus size={22} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-serif font-bold text-sm text-text-primary">No messages yet</p>
              <p className="font-sans text-xs max-w-[200px] text-text-muted">
                Start messaging your accepted friends anytime, anywhere.
              </p>
            </div>
            <button
              onClick={handleOpenModal}
              className="mt-2 py-2 px-4 rounded-xl font-sans font-semibold text-xs bg-accent-green text-white hover:opacity-90 transition-all"
            >
              Start New Conversation
            </button>
          </div>
        ) : (
          conversations.map((c) => {
            const isSelected = activeConversationId === c.id;
            const preview =
              c.last_message_preview && c.last_message_preview.length > 50
                ? c.last_message_preview.substring(0, 50) + '...'
                : c.last_message_preview || 'No messages yet';

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id, c.otherUser)}
                className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? 'bg-accent-green/10 border-l-4 border-l-accent-green pl-2.5'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  {/* Avatar with click to profile */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="relative shrink-0"
                  >
                    <Link href={`/profile/${c.otherUser.id}`}>
                      <Avatar
                        name={c.otherUser.display_name}
                        avatarUrl={c.otherUser.avatar_url}
                        avatarInitials={c.otherUser.avatar_initials}
                        avatarColor={c.otherUser.avatar_color}
                        sizeClassName="w-11 h-11 text-sm shadow-sm hover:opacity-85 transition-opacity"
                      />
                    </Link>
                    <div className="absolute bottom-0 right-0 border-2 border-card-bg rounded-full overflow-hidden">
                      <PresenceIndicator isOnline={c.is_online} sizeClassName="w-2.5 h-2.5" />
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif font-bold text-sm text-text-primary truncate">
                        {c.otherUser.display_name}
                      </span>
                    </div>
                    <p
                      className={`font-sans text-xs truncate mt-0.5 ${
                        c.unread_count > 0
                          ? 'font-bold text-text-primary'
                          : 'text-text-secondary'
                      }`}
                    >
                      {preview}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5 gap-1.5">
                  <span className="font-mono text-[10px] text-text-muted">
                    {formatRelativeTime(c.last_message_time)}
                  </span>

                  {c.unread_count > 0 && (
                    <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse shadow-sm" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Conversation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-bg rounded-2xl border border-border-default shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border-default flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-text-primary">New Conversation</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b border-border-default bg-canvas">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised border border-border-default">
                <Search size={16} className="text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search accepted friends..."
                  className="w-full bg-transparent border-0 focus:outline-none font-sans text-xs text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>

            {actionError && (
              <div className="px-4 py-2 bg-accent-terracotta/10 border-b border-accent-terracotta/20 text-accent-terracotta font-sans text-xs">
                {actionError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 divide-y divide-border-default/30 max-h-80">
              {friendsLoading ? (
                <div className="p-6 text-center text-text-secondary font-sans text-xs">
                  Loading accepted friends...
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="p-6 text-center text-text-secondary font-sans text-xs">
                  {friends.length === 0
                    ? "You don't have any accepted friends yet. Add friends on their profile pages!"
                    : 'No friends found matching your search.'}
                </div>
              ) : (
                filteredFriends.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleStartConversation(f)}
                    className="p-2.5 rounded-xl flex items-center justify-between gap-3 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar
                        name={f.display_name}
                        avatarUrl={f.avatar_url}
                        avatarInitials={f.avatar_initials}
                        avatarColor={f.avatar_color}
                        sizeClassName="w-9 h-9 text-xs"
                      />
                      <span className="font-sans font-semibold text-sm text-text-primary truncate">
                        {f.display_name}
                      </span>
                    </div>

                    <span className="text-xs font-sans font-medium text-accent-green px-2.5 py-1 rounded-lg bg-accent-green/10">
                      Chat
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
