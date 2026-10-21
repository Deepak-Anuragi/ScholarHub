"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** Routes that should NOT show the public Header / Footer. */
const NO_CHROME_PREFIXES = [
  "/student",
  "/owner",
  "/admin",
  "/auth",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = NO_CHROME_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (hideChrome) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        {children}
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-var(--header-height))] flex-1 flex-col">
        {children}
      </div>
      <Footer />
    </>
  );
}