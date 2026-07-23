import { useEffect, useRef, useState } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { ImagePlus, Send, Smile, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useThemeStore } from "@/store/theme-store";
import { emitTyping } from "@/hooks/use-realtime-sync";
import type { Message } from "@/types";

interface Props {
  conversationId: string;
  toUserId: string | null;
  replyTo: Message | null;
  onCancelReply: () => void;
  onSend: (payload: { content?: string; image?: File | null }) => Promise<void>;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function MessageComposer({ conversationId, toUserId, replyTo, onCancelReply, onSend }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const typingRef = useRef<{ active: boolean; timeout: ReturnType<typeof setTimeout> | null }>({
    active: false,
    timeout: null,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const notifyTyping = (isActive: boolean) => {
    if (!toUserId) return;
    if (isActive && !typingRef.current.active) {
      typingRef.current.active = true;
      emitTyping(conversationId, toUserId, true);
    }
    if (!isActive && typingRef.current.active) {
      typingRef.current.active = false;
      emitTyping(conversationId, toUserId, false);
    }
  };

  useEffect(() => {
    return () => {
      if (typingRef.current.timeout) clearTimeout(typingRef.current.timeout);
      notifyTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleChange = (val: string) => {
    setText(val);
    if (val.length > 0) {
      notifyTyping(true);
      if (typingRef.current.timeout) clearTimeout(typingRef.current.timeout);
      typingRef.current.timeout = setTimeout(() => notifyTyping(false), 2500);
    } else {
      notifyTyping(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !image) return;
    setSending(true);
    try {
      await onSend({ content: trimmed || undefined, image });
      setText("");
      setImage(null);
      notifyTyping(false);
    } finally {
      setSending(false);
    }
  };

  const handleImage = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_BYTES) return;
    setImage(file);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3">
      {replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-2 text-xs">
          <div className="min-w-0 flex-1">
            <div className="font-medium">Replying to {replyTo.sender.displayName}</div>
            <div className="truncate text-muted-foreground">
              {replyTo.content || "📷 Photo"}
            </div>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onCancelReply} aria-label="Cancel reply">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {preview && (
        <div className="mb-2 flex items-start gap-2">
          <div className="relative">
            <img src={preview} alt="preview" className="h-24 w-24 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 shadow"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>

        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button type="button" size="icon" variant="ghost" className="shrink-0" aria-label="Insert emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-auto border-0 p-0">
            <EmojiPicker
              theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
              emojiStyle={EmojiStyle.NATIVE}
              onEmojiClick={(e) => {
                setText((prev) => prev + e.emoji);
              }}
              lazyLoadEmojis
              width={320}
              height={360}
            />
          </PopoverContent>
        </Popover>

        <Textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          className={cn(
            "min-h-10 max-h-40 flex-1 resize-none rounded-2xl border-border bg-background/60 py-2.5",
          )}
        />

        <Button
          type="submit"
          size="icon"
          variant="hero"
          className="shrink-0 rounded-full"
          disabled={sending || (text.trim().length === 0 && !image)}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
