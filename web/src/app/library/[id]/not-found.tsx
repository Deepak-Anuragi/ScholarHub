import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-10">
        <div className="rounded-card border border-line bg-white/80 p-8 shadow-soft">
          <p className="text-sm font-semibold text-forest-900/70">
            Library not found
          </p>
          <h1 className="mt-3 font-display text-3xl text-forest-900">
            We could not find that library.
          </h1>
          <p className="mt-3 text-sm text-forest-900/70">
            Try another listing or return to the library search page.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
            href="/libraries"
          >
            Browse libraries
          </Link>
        </div>
      </main>
    </div>
  );
}
