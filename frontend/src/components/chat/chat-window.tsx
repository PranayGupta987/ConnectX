import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ChatSkeleton } from "@/components/common/skeletons";
import { UserAvatar } from "@/components/common/user-avatar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageComposer } from "@/components/chat/message-composer";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { useChatStore } from "@/store/chat-store";
import { useCallController } from "@/hooks/use-webrtc";
import { AI_ASSISTANT } from "@/lib/constants";
import { formatLastSeen } from "@/lib/time";
import { toApiError } from "@/lib/api-client";
import type { Conversation, Message } from "@/types";

interface Props {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
}

export function ChatWindow({ conversation, currentUserId, onBack }: Props) {
  const messages = useChatStore((s) => s.messagesByConvo[conversation.id]) ?? [];
  const loading = useChatStore((s) => s.loadingMessages[conversation.id]) ?? false;
  const hasMore = useChatStore((s) => s.hasMore[conversation.id]) ?? true;
  const typingMap = useChatStore((s) => s.typingByConvo[conversation.id]) ?? {};
  const { loadMessages, sendMessage, editMessage, deleteMessage, markSeen } = useChatStore();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const other = conversation.otherUser;
  const otherIsTyping = useMemo(() => {
    const now = Date.now();
    return Object.entries(typingMap).some(([uid, expiresAt]) => uid !== currentUserId && expiresAt > now);
  }, [typingMap, currentUserId]);

  useEffect(() => {
    void loadMessages(conversation.id).then(() => {
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }));
    });
    void markSeen(conversation.id);
  }, [conversation.id, loadMessages, markSeen]);

  // Auto scroll on new messages if user is near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 200) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleScroll = async () => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop < 80) {
      const oldest = messages[0];
      if (!oldest) return;
      const prevHeight = el.scrollHeight;
      await loadMessages(conversation.id, { before: oldest.createdAt });
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
      });
    }
  };

  const handleSend = async (payload: { content?: string; image?: File | null }) => {
    try {
      await sendMessage(conversation.id, {
        content: payload.content,
        image: payload.image,
        replyTo: replyTo?.id ?? null,
      });
      setReplyTo(null);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {other && <UserAvatar user={other} showPresence />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{other?.displayName ?? "Chat"}</div>
          <div className="truncate text-xs text-muted-foreground">
            {other?.isOnline ? "Online" : formatLastSeen(other?.lastSeen)}
          </div>
        </div>
        <ChatCallButtons peer={other} />
        <Button variant="ghost" size="icon" aria-label="Conversation options">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-6"
      >
        {loading && messages.length === 0 ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No messages yet — send the first one!
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="pb-2 text-center text-[11px] text-muted-foreground">
                {loading ? "Loading earlier messages…" : "Scroll up for older messages"}
              </div>
            )}
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const showAvatar = !prev || prev.sender.id !== m.sender.id;
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOwn={m.sender.id === currentUserId}
                  showAvatar={showAvatar}
                  otherUserId={other?.id ?? null}
                  onReply={() => setReplyTo(m)}
                  onEdit={async (content) => {
                    try {
                      await editMessage(m.id, conversation.id, content);
                    } catch (err) {
                      toast.error(toApiError(err).message);
                    }
                  }}
                  onDelete={async () => {
                    try {
                      await deleteMessage(m.id, conversation.id);
                    } catch (err) {
                      toast.error(toApiError(err).message);
                    }
                  }}
                />
              );
            })}
            {otherIsTyping && other && <TypingIndicator user={other} />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageComposer
        conversationId={conversation.id}
        toUserId={other?.id ?? null}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={handleSend}
      />
    </div>
  );
}

function ChatCallButtons({ peer }: { peer: Conversation["otherUser"] }) {
  const { startCall, phase } = useCallController();
  if (!peer || peer.id === AI_ASSISTANT.ID) return null;
  const disabled = phase !== "idle";
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Voice call ${peer.displayName}`}
        disabled={disabled}
        onClick={() => void startCall(peer, "audio")}
      >
        <Phone className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Video call ${peer.displayName}`}
        disabled={disabled}
        onClick={() => void startCall(peer, "video")}
      >
        <Video className="h-4 w-4" />
      </Button>
    </>
  );
}
