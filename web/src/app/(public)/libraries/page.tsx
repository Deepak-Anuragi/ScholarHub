import { Suspense } from "react";

import { LibrariesExplorer } from "@/components/library/LibrariesExplorer";
import { LibraryResultsSkeleton } from "@/components/library/LibraryCardSkeleton";

function LibrariesPageFallback() {
  return (
    <div className="min-h-screen bg-sand-100">
      <div className="relative -mt-[var(--header-height)] overflow-hidden pt-[var(--header-height)]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 sm:px-6">
          <div className="h-4 w-32 animate-pulse rounded-full bg-sage-100" />
          <div className="mt-3 h-10 w-2/3 animate-pulse rounded-full bg-sage-100" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <LibraryResultsSkeleton count={12} />
      </main>
    </div>
  );
}

export default function LibrariesPage() {
  return (
    <Suspense fallback={<LibrariesPageFallback />}>
      <LibrariesExplorer />
    </Suspense>
  );
}
