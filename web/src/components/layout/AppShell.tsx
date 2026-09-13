"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** The three dashboards carry their own sidebar, user block and logout. */
const DASHBOARD_ROUTE = /^\/(student|owner|admin)(\/|$)/;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Scrolling past a payout ledger should not land in the marketing footer.
  // The Header stays: it carries the notification bell.
  const isDashboard = DASHBOARD_ROUTE.test(pathname);

  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-var(--header-height))] flex-1 flex-col">
        {children}
      </div>
      {!isDashboard && <Footer />}
    </>
  );
}
