import { useEffect, useRef, useState } from "react";
import { Send, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AIWelcome } from "@/components/ai/ai-welcome";
import { AIChatMessage } from "@/components/ai/ai-chat-message";
import { AIAvatar } from "@/components/ai/ai-avatar";
import { useAIStore } from "@/store/ai-store";
import { useAuthStore } from "@/store/auth-store";
import { AI_ASSISTANT } from "@/lib/constants";

export function AIChat() {
  const { user } = useAuthStore();
  const {
    messages,
    streaming,
    loadingHistory,
    provider,
    loadHistory,
    send,
    regenerate,
    stop,
    clear,
  } = useAIStore();

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    // auto scroll to bottom on new content
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || streaming) return;
    setDraft("");
    try {
      await send(trimmed);
    } catch (err) {
      toast.error((err as Error).message || "Failed to send");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const empty = messages.length === 0 && !loadingHistory;
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") return i;
    return -1;
  })();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-border glass">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <AIAvatar size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{AI_ASSISTANT.NAME}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {streaming
              ? "Thinking…"
              : provider
              ? `Powered by ${provider}`
              : "Your personal assistant"}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              disabled={messages.length === 0 || streaming}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your chat history with {AI_ASSISTANT.NAME}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await clear();
                  toast.success("Conversation cleared");
                }}
              >
                Clear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <AIWelcome
            onPick={(prompt) => {
              setDraft(prompt);
              inputRef.current?.focus();
            }}
          />
        ) : (
          <div className="divide-y divide-border/60">
            {messages.map((m, i) => (
              <AIChatMessage
                key={m.id}
                message={m}
                user={user ?? null}
                isLast={i === lastAssistantIndex && !streaming}
                streaming={m.streaming}
                onRegenerate={() => void regenerate()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="border-t border-border bg-background/60 p-3 sm:p-4"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${AI_ASSISTANT.NAME}…`}
            rows={1}
            className="max-h-40 min-h-[44px] resize-none rounded-2xl border-border bg-background pr-3"
            disabled={streaming}
          />
          {streaming ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={stop}
              className="h-11 w-11 shrink-0 rounded-2xl"
              aria-label="Stop generation"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim()}
              className="h-11 w-11 shrink-0 rounded-2xl"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground">
          ConnectX AI can make mistakes. Verify important info.
        </div>
      </form>
    </div>
  );
}
