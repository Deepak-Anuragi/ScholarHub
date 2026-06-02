import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { fetchLibraries } from "@/lib/api";

const facilityOptions = [
  "WiFi",
  "AC",
  "Locker",
  "Drinking Water",
  "CCTV",
  "Parking",
  "Washroom",
  "Generator",
];

const studentTypes = ["Govt Exam", "Entrance Exam", "School", "Professional"];

const toneStyles: Record<string, string> = {
  sage: "bg-gradient-to-br from-sage-100 via-sage-200 to-sage-300",
  forest: "bg-gradient-to-br from-forest-700/20 via-sage-200 to-sand-100",
  sand: "bg-gradient-to-br from-sand-100 via-sage-100 to-white",
};

export default async function LibrariesPage() {
  const libraries = await fetchLibraries();

  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-24 h-48 w-48 rounded-full bg-sage-200/60 blur-3xl" />
          <div className="absolute right-[-60px] top-24 h-56 w-56 rounded-full bg-sage-100/70 blur-3xl" />
        </div>
        <SiteHeader />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 pt-2">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
              Library listings
            </p>
            <h1 className="mt-3 font-display text-4xl text-forest-900">
              Compare verified libraries by city, fees, and seats.
            </h1>
            <p className="mt-3 text-lg text-forest-900/70">
              Use filters to match the right study hall. Listings update with
              live seat counts and shift availability.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
            <form className="grid gap-6">
              <div className="grid gap-3">
                <label className="text-sm font-semibold text-forest-900">
                  City
                </label>
                <input
                  className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                  placeholder="Delhi, Jaipur"
                />
              </div>
              <div className="grid gap-3">
                <label className="text-sm font-semibold text-forest-900">
                  State
                </label>
                <input
                  className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                  placeholder="Madhya Pradesh"
                />
              </div>
              <div className="grid gap-3">
                <label className="text-sm font-semibold text-forest-900">
                  Monthly fee range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                    placeholder="Min"
                  />
                  <input
                    className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                    placeholder="Max"
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <p className="text-sm font-semibold text-forest-900">
                  Facilities
                </p>
                <div className="grid gap-2">
                  {facilityOptions.map((facility) => (
                    <label
                      key={facility}
                      className="flex items-center gap-2 text-sm text-forest-900/80"
                    >
                      <input
                        className="h-4 w-4 rounded border-line"
                        type="checkbox"
                      />
                      {facility}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                <p className="text-sm font-semibold text-forest-900">
                  Student type
                </p>
                <div className="grid gap-2">
                  {studentTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-sm text-forest-900/80"
                    >
                      <input
                        className="h-4 w-4 rounded border-line"
                        type="checkbox"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                <input className="h-4 w-4 rounded border-line" type="checkbox" />
                Seats available only
              </label>
              <button
                className="h-11 rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
                type="button"
              >
                Apply filters
              </button>
            </form>
          </aside>

          <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-forest-900/70">
                Showing {libraries.length} libraries
              </p>
              <label className="flex items-center gap-3 text-sm font-semibold text-forest-900">
                Sort by
                <select className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none">
                  <option>Best rated</option>
                  <option>Fee low to high</option>
                  <option>Fee high to low</option>
                  <option>Seats available</option>
                  <option>Newest</option>
                </select>
              </label>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {libraries.map((library) => {
                const seatLabel =
                  library.availableSeats > 0
                    ? `${library.availableSeats} seats`
                    : "Waitlist";
                const seatTone =
                  library.availableSeats > 0
                    ? "bg-sage-100 text-forest-900"
                    : "bg-sand-100 text-forest-900";

                return (
                  <div
                    key={library.id}
                    className="rounded-card border border-line bg-white/80 p-5 shadow-soft"
                  >
                    <div
                      className={`h-36 rounded-2xl ${toneStyles[library.coverTone]}`}
                    />
                    <div className="mt-4 flex items-start justify-between">
                      <div>
                        <Link
                          className="text-lg font-semibold text-forest-900 transition hover:text-forest-700"
                          href={`/library/${library.id}`}
                        >
                          {library.name}
                        </Link>
                        <p className="text-sm text-forest-900/70">
                          {library.city}, {library.state}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${seatTone}`}
                      >
                        {seatLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-sm text-forest-900/70">
                      <span className="rounded-full bg-forest-700 px-3 py-1 text-sm font-semibold text-sand-100">
                        {library.rating.toFixed(1)}
                      </span>
                      <span>
                        {library.reviewCount} reviews - From Rs. {library.monthlyFee} / month
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      {library.facilities.slice(0, 3).map((facility) => (
                        <span
                          key={facility}
                          className="rounded-full border border-line bg-white px-3 py-1 text-forest-900"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Link
                        className="h-11 flex-1 rounded-full bg-forest-700 px-5 text-center text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
                        href={`/library/${library.id}`}
                      >
                        View details
                      </Link>
                      <button className="h-11 flex-1 rounded-full border border-line bg-white px-5 text-sm font-semibold text-forest-900 transition hover:border-forest-700">
                        Join waitlist
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
