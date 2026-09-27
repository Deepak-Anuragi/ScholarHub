"use client";

import { Library, MapPin, Users, Star } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";

const stats = [
  { value: 500,   suffix: "+", label: "Libraries Listed",   decimals: 0, icon: Library,  color: "text-[#16a34a]", bg: "bg-[#16a34a]/10" },
  { value: 50,    suffix: "+", label: "Cities Covered",     decimals: 0, icon: MapPin,   color: "text-blue-500",  bg: "bg-blue-50" },
  { value: 10000, suffix: "+", label: "Students Enrolled",  decimals: 0, icon: Users,    color: "text-purple-500",bg: "bg-purple-50" },
  { value: 4.8,   suffix: "",  label: "Average Rating",     decimals: 1, icon: Star,     color: "text-amber-500", bg: "bg-amber-50" },
];

export function StatsSection() {
  return (
    <section className="border-y border-line bg-white/80 dark:bg-[#111113] dark:border-[#27272a] py-14 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-4 sm:gap-6 sm:px-6 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <AnimatedContent
            key={stat.label}
            direction="vertical"
            distance={40}
            delay={0.1 * index}
            className="flex flex-col items-center rounded-2xl border border-line bg-sand-100/50 p-5 text-center shadow-soft sm:p-6"
          >
            <div className={`flex size-11 items-center justify-center rounded-2xl ${stat.bg} mb-3`}>
              <stat.icon className={`size-5 ${stat.color}`} />
            </div>
            <p className="font-display text-3xl font-bold text-forest-900 sm:text-4xl">
              <CountUp end={stat.value} suffix={stat.suffix} decimals={stat.decimals} duration={2.2} />
            </p>
            <p className="mt-1.5 text-sm font-medium text-forest-900/60">{stat.label}</p>
          </AnimatedContent>
        ))}
      </div>
    </section>
  );
}