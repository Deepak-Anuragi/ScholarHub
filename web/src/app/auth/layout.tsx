import { BookOpen, MapPin, QrCode, Bell, CheckCircle } from "lucide-react";

const highlights = [
  { icon: CheckCircle, text: "Verified library profiles with real photos" },
  { icon: MapPin,      text: "Shift-wise seat booking across 50+ cities" },
  { icon: QrCode,      text: "Digital ID QR access — no paperwork" },
  { icon: Bell,        text: "Waitlist notifications in real time" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sand-100 dark:bg-[#09090b]">
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

          {/* -- Left panel --------------------------------------- */}
          <aside className="relative overflow-hidden rounded-card border border-line bg-gradient-to-br from-[#16a34a] to-[#15803d] p-8 shadow-lift dark:border-[#16a34a]/30">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -right-10 -top-10 size-52 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full bg-black/15 blur-2xl" />

            <div className="relative">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <BookOpen className="size-6 text-white" />
              </div>

              <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                Your next study space,<br />one tap away.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Explore verified libraries, compare shifts and fees, and reserve seats — without visiting each location.
              </p>

              <ul className="mt-8 space-y-3">
                {highlights.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Icon className="size-3.5 text-white" />
                    </span>
                    <span className="text-sm text-white/90">{text}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-xs text-white/60">
                Trusted by 10,000+ students across India
              </p>
            </div>
          </aside>

          {/* -- Right panel (form) ------------------------------- */}
          <div className="rounded-card border border-line bg-white dark:bg-[#18181b] dark:border-[#27272a] p-6 shadow-soft sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}