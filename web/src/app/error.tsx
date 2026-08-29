"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[calc(100vh-var(--header-height))] place-items-center bg-sand-100 px-4 py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#16a34a] text-white shadow-soft">
          <BookOpen className="size-8" aria-hidden />
        </div>
        <h1 className="mt-8 font-display text-3xl text-forest-900">Something went wrong</h1>
        <p className="mt-3 text-forest-900/65">We couldn&apos;t load this page. Please try again.</p>
        {process.env.NODE_ENV === "development" ? <pre className="mt-4 max-w-full overflow-auto rounded-xl bg-white p-3 text-left text-xs text-red-700">{error.message}</pre> : null}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => reset()} className="bg-[#16a34a] text-white hover:bg-[#15803d]">Try Again</Button>
          <Button asChild variant="outline"><Link href="/">Go to Home</Link></Button>
        </div>
      </div>
    </main>
  );
}
