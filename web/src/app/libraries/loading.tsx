import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Loading() {
  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-6">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
            <div className="grid gap-4 animate-pulse">
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
                  <div className="h-36 rounded-2xl bg-sage-100 animate-pulse" />
                  <div className="mt-4 grid gap-3 animate-pulse">
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
      <SiteFooter />
    </div>
  );
}
