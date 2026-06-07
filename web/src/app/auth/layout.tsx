const highlights = [
  "Verified library profiles",
  "Shift-wise seat booking",
  "Digital ID QR access",
  "Waitlist notifications",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <aside className="rounded-card border border-line bg-white/70 p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
              Scholar&apos;s Hub
            </p>
            <h1 className="mt-3 font-display text-3xl text-forest-900">
              Study spaces, sorted by city and seat.
            </h1>
            <p className="mt-3 text-sm text-forest-900/70">
              Create an account to explore verified libraries, compare shifts,
              and reserve seats without visiting each location.
            </p>
            <div className="mt-6 grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-forest-900"
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
