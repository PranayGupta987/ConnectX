import { formatDistanceToNowStrict, isThisWeek, isToday, isYesterday, format } from "date-fns";

export function formatChatTimestamp(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "p");
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d)) return format(d, "EEEE");
  return format(d, "MMM d");
}

export function formatMessageTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "p");
}

export function formatLastSeen(iso?: string | null): string {
  if (!iso) return "Offline";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Offline";
  return `Last seen ${formatDistanceToNowStrict(d, { addSuffix: true })}`;
}
