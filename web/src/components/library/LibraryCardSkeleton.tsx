export function LibraryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white/80 shadow-soft">
      <div className="aspect-video animate-pulse bg-sage-100" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-sage-100" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-sage-100" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-sage-100" />
        <div className="flex gap-2 pt-2">
          <div className="h-4 w-16 animate-pulse rounded-full bg-sage-100" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-sage-100" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-sage-100" />
        </div>
        <div className="mt-4 h-10 w-full animate-pulse rounded-full bg-sage-100" />
      </div>
    </div>
  );
}

export function LibraryResultsSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <LibraryCardSkeleton key={`library-skeleton-${index}`} />
      ))}
    </div>
  );
}
