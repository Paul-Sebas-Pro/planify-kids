function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className ?? ""}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-card p-4 shadow-sm flex items-start gap-4">
      <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-1/2" />
        <SkeletonBox className="h-3 w-3/4" />
      </div>
      <SkeletonBox className="h-7 w-16 rounded-button shrink-0" />
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-card p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-10 h-10 rounded-full shrink-0" />
        <SkeletonBox className="h-4 w-24" />
      </div>
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-2/3" />
    </div>
  );
}
