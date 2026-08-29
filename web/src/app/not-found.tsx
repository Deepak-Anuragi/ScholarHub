import Link from "next/link";
import { BookOpen } from "lucide-react";

import Aurora from "@/components/Aurora";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative grid min-h-[calc(100vh-var(--header-height))] place-items-center overflow-hidden bg-sand-100 px-4 py-16 text-center">
      <Aurora colorStops={["#16a34a", "#a8d8b9", "#f0e3d7"]} amplitude={0.7} blend={0.35} className="pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative z-10 max-w-lg">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#16a34a] text-white shadow-soft">
          <BookOpen className="size-8" aria-hidden="true" />
        </div>
        <p className="mt-8 font-display text-6xl text-forest-900">404</p>
        <h1 className="mt-2 font-display text-3xl text-forest-900">Page Not Found</h1>
        <p className="mt-3 text-forest-900/65">The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-[#16a34a] text-white hover:bg-[#15803d]"><Link href="/">Go to Home</Link></Button>
          <Button asChild variant="outline"><Link href="/libraries">Browse Libraries</Link></Button>
        </div>
      </div>
    </main>
  );
}
