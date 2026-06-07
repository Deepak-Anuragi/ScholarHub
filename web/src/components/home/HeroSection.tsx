"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

import Aurora from "@/components/Aurora/Aurora";
import BlurText from "@/components/BlurText/BlurText";
import TextType from "@/components/TextType/TextType";
import { Button } from "@/components/ui/button";

const CITIES = ["Bhopal", "Indore", "Jabalpur", "Gwalior"];

const EXAM_TYPES = [
  { label: "Govt Exam", value: "govt-exam" },
  { label: "Entrance Exam", value: "entrance-exam" },
  { label: "School", value: "school" },
  { label: "Professional", value: "professional" },
];

export function HeroSection() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [examType, setExamType] = useState(EXAM_TYPES[0].value);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (examType) params.set("exam_type", examType);
    const query = params.toString();
    router.push(query ? `/libraries?${query}` : "/libraries");
  };

  return (
    <section className="relative flex min-h-[calc(100vh-var(--header-height))] items-center overflow-hidden">
      <Aurora
        colorStops={["#bbf7d0", "#bfdbfe", "#fff"]}
        speed={0.4}
        amplitude={1.0}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-sand-100/80" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
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

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 max-w-2xl rounded-2xl border border-line/80 bg-white/90 p-3 shadow-soft backdrop-blur-sm sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="hero-city">
                City
              </label>
              <input
                id="hero-city"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Enter your city"
                className="h-12 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-forest-900 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
              />
              <label className="sr-only" htmlFor="hero-exam-type">
                Exam type
              </label>
              <select
                id="hero-exam-type"
                value={examType}
                onChange={(event) => setExamType(event.target.value)}
                className="h-12 rounded-xl border border-line bg-white px-4 text-sm text-forest-900 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 sm:min-w-[11rem]"
              >
                {EXAM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                className="h-12 bg-[#16a34a] px-6 text-white hover:bg-[#15803d]"
              >
                <Search className="size-4" />
                Search
              </Button>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 w-full bg-[#16a34a] px-8 text-white hover:bg-[#15803d] sm:w-auto"
              asChild
            >
              <Link href="/libraries">Browse Libraries</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-forest-900/20 bg-white/80 px-8 text-forest-900 hover:bg-white sm:w-auto"
              asChild
            >
              <Link href="/auth/signup?role=owner">List Your Library</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
