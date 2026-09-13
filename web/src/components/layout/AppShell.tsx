"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function AppShell({ children }: { children: React.ReactNode }) {
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
