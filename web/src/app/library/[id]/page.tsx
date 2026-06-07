import Link from "next/link";
import { notFound } from "next/navigation";

import {
  fetchLibraryById,
  fetchLibraryReviews,
  fetchLibrarySlots,
} from "@/lib/api";

const toneStyles: Record<string, string> = {
  sage: "bg-gradient-to-br from-sage-100 via-sage-200 to-sage-300",
  forest: "bg-gradient-to-br from-forest-700/20 via-sage-200 to-sand-100",
  sand: "bg-gradient-to-br from-sand-100 via-sage-100 to-white",
};

export default async function LibraryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [library, slots, reviews] = await Promise.all([
    fetchLibraryById(params.id),
    fetchLibrarySlots(params.id),
    fetchLibraryReviews(params.id),
  ]);

  if (!library) {
    notFound();
  }

  const availablePercent = Math.round(
    (library.availableSeats / library.totalSeats) * 100
  );

  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-6">
        <Link
          className="text-sm text-forest-900/70 transition hover:text-forest-900"
          href="/libraries"
        >
          Back to libraries
        </Link>

        <section className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div
              className={`h-60 rounded-card ${toneStyles[library.coverTone]}`}
            />
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
                {library.city}, {library.state}
              </p>
              <h1 className="font-display text-4xl text-forest-900">
                {library.name}
              </h1>
              <p className="text-sm text-forest-900/70">{library.address}</p>
              <p className="text-sm text-forest-900/70">
                {library.district} - {library.pincode}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-forest-900/70">
                <span className="rounded-full bg-forest-700 px-3 py-1 text-sm font-semibold text-sand-100">
                  {library.rating.toFixed(1)}
                </span>
                <span>{library.reviewCount} reviews</span>
                <span>From Rs. {library.monthlyFee} / month</span>
              </div>
            </div>

            <div className="mt-6 rounded-card border border-line bg-white/80 p-5 shadow-soft">
              <p className="text-sm font-semibold text-forest-900">
                About this library
              </p>
              <p className="mt-3 text-sm text-forest-900/70">
                {library.description}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-sage-100/70 p-4 text-sm">
                  <p className="font-semibold text-forest-900">
                    Total seats
                  </p>
                  <p className="mt-1 text-forest-900/70">
                    {library.totalSeats} seats
                  </p>
                </div>
                <div className="rounded-2xl bg-sage-100/70 p-4 text-sm">
                  <p className="font-semibold text-forest-900">
                    Available seats
                  </p>
                  <p className="mt-1 text-forest-900/70">
                    {library.availableSeats} seats
                  </p>
                </div>
                <div className="rounded-2xl bg-sage-100/70 p-4 text-sm">
                  <p className="font-semibold text-forest-900">Occupancy</p>
                  <p className="mt-1 text-forest-900/70">
                    {100 - availablePercent}% filled
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <p className="text-sm font-semibold text-forest-900">Book a seat</p>
            <p className="mt-2 text-sm text-forest-900/70">
              Choose a plan and slot that matches your schedule.
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm">
                <p className="font-semibold text-forest-900">Monthly plan</p>
                <p className="mt-1 text-forest-900/70">
                  Rs. {library.fees.monthly} per month
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm">
                <p className="font-semibold text-forest-900">Quarterly plan</p>
                <p className="mt-1 text-forest-900/70">
                  Rs. {library.fees.quarterly} every 3 months
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm">
                <p className="font-semibold text-forest-900">Annual plan</p>
                <p className="mt-1 text-forest-900/70">
                  Rs. {library.fees.annual} per year
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button className="h-12 rounded-full bg-forest-700 px-6 text-sm font-semibold text-sand-100 transition hover:bg-forest-900">
                Book now
              </button>
              <button className="h-12 rounded-full border border-line bg-white px-6 text-sm font-semibold text-forest-900 transition hover:border-forest-700">
                Join waitlist
              </button>
              <button className="h-12 rounded-full border border-line bg-white px-6 text-sm font-semibold text-forest-900 transition hover:border-forest-700">
                Chat with owner
              </button>
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <p className="text-sm font-semibold text-forest-900">
              Plan pricing
            </p>
            <table className="mt-4 w-full text-sm text-forest-900/70">
              <thead>
                <tr className="text-left">
                  <th className="py-2">Plan</th>
                  <th className="py-2">Fee</th>
                </tr>
              </thead>
              <tbody className="border-t border-line">
                <tr>
                  <td className="py-2">Monthly</td>
                  <td className="py-2">Rs. {library.fees.monthly}</td>
                </tr>
                <tr>
                  <td className="py-2">Quarterly</td>
                  <td className="py-2">Rs. {library.fees.quarterly}</td>
                </tr>
                <tr>
                  <td className="py-2">Annual</td>
                  <td className="py-2">Rs. {library.fees.annual}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <p className="text-sm font-semibold text-forest-900">Facilities</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {library.facilities.map((facility) => (
                <span
                  key={facility}
                  className="rounded-full border border-line bg-white px-3 py-1 text-forest-900"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <p className="text-sm font-semibold text-forest-900">
              Student types
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {library.studentTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-sage-100 px-3 py-1 text-forest-900"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">
                Seat availability by slot
              </p>
              <Link
                className="text-sm font-semibold text-forest-700"
                href="/map"
              >
                View seat map
              </Link>
            </div>
            <div className="mt-4 grid gap-4">
              {slots.map((slot) => {
                const percent = Math.max(
                  0,
                  Math.min(
                    100,
                    Math.round((slot.availableSeats / slot.totalSeats) * 100)
                  )
                );

                return (
                  <div
                    key={slot.id}
                    className="rounded-2xl border border-line bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-forest-900">
                          {slot.name}
                        </p>
                        <p className="text-sm text-forest-900/70">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                      <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-forest-900">
                        {slot.availableSeats}/{slot.totalSeats} seats
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-sage-100">
                      <div
                        className="h-2 rounded-full bg-forest-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-card border border-line bg-sage-100/70 p-6 shadow-soft">
            <p className="text-sm font-semibold text-forest-900">Map preview</p>
            <div className="mt-4 h-48 rounded-2xl bg-gradient-to-br from-sage-100 via-sage-200 to-sand-100" />
            <p className="mt-4 text-sm text-forest-900/70">
              Get directions, distance filters, and seat colors by opening the
              live map.
            </p>
            <button className="mt-4 h-11 w-full rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900">
              Open live map
            </button>
          </div>
        </section>

        <section className="mt-10" id="reviews">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl text-forest-900">
              Verified reviews
            </h2>
            <button className="h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-forest-900 transition hover:border-forest-700">
              Write a review
            </button>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-line bg-white/80 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-forest-900">
                      {review.studentName}
                    </p>
                    <p className="text-sm text-forest-900/70">
                      {review.date}
                    </p>
                  </div>
                  <p className="text-sm text-forest-900/70">
                    Rating {review.rating}/5
                  </p>
                </div>
                <p className="mt-3 text-sm text-forest-900/80">
                  {review.comment}
                </p>
                {review.isVerified ? (
                  <span className="mt-4 inline-flex rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-forest-900">
                    Verified student
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </main>

    </div>
  );
}
