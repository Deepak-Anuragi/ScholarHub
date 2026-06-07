export default function Loading() {
  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-6">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
            <div className="grid animate-pulse gap-4">
              <div className="h-5 w-32 rounded-full bg-sage-100" />
              <div className="h-11 w-full rounded-xl bg-sage-100" />
              <div className="h-5 w-24 rounded-full bg-sage-100" />
              <div className="h-11 w-full rounded-xl bg-sage-100" />
              <div className="h-5 w-36 rounded-full bg-sage-100" />
              <div className="h-11 w-full rounded-xl bg-sage-100" />
              <div className="h-11 w-full rounded-full bg-sage-100" />
            </div>
          </aside>
          <section>
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="rounded-card border border-line bg-white/80 p-5 shadow-soft"
                >
                  <div className="h-36 animate-pulse rounded-2xl bg-sage-100" />
                  <div className="mt-4 grid animate-pulse gap-3">
                    <div className="h-4 w-40 rounded-full bg-sage-100" />
                    <div className="h-4 w-32 rounded-full bg-sage-100" />
                    <div className="h-4 w-full rounded-full bg-sage-100" />
                    <div className="h-11 w-full rounded-full bg-sage-100" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
