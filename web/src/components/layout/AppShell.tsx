"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

const DASHBOARD_PREFIXES = ["/admin", "/owner", "/student"];

function shouldHideChrome(pathname: string) {
  return DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = shouldHideChrome(pathname);

  return (
    <>
      {!hideChrome ? <Header /> : null}
      <div
        className={
          hideChrome
            ? "flex min-h-screen flex-1 flex-col"
            : "flex min-h-[calc(100vh-var(--header-height))] flex-1 flex-col"
        }
      >
        {children}
      </div>
      {!hideChrome ? <Footer /> : null}
    </>
  );
}
