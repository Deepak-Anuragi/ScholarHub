import Link from "next/link";
import { notFound } from "next/navigation";

import { LibraryDetailClient } from "@/components/library/LibraryDetailClient";
import { getLibraryPageData } from "@/lib/library-data";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const data = await getLibraryPageData(params.id);
  if (!data) return { title: "Library not found" };

  const { library } = data;
  const cover = library.photos.find((photo) => photo.isCover)?.url;
  return {
    title: library.name,
    description: `Book a seat at ${library.name} in ${library.city}.`,
    openGraph: cover ? { images: [cover] } : undefined,
  };
}

export default async function LibraryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetches from the Express API. A missing library returns null; a failed
  // request throws and is caught by the route's error boundary.
  const data = await getLibraryPageData(params.id);

  if (!data) {
    notFound();
  }

  const { library, slots, reviews, reviewTotal } = data;

  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <Link
          className="inline-flex items-center gap-1 text-sm text-forest-900/60 transition hover:text-forest-900"
          href="/libraries"
        >
          ← Back to libraries
        </Link>

        <div className="mt-6">
          <LibraryDetailClient
            library={library}
            initialSlots={slots}
            initialReviews={reviews}
            initialReviewTotal={reviewTotal}
          />
        </div>
      </main>
    </div>
  );
}
