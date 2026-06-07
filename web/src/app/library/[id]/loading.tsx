export default function Loading() {
  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft animate-pulse">
            <div className="h-56 rounded-2xl bg-sage-100" />
            <div className="mt-4 h-5 w-40 rounded-full bg-sage-100" />
            <div className="mt-2 h-4 w-56 rounded-full bg-sage-100" />
            <div className="mt-4 h-4 w-full rounded-full bg-sage-100" />
          </div>
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft animate-pulse">
            <div className="h-5 w-32 rounded-full bg-sage-100" />
            <div className="mt-4 h-10 w-full rounded-full bg-sage-100" />
            <div className="mt-3 h-10 w-full rounded-full bg-sage-100" />
            <div className="mt-3 h-10 w-full rounded-full bg-sage-100" />
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`detail-skeleton-${index}`}
              className="rounded-card border border-line bg-white/80 p-5 shadow-soft animate-pulse"
            >
              <div className="h-4 w-32 rounded-full bg-sage-100" />
              <div className="mt-3 h-4 w-full rounded-full bg-sage-100" />
              <div className="mt-2 h-4 w-4/5 rounded-full bg-sage-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
