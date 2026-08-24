import { LibraryResultsSkeleton } from "@/components/library/LibraryCardSkeleton";

export default function Loading() {
  return <main className="min-h-screen bg-sand-100 px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl animate-pulse"><div className="h-10 w-72 rounded-full bg-sage-100" /><div className="mt-8"><LibraryResultsSkeleton count={6} /></div></div></main>;
}
