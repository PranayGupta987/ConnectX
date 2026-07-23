import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-3 glass">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
          <Skeleton className={`h-10 rounded-2xl ${i % 2 ? "w-40" : "w-56"}`} />
        </div>
      ))}
    </div>
  );
}
