"use client";

import AnimatedContent from "@/components/AnimatedContent/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";

const stats = [
  {
    value: 500,
    suffix: "+",
    label: "Libraries Listed",
    decimals: 0,
  },
  {
    value: 50,
    suffix: "+",
    label: "Cities Covered",
    decimals: 0,
  },
  {
    value: 10000,
    suffix: "+",
    label: "Students Enrolled",
    decimals: 0,
  },
  {
    value: 4.8,
    suffix: "",
    label: "Average Rating",
    decimals: 1,
  },
];

export function StatsSection() {
  return (
    <section className="border-y border-line bg-white/80 py-14 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-4 sm:gap-6 sm:px-6 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <AnimatedContent
            key={stat.label}
            direction="vertical"
            distance={40}
            delay={0.1 * index}
            className="rounded-2xl border border-line bg-sand-100/50 p-5 text-center shadow-soft sm:p-6"
          >
            <p className="font-display text-3xl font-bold text-forest-900 sm:text-4xl">
              <CountUp
                end={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals}
                duration={2.2}
              />
            </p>
            <p className="mt-2 text-sm font-medium text-forest-900/70">
              {stat.label}
            </p>
          </AnimatedContent>
        ))}
      </div>
    </section>
  );
}
