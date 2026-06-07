import Link from "next/link";

import { fetchLibraries } from "@/lib/api";

const examTypes = ["Govt Exam", "Entrance Exam", "School", "Professional"];
const distanceOptions = ["2 km", "5 km", "10 km", "20 km"];

export default async function MapPage() {
  const libraries = await fetchLibraries();

  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <div className="relative -mt-[var(--header-height)] overflow-hidden pt-[var(--header-height)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-12 h-52 w-52 rounded-full bg-sage-200/60 blur-3xl" />
          <div className="absolute right-[-50px] top-24 h-64 w-64 rounded-full bg-sage-100/70 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-8 pt-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
            Live seat map
          </p>
          <h1 className="mt-3 font-display text-4xl text-forest-900">
            Spot available seats across the city instantly.
          </h1>
          <p className="mt-3 text-lg text-forest-900/70">
            Filter by exam type, distance, and live seat count before you book.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              {examTypes.map((type) => (
                <button
                  key={type}
                  className="h-10 rounded-full border border-line bg-white px-4 text-sm font-semibold text-forest-900 transition hover:border-forest-700"
                >
                  {type}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 text-sm text-forest-900/70">
                <span>Distance</span>
                <select className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none">
                  {distanceOptions.map((distance) => (
                    <option key={distance}>{distance}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 h-[360px] rounded-2xl bg-gradient-to-br from-sage-100 via-sage-200 to-sand-100" />
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-forest-900/70">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-forest-700" />
                Seats available
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sage-300" />
                Few seats left
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-forest-900" />
                Fully booked
              </div>
            </div>
          </section>

          <aside className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">
                Nearby libraries
              </p>
              <span className="text-sm text-forest-900/70">
                {libraries.length} results
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {libraries.map((library) => {
                const statusLabel =
                  library.availableSeats === 0
                    ? "Full"
                    : library.availableSeats < 5
                      ? "Few seats"
                      : "Seats available";
                const statusTone =
                  library.availableSeats === 0
                    ? "bg-forest-900"
                    : library.availableSeats < 5
                      ? "bg-sage-300"
                      : "bg-forest-700";

                return (
                  <Link
                    key={library.id}
                    href={`/library/${library.id}`}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3 transition hover:border-forest-700"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-sage-100" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-forest-900">
                        {library.name}
                      </p>
                      <p className="text-sm text-forest-900/70">
                        {library.city}
                      </p>
                    </div>
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${statusTone}`}
                      aria-label={statusLabel}
                    />
                  </Link>
                );
              })}
            </div>
            <button className="mt-5 h-11 w-full rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900">
              Use my location
            </button>
          </aside>
        </div>
      </main>

    </div>
  );
}
