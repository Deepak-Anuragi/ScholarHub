import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Loading() {
  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-card border border-line bg-white/80 p-6 shadow-soft animate-pulse">
            <div className="h-10 w-1/2 rounded-full bg-sage-100" />
            <div className="mt-4 h-[360px] rounded-2xl bg-sage-100" />
          </section>
          <aside className="rounded-card border border-line bg-white/80 p-6 shadow-soft animate-pulse">
            <div className="h-5 w-32 rounded-full bg-sage-100" />
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`map-skeleton-${index}`}
                  className="h-12 rounded-2xl bg-sage-100"
                />
              ))}
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
