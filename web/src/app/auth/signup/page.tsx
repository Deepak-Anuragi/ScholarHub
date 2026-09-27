import Link from "next/link";
import { Building2, GraduationCap, ArrowRight, CheckCircle } from "lucide-react";

const roles = [
  {
    href: "/auth/signup/student",
    icon: GraduationCap,
    iconBg: "bg-[#16a34a]/10",
    iconColor: "text-[#16a34a]",
    title: "I am a Student",
    desc: "Find verified libraries near you. Compare fees, facilities, and availability.",
    perks: ["Browse 500+ libraries", "Book in 2 minutes", "Instant confirmation"],
    btnClass: "bg-[#16a34a] text-white hover:bg-[#15803d]",
    btnLabel: "Continue as Student",
    highlight: true,
  },
  {
    href: "/auth/signup/owner",
    icon: Building2,
    iconBg: "bg-forest-700/10",
    iconColor: "text-forest-700",
    title: "I Own a Library",
    desc: "List on Scholar's Hub and reach thousands of students in your city.",
    perks: ["Free listing", "Manage bookings", "Revenue dashboard"],
    btnClass: "border border-forest-700 text-forest-700 hover:bg-forest-700/5",
    btnLabel: "Register My Library",
    highlight: false,
  },
];

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#16a34a]">Get started — free</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-forest-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-1 text-sm text-forest-900/60 dark:text-white/50">
          Choose how you want to use Scholar&apos;s Hub
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map(({ href, icon: Icon, iconBg, iconColor, title, desc, perks, btnClass, btnLabel, highlight }) => (
          <div
            key={href}
            className={`relative flex flex-col gap-4 rounded-2xl border p-5 transition-all hover:shadow-soft ${
              highlight
                ? "border-[#16a34a]/30 bg-[#16a34a]/5 dark:bg-[#16a34a]/10"
                : "border-line bg-white dark:bg-[#27272a] dark:border-[#3f3f46]"
            }`}
          >
            {highlight && (
              <span className="absolute right-3 top-3 rounded-full bg-[#16a34a] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Popular
              </span>
            )}
            <span className={`flex size-11 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`size-6 ${iconColor}`} />
            </span>
            <div>
              <h3 className="font-semibold text-forest-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-forest-900/60 dark:text-white/50">{desc}</p>
            </div>
            <ul className="space-y-1.5">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-xs text-forest-900/70 dark:text-white/60">
                  <CheckCircle className="size-3.5 shrink-0 text-[#16a34a]" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href={href}
              className={`mt-auto flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${btnClass}`}
            >
              {btnLabel} <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-forest-900/60 dark:text-white/50">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-[#16a34a] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}