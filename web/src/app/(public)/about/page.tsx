import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="bg-sand-100 px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">About Scholar&apos;s Hub</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-forest-900 sm:text-5xl">A better way to find your study space</h1>
        <div className="mt-8 space-y-5 text-base leading-7 text-forest-900/75">
          <p>Scholar&apos;s Hub helps students discover verified libraries, compare facilities and live seat availability, and book a study space online.</p>
          <p>We also help library owners reach serious learners with simple occupancy tools, online bookings, and transparent listings.</p>
        </div>
        <Link href="/libraries" className="mt-8 inline-flex h-11 items-center rounded-full bg-forest-700 px-6 text-sm font-semibold text-white transition hover:bg-forest-900">Browse libraries</Link>
      </div>
    </main>
  );
}
