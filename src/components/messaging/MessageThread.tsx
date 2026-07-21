'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { PresenceIndicator } from '@/components/messaging/PresenceIndicator';
import { Composer } from '@/components/messaging/Composer';
import {
  DirectMessageWithSender,
  getMessages,
  markMessagesRead,
  getPresence,
  removeTyping,
} from '@/lib/messaging';
import { Profile } from '@/types';

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
  otherUser: Profile;
  initialIsOnline?: boolean;
  initialLastSeenAt?: string;
  onBack?: () => void;
  onNewMessage?: () => void;
  alwaysShowBack?: boolean;
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherUser,
  initialIsOnline = false,
  initialLastSeenAt,
  onBack,
  onNewMessage,
  alwaysShowBack = false,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<DirectMessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [presence, setPresence] = useState<{ isOnline: boolean; lastSeenAt?: string }>({
    isOnline: initialIsOnline,
    lastSeenAt: initialLastSeenAt,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Fetch initial messages and mark read
  const fetchAndMarkRead = useCallback(async () => {
    try {
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
      setIsLoading(false);
      setTimeout(() => scrollToBottom('auto'), 50);

      const unreadExists = msgs.some((m) => m.sender_id !== currentUserId && !m.read_at);
      if (unreadExists) {
        await markMessagesRead(conversationId, currentUserId);
        onNewMessage?.();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setIsLoading(false);
    }
  }, [conversationId, currentUserId, scrollToBottom, onNewMessage]);

  // Fetch presence
  const refreshPresence = useCallback(async () => {
    try {
      const data = await getPresence([otherUser.id]);
      if (data && data.length > 0) {
        setPresence({
          isOnline: data[0].is_online,
          lastSeenAt: data[0].last_seen_at,
        });
      }
    } catch (err) {
      console.error('Error checking presence:', err);
    }
  }, [otherUser.id]);

  useEffect(() => {
    setIsLoading(true);
    setIsTyping(false);
    fetchAndMarkRead();
    refreshPresence();

    const supabase = createClient();

    // 1. Messages realtime channel
    const msgChannel = supabase
      .channel(`thread-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as DirectMessageWithSender;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(() => scrollToBottom('smooth'), 50);

            if (newMsg.sender_id !== currentUserId) {
              // Mark as read immediately when active inside thread
              await markMessagesRead(conversationId, currentUserId);
              // Update local state so checkmark reflects read
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === newMsg.id ? { ...m, read_at: new Date().toISOString() } : m
                )
              );
            }
            onNewMessage?.();
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as DirectMessageWithSender;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            );
          }
        }
      )
      .subscribe();

    // 2. Typing realtime channel
    const typingChannel = supabase
      .channel(`thread-typing-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as { user_id: string };
            if (row.user_id === otherUser.id) {
              setIsTyping(true);
              setTimeout(() => scrollToBottom('smooth'), 50);
            }
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as { user_id?: string };
            if (!row.user_id || row.user_id === otherUser.id) {
              setIsTyping(false);
            }
          }
        }
      )
      .subscribe();

    // 3. Presence realtime channel
    const presenceChannel = supabase
      .channel(`thread-presence-${otherUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${otherUser.id}`,
        },
        (payload) => {
          if (payload.new && 'is_online' in payload.new) {
            const row = payload.new as { is_online: boolean; last_seen_at: string };
            setPresence({
              isOnline: row.is_online,
              lastSeenAt: row.last_seen_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(presenceChannel);
      removeTyping(conversationId, currentUserId).catch(() => {});
    };
  }, [conversationId, currentUserId, otherUser.id, fetchAndMarkRead, refreshPresence, scrollToBottom, onNewMessage]);

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-card-bg overflow-hidden relative">
      {/* Header */}
      <div
        className="h-[64px] px-4 flex items-center justify-between border-b border-border-default shrink-0 bg-card-bg/95 backdrop-blur-md z-10"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 -ml-1 rounded-full text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${alwaysShowBack ? '' : 'md:hidden'}`}
              aria-label="Back to conversations"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <Link
            href={`/profile/${otherUser.id}`}
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="relative shrink-0">
              <Avatar
                name={otherUser.display_name}
                avatarUrl={otherUser.avatar_url}
                avatarInitials={otherUser.avatar_initials}
                avatarColor={otherUser.avatar_color}
                sizeClassName="w-10 h-10 text-sm shadow-sm"
              />
              <div className="absolute bottom-0 right-0 border-2 border-surface-raised rounded-full overflow-hidden">
                <PresenceIndicator isOnline={presence.isOnline} sizeClassName="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="flex flex-col truncate">
              <span className="font-serif font-bold text-[16px] text-text-primary truncate group-hover:text-accent-green transition-colors">
                {otherUser.display_name}
              </span>
              <PresenceIndicator
                isOnline={presence.isOnline}
                lastSeenAt={presence.lastSeenAt}
                showText={true}
                sizeClassName="hidden" // hide dot since it's on the avatar
                className="mt-0.5"
              />
            </div>
          </Link>
        </div>

        <Link
          href={`/profile/${otherUser.id}`}
          className="text-xs font-sans font-semibold px-3 py-1.5 rounded-full border border-border-default hover:border-accent-green hover:text-accent-green transition-all"
        >
          View Profile
        </Link>
      </div>

      {/* Message List Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin"
      >
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-text-secondary font-sans text-sm">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-accent-green animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-accent-green animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-2">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2 text-text-secondary">
            <div className="w-12 h-12 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green mb-1">
              <span className="text-xl">👋</span>
            </div>
            <p className="font-serif font-bold text-base text-text-primary">
              Say hello to {otherUser.display_name}!
            </p>
            <p className="font-sans text-xs max-w-xs text-text-muted">
              This is the start of your direct messaging history with accepted friend {otherUser.display_name}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 min-h-full justify-end">
            {messages.map((m) => {
              const isMine = m.sender_id === currentUserId;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[78%] md:max-w-[65%] group ${
                    isMine ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl break-words relative shadow-sm transition-all ${
                      isMine
                        ? 'bg-accent-green text-white rounded-br-xs'
                        : 'bg-canvas text-text-primary rounded-bl-xs border border-border-default/60'
                    }`}
                    style={{
                      backgroundColor: isMine ? '#5C7A5A' : 'var(--canvas)',
                      color: isMine ? '#FFFFFF' : 'var(--text-primary)',
                    }}
                  >
                    <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="font-mono text-[10px] text-text-muted">
                      {formatMessageTime(m.created_at)}
                    </span>
                    {isMine && (
                      <span
                        className="flex items-center text-text-muted"
                        title={m.read_at ? `Read at ${formatMessageTime(m.read_at)}` : 'Sent'}
                      >
                        {m.read_at ? (
                          <CheckCheck size={13} className="text-accent-green" />
                        ) : (
                          <Check size={13} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="self-start flex items-center gap-2 bg-canvas px-3.5 py-2 rounded-2xl rounded-bl-xs border border-border-default/60 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="font-sans text-xs italic text-text-secondary">
              {otherUser.display_name} is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input */}
      <Composer
        conversationId={conversationId}
        currentUserId={currentUserId}
        onMessageSent={() => {
          fetchAndMarkRead();
          onNewMessage?.();
        }}
      />
    </div>
  );
}
