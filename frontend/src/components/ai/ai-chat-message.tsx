import { Copy, RefreshCw, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AIAvatar } from "@/components/ai/ai-avatar";
import { UserAvatar } from "@/components/common/user-avatar";
import { AIMarkdown } from "@/components/ai/ai-markdown";
import type { AIMessage, User } from "@/types";

interface Props {
  message: AIMessage;
  user: User | null;
  isLast: boolean;
  onRegenerate?: () => void;
  streaming?: boolean;
}

export function AIChatMessage({ message, user, isLast, onRegenerate, streaming }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className={cn("group px-4 py-4 sm:px-6", !isUser && "bg-muted/30")}>
      <div className="mx-auto flex max-w-3xl gap-3 sm:gap-4">
        <div className="shrink-0">
          {isUser ? (
            user ? (
              <UserAvatar user={user} size="sm" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted" />
            )
          ) : (
            <AIAvatar size="sm" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs font-semibold text-foreground/80">
            {isUser ? user?.displayName || "You" : "ConnectX AI"}
          </div>

          {message.content ? (
            isUser ? (
              <div className="whitespace-pre-wrap break-words text-sm text-foreground">
                {message.content}
              </div>
            ) : (
              <AIMarkdown content={message.content} />
            )
          ) : (
            <TypingDots />
          )}

          {!isUser && !streaming && message.content && (
            <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 px-2 text-xs"
                onClick={copy}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              {isLast && onRegenerate && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 px-2 text-xs"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
    </div>
  );
}
