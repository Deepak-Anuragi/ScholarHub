"use client";

import { BookMarked, MapPin, Search, CheckCircle } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";

const steps = [
  {
    icon: Search,
    title: "Search your city",
    description: "Find verified libraries near you by city and exam type. Filter by seats, fees, and shifts.",
    step: "01",
  },
  {
    icon: MapPin,
    title: "Compare libraries",
    description: "Review seats, fees, amenities, and live availability side by side with our smart filters.",
    step: "02",
  },
  {
    icon: BookMarked,
    title: "Book & pay online",
    description: "Reserve your seat in seconds with secure online payment and get instant confirmation.",
    step: "03",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-sand-100 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#16a34a]">How it works</p>
          <h2 className="mt-2 font-display text-3xl text-forest-900 sm:text-4xl">
            Three steps to your perfect study spot
          </h2>
          <p className="mt-3 text-sm text-forest-900/70">No calls, no confusion — just search, compare, and book.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <AnimatedContent
              key={step.title}
              direction="vertical"
              distance={40}
              delay={0.15 * index}
              className="relative rounded-card border border-line bg-white/80 p-6 shadow-soft"
            >
              {/* Step number watermark */}
              <span className="absolute right-5 top-4 font-display text-5xl font-bold text-forest-900/5 select-none">
                {step.step}
              </span>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16a34a]/10 text-[#16a34a]">
                <step.icon className="size-6" aria-hidden />
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#16a34a]">
                Step {index + 1}
              </p>
              <h3 className="mt-1.5 text-xl font-semibold text-forest-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-forest-900/70">{step.description}</p>

              <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-[#16a34a]">
                <CheckCircle className="size-3.5" />
                Free to browse
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}