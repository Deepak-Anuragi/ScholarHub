"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { useTheme } from "next-themes";

import Aurora from "@/components/Aurora";
import BlurText from "@/components/BlurText";
import TextType from "@/components/TextType";
import { Button } from "@/components/ui/button";

const CITIES = ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Satna", "Rewa", "Narsimhapur", "Ratlam", "Morena", "Shivpuri", "Chhindwara", "Dewas", "Mandla", "Balaghat", "Sehore", "Sidhi", "Hoshangabad", "Barwani", "Burhanpur", "Jhabua", "Vidisha"];

const EXAM_TYPES = [
  { label: "Govt Exam",     value: "govt-exam" },
  { label: "Entrance Exam", value: "entrance-exam" },
  { label: "School",        value: "school" },
  { label: "Professional",  value: "professional" },
];

/* Aurora colour stops per theme */
const AURORA_LIGHT = ["#bbf7d0", "#bfdbfe", "#f0fdf4"]; /* soft green-blue pastel */
const AURORA_DARK  = ["#00ff88", "#0ea5e9", "#7c3aed"]; /* vivid green -> cyan -> violet */

export function HeroSection() {
  const router = useRouter();
  const [city, setCity]         = useState("");
  const [examType, setExamType] = useState(EXAM_TYPES[0].value);
  const { resolvedTheme }       = useTheme();

  const isDark      = resolvedTheme === "dark";
  const auroraStops = isDark ? AURORA_DARK : AURORA_LIGHT;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (examType)    params.set("exam_type", examType);
    const query = params.toString();
    router.push(query ? `/libraries?${query}` : "/libraries");
  };

  return (
    <section className="relative flex min-h-[calc(100vh-var(--header-height))] items-center overflow-hidden">

      {/* Dynamic Aurora — light-friendly pastels, dark-friendly deep tones */}
      <Aurora
        colorStops={auroraStops}
        speed={isDark ? 0.5 : 0.4}
        amplitude={isDark ? 1.4 : 1.0}
        blend={isDark ? 0.5 : 0.6}
      />

      {/* Fade gradient — blends Aurora into page background */}
      <div className={isDark ? "pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/50 to-[#09090b]" : "pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-sand-100/40 to-sand-100"} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#16a34a]/30 bg-[#16a34a]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#16a34a]">
            <span className="size-1.5 rounded-full bg-[#16a34a] animate-pulse" />
            500+ verified libraries across India
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-forest-900 sm:text-5xl lg:text-6xl">
            Find the Best Library
            <span className="mt-2 block text-3xl sm:text-4xl lg:text-5xl">
              in{" "}
              <TextType
                as="span"
                text={CITIES}
                typingSpeed={70}
                deletingSpeed={40}
                pauseDuration={1800}
                showCursor
                cursorCharacter="|"
                cursorClassName="ml-1 text-[#16a34a]"
                className="font-bold text-[#16a34a]"
                textColors={["#16a34a"]}
              />
            </span>
          </h1>

          <BlurText
            text="Browse 500+ study libraries. Compare seats, fees & facilities. Book online in seconds."
            delay={150}
            animateBy="words"
            direction="top"
            immediate
            className="mx-auto mt-6 max-w-2xl justify-center text-base text-forest-900/75 sm:text-lg"
          />

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 max-w-2xl rounded-2xl border border-line/80 bg-white/90 dark:bg-[#18181b] dark:border-[#27272a] p-3 shadow-lift backdrop-blur-md sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="hero-city">City</label>
              <input
                id="hero-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city…"
                className="h-12 flex-1 rounded-xl border border-line bg-white dark:bg-[#27272a] dark:text-white dark:placeholder:text-[#71717a] dark:border-[#3f3f46] px-4 text-sm text-forest-900 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
              />
              <label className="sr-only" htmlFor="hero-exam-type">Exam type</label>
              <select
                id="hero-exam-type"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="h-12 rounded-xl border border-line bg-white dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46] px-4 text-sm text-forest-900 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 sm:min-w-[11rem]"
              >
                {EXAM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <Button
                type="submit"
                className="h-12 bg-[#16a34a] px-6 text-white hover:bg-[#15803d] gap-2 font-semibold"
              >
                <Search className="size-4" />
                Search
              </Button>
            </div>
          </form>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 w-full bg-[#16a34a] px-8 text-white hover:bg-[#15803d] shadow-lg shadow-[#16a34a]/25 sm:w-auto"
              asChild
            >
              <Link href="/libraries">Browse Libraries</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-forest-900/20 bg-white/80 dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 px-8 text-forest-900 hover:bg-white sm:w-auto"
              asChild
            >
              <Link href="/auth/signup?role=owner">List Your Library</Link>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mt-6 text-xs text-forest-900/50 dark:text-white/40">
            Trusted by 10,000+ students · Instant booking · No commission
          </p>
        </div>
      </div>
    </section>
  );
}