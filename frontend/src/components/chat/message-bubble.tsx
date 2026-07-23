import { useState } from "react";
import { Check, CheckCheck, Copy, Pencil, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/common/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatMessageTime } from "@/lib/time";
import type { Message } from "@/types";

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  otherUserId: string | null;
  onReply: () => void;
  onEdit: (content: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export function MessageBubble({ message, isOwn, showAvatar, otherUserId, onReply, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draft, setDraft] = useState(message.content);

  const seenByOther = Boolean(
    otherUserId && message.seenBy?.some((s) => s.user === otherUserId),
  );

  const deleted = message.deletedForEveryone;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const submitEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.content) {
      setEditing(false);
      return;
    }
    await onEdit(trimmed);
    setEditing(false);
  };

  return (
    <div className={cn("flex gap-2 py-0.5", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <div className={cn("w-8 shrink-0", !showAvatar && "invisible")}>
          {showAvatar && <UserAvatar user={message.sender} size="sm" />}
        </div>
      )}

      <div className={cn("group max-w-[78%] sm:max-w-[65%]", isOwn ? "items-end" : "items-start")}>
        {message.replyTo && !deleted && (
          <div
            className={cn(
              "mb-1 rounded-lg border-l-2 border-primary/60 bg-muted/50 px-2 py-1 text-[11px]",
              isOwn ? "ml-auto" : "",
            )}
          >
            <div className="font-medium text-foreground/80">
              {message.replyTo.sender?.displayName ?? "Replied message"}
            </div>
            <div className="truncate text-muted-foreground">
              {message.replyTo.deletedForEveryone
                ? "Message deleted"
                : message.replyTo.content || "📷 Photo"}
            </div>
          </div>
        )}

        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2 text-sm shadow-sm",
            isOwn
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-muted text-foreground",
            deleted && "italic opacity-70",
          )}
        >
          {deleted ? (
            <span className="text-xs">This message was deleted</span>
          ) : editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="h-8 min-w-[180px] bg-background text-foreground"
              />
              <Button size="sm" variant="secondary" onClick={submitEdit}>
                Save
              </Button>
            </div>
          ) : (
            <>
              {message.imageUrl && (
                <img
                  src={message.imageUrl}
                  alt="Attachment"
                  className="mb-1 max-h-72 rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              {message.content && <div className="whitespace-pre-wrap break-words">{message.content}</div>}
              {message.edited && (
                <div className={cn("mt-0.5 text-[10px] opacity-70", isOwn ? "text-right" : "text-left")}>
                  edited
                </div>
              )}
            </>
          )}

          {!deleted && !editing && (
            <div
              className={cn(
                "absolute -top-3 opacity-0 transition-opacity group-hover:opacity-100",
                isOwn ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1",
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full">
                    <span className="text-xs">⋯</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "start" : "end"}>
                  <DropdownMenuItem onSelect={() => onReply()}>
                    <Reply className="mr-2 h-4 w-4" />
                    Reply
                  </DropdownMenuItem>
                  {message.content && (
                    <DropdownMenuItem onSelect={handleCopy}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </DropdownMenuItem>
                  )}
                  {isOwn && message.type === "text" && (
                    <DropdownMenuItem onSelect={() => setEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {isOwn && (
                    <DropdownMenuItem
                      onSelect={() => setConfirmingDelete(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px] text-muted-foreground",
            isOwn ? "justify-end" : "justify-start",
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {isOwn &&
            !deleted &&
            (seenByOther ? (
              <CheckCheck className="h-3 w-3 text-primary" aria-label="Seen" />
            ) : (
              <Check className="h-3 w-3" aria-label="Sent" />
            ))}
        </div>
      </div>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be deleted for everyone in the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onDelete();
                setConfirmingDelete(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
