import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  const featuredLibraries = [
    {
      name: "Green Arc Library",
      city: "Bhopal",
      rating: "4.8",
      fee: "Rs. 900",
      seats: "12",
      tags: ["WiFi", "AC", "CCTV"],
    },
    {
      name: "Pin Drop Reading Hall",
      city: "Indore",
      rating: "4.6",
      fee: "Rs. 750",
      seats: "6",
      tags: ["Locker", "Power", "Washroom"],
    },
    {
      name: "Focus Point Library",
      city: "Kota",
      rating: "4.9",
      fee: "Rs. 1100",
      seats: "18",
      tags: ["AC", "Parking", "CCTV"],
    },
    {
      name: "Sage Study Collective",
      city: "Jaipur",
      rating: "4.7",
      fee: "Rs. 820",
      seats: "9",
      tags: ["WiFi", "Drinking Water", "Generator"],
    },
  ];

  const steps = [
    {
      title: "Search your city",
      description:
        "Pick your city, exam type, and fee range to see verified libraries nearby.",
    },
    {
      title: "Compare and shortlist",
      description:
        "Review photos, amenities, and live seat availability before you decide.",
    },
    {
      title: "Book your seat",
      description:
        "Reserve a slot in seconds and get a digital ID for quick check-in.",
    },
  ];

  const stats = [
    { label: "Cities live", value: "48+" },
    { label: "Verified libraries", value: "1,200+" },
    { label: "Students matched", value: "96k" },
    { label: "Avg. seat fill", value: "87%" },
  ];

  const testimonials = [
    {
      name: "Ritika S.",
      role: "UPSC Aspirant, Delhi",
      quote:
        "The seat availability badge saved me so many trips. I booked the same day.",
    },
    {
      name: "Aditya V.",
      role: "JEE Aspirant, Kota",
      quote:
        "Shift-wise booking is perfect for coaching schedules. Payments were smooth.",
    },
    {
      name: "Muskan R.",
      role: "Library Owner, Indore",
      quote:
        "My occupancy is higher and the waitlist alerts keep me updated automatically.",
    },
  ];

  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-sage-200/60 blur-3xl animate-[float_12s_ease-in-out_infinite]" />
          <div className="absolute right-[-80px] top-24 h-64 w-64 rounded-full bg-sage-100/70 blur-3xl animate-[float_14s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-120px] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sage-300/40 blur-[120px]" />
        </div>

        <SiteHeader />

        <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-6">
          <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-[fade-up_800ms_ease-out]">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-medium text-forest-900">
                City-wise library discovery
                <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-forest-900">
                  Live seats
                </span>
              </span>
              <h1 className="mt-5 font-display text-4xl leading-tight text-forest-900 sm:text-5xl">
                Find calm, quiet, and focused study spaces across India.
              </h1>
              <p className="mt-4 text-lg text-forest-900/75">
                Search verified libraries, compare facilities, and book shifts
                instantly with secure digital IDs.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className="h-12 rounded-full bg-forest-700 px-6 text-sm font-semibold text-sand-100 transition hover:bg-forest-900">
                  Explore libraries
                </button>
                <button className="h-12 rounded-full border border-line bg-white/70 px-6 text-sm font-semibold text-forest-900 transition hover:border-forest-700">
                  Talk to an expert
                </button>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-soft"
                  >
                    <p className="text-lg font-semibold text-forest-900">
                      {item.value}
                    </p>
                    <p className="text-sm text-forest-900/70">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-card border border-line bg-white/80 p-6 shadow-lift backdrop-blur animate-[fade-up_900ms_ease-out]"
              style={{ animationDelay: "120ms" }}
            >
              <h2 className="font-display text-2xl text-forest-900">
                Search libraries
              </h2>
              <p className="mt-2 text-sm text-forest-900/70">
                Filter by city, exam type, and budget to see available seats.
              </p>
              <form className="mt-6 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-forest-900">
                    City
                    <input
                      className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                      placeholder="Delhi, Bhopal, Kota"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-forest-900">
                    Exam type
                    <select className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700">
                      <option>Govt Exam</option>
                      <option>Entrance Exam</option>
                      <option>School</option>
                      <option>Professional</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-medium text-forest-900">
                  Monthly fee range
                  <input
                    className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                    placeholder="Rs. 700 - Rs. 1500"
                  />
                </label>
                <button
                  className="h-12 rounded-full bg-forest-700 px-6 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
                  type="button"
                >
                  Search libraries
                </button>
              </form>
              <div className="mt-6 rounded-2xl border border-line bg-sage-100/70 p-4">
                <p className="text-sm font-semibold text-forest-900">
                  Popular now
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["UPSC", "JEE", "NEET", "SSC", "Banking"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white px-3 py-1 text-sm font-medium text-forest-900"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <section
        id="featured"
        className="mx-auto w-full max-w-6xl px-6 py-16"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
              Featured libraries
            </p>
            <h2 className="font-display text-3xl text-forest-900">
              Top-rated spaces with live seats
            </h2>
          </div>
          <button className="h-11 rounded-full border border-line bg-white/70 px-5 text-sm font-semibold text-forest-900 transition hover:border-forest-700">
            View all listings
          </button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {featuredLibraries.map((library) => (
            <div
              key={library.name}
              className="flex flex-col gap-4 rounded-card border border-line bg-white/80 p-6 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-forest-900">
                    {library.name}
                  </p>
                  <p className="text-sm text-forest-900/70">{library.city}</p>
                </div>
                <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-forest-900">
                  {library.seats} seats
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-forest-700 px-3 py-1 text-sm font-semibold text-sand-100">
                  {library.rating}
                </span>
                <span className="text-sm text-forest-900/70">
                  Starting at {library.fee}/month
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {library.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-white px-3 py-1 text-sm text-forest-900"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button className="h-11 rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900">
                View details
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-line bg-white/80"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
              How it works
            </p>
            <h2 className="mt-2 font-display text-3xl text-forest-900">
              A faster way to choose your study spot
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-card border border-line bg-sage-100/50 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-sand-100">
                  0{index + 1}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-forest-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-forest-900/75">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
              Live seat map
            </p>
            <h2 className="mt-2 font-display text-3xl text-forest-900">
              City-wide availability at a glance
            </h2>
            <p className="mt-3 text-sm text-forest-900/70">
              See color-coded pins, distance filters, and shift-based seats
              without leaving the map.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-forest-900/75">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-forest-700" />
                Green pins show seats available now
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sage-200" />
                Yellow pins show fewer than 5 seats
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sage-300" />
                Red pins show fully booked libraries
              </li>
            </ul>
          </div>
          <div className="rounded-card border border-line bg-sage-100/70 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">
                Seat demand pulse
              </p>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-forest-900">
                Updated 2 min ago
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { city: "Delhi", fill: "92%", trend: "+8%" },
                { city: "Lucknow", fill: "84%", trend: "+5%" },
                { city: "Kota", fill: "96%", trend: "+11%" },
                { city: "Pune", fill: "78%", trend: "+3%" },
              ].map((item) => (
                <div
                  key={item.city}
                  className="rounded-2xl bg-white/80 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-forest-900">
                    {item.city}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm text-forest-900/70">
                    <span>{item.fill} full</span>
                    <span className="font-semibold text-forest-700">
                      {item.trend}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-sage-100">
                    <div
                      className="h-2 rounded-full bg-forest-700"
                      style={{ width: item.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="testimonials"
        className="border-y border-line bg-white/80"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
                Testimonials
              </p>
              <h2 className="font-display text-3xl text-forest-900">
                Stories from students and owners
              </h2>
            </div>
            <button className="h-11 rounded-full border border-line bg-white/70 px-5 text-sm font-semibold text-forest-900 transition hover:border-forest-700">
              Read more stories
            </button>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure
                key={item.name}
                className="rounded-card border border-line bg-sage-100/60 p-6"
              >
                <blockquote className="text-sm text-forest-900/80">
                  "{item.quote}"
                </blockquote>
                <figcaption className="mt-4">
                  <p className="text-sm font-semibold text-forest-900">
                    {item.name}
                  </p>
                  <p className="text-sm text-forest-900/70">{item.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="rounded-card border border-line bg-forest-700 px-8 py-10 text-sand-100 shadow-lift">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sand-100/70">
                Ready to study smarter?
              </p>
              <h2 className="mt-3 font-display text-3xl">
                Claim your seat in minutes.
              </h2>
              <p className="mt-2 text-sm text-sand-100/80">
                Join thousands of students finding verified libraries without
                the commute.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="h-12 rounded-full bg-sand-100 px-6 text-sm font-semibold text-forest-900 transition hover:bg-white">
                Get started
              </button>
              <button className="h-12 rounded-full border border-sand-100/60 px-6 text-sm font-semibold text-sand-100 transition hover:border-white">
                Contact sales
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
