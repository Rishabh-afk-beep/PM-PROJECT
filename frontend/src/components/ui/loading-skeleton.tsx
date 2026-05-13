import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

/** Shimmer card skeleton for loading states */
export const SkeletonCard = ({ className }: SkeletonCardProps) => (
  <div className={cn("rounded-2xl border bg-card p-5 space-y-3", className)}>
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
      </div>
    </div>
    <div className="h-3 w-full rounded bg-muted animate-pulse" />
    <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
  </div>
);

/** Grid of skeleton cards */
export const SkeletonGrid = ({ count = 6, className }: { count?: number; className?: string }) => (
  <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

/** Skeleton row for tables */
export const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 items-center py-3 px-2">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="flex-1 h-4 rounded bg-muted animate-pulse" style={{ animationDelay: `${j * 100}ms` }} />
        ))}
      </div>
    ))}
  </div>
);

/** Single line shimmer */
export const SkeletonLine = ({ width = "w-full", className }: { width?: string; className?: string }) => (
  <div className={cn("h-4 rounded bg-muted animate-pulse", width, className)} />
);

/** Stats card skeleton */
export const SkeletonStat = () => (
  <div className="rounded-2xl border bg-card p-5 space-y-2">
    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
      <div className="h-8 w-16 rounded bg-muted animate-pulse" />
    </div>
  </div>
);
