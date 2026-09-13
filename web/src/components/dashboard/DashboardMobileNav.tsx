"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DashboardNavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  /** Shorter wording for the bottom bar, where space is tight. */
  shortLabel?: string;
}

function isActive(pathname: string, href: string, rootHref: string): boolean {
  return href === rootHref
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

/**
 * The bottom bar on phones.
 *
 * Each dashboard used to publish a curated list of five links, which left the
 * rest of its pages with no route at all on a phone — chat included, while the
 * desktop sidebar still showed an unread badge for it. Four links now sit in
 * the bar and everything else is one tap away under "More", so every page in
 * `items` is reachable.
 */
export function DashboardMobileNav({
  items,
  primary,
  rootHref,
  badges = {},
  title = "More",
}: {
  /** Every page in this dashboard. */
  items: DashboardNavLink[];
  /** The four hrefs that get their own tab; the rest go under More. */
  primary: string[];
  /** Matched exactly, so the overview is not active on every child route. */
  rootHref: string;
  /** Unread counts by href, e.g. chat. */
  badges?: Record<string, number>;
  title?: string;
}) {
  const pathname = usePathname();
  // Every link inside closes the sheet as it navigates, so the sheet never
  // outlives the page it was opened from.
  const [open, setOpen] = useState(false);

  const barItems = primary
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is DashboardNavLink => Boolean(item));
  const restItems = items.filter((item) => !primary.includes(item.href));

  const restBadgeTotal = restItems.reduce(
    (sum, item) => sum + (badges[item.href] ?? 0),
    0
  );
  const restIsActive = restItems.some((item) => isActive(pathname, item.href, rootHref));

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-line bg-white/95 backdrop-blur-sm lg:hidden"
        aria-label="Mobile navigation"
      >
        {barItems.map((item) => (
          <MobileNavLink
            key={item.href}
            item={item}
            rootHref={rootHref}
            badge={badges[item.href]}
          />
        ))}

        {restItems.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              restIsActive ? "text-[#16a34a]" : "text-forest-900/50"
            )}
          >
            <MoreHorizontal
              className={cn("size-5", restIsActive && "stroke-[2.5]")}
              aria-hidden
            />
            {title}
            {restBadgeTotal > 0 && (
              <span className="absolute right-[calc(50%-1.25rem)] top-1 flex size-4 items-center justify-center rounded-full bg-[#16a34a] text-[9px] font-bold text-white">
                {restBadgeTotal}
              </span>
            )}
          </button>
        )}
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-white lg:hidden">
          <SheetHeader>
            <SheetTitle className="text-forest-900">{title}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 pb-2">
            {restItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href, rootHref);
              const badge = badges[href] ?? 0;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-xs font-medium transition-colors",
                    active
                      ? "border-[#16a34a] bg-[#16a34a] text-white"
                      : "border-line text-forest-900/70 hover:bg-sage-100"
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {label}
                  {badge > 0 && (
                    <span
                      className={cn(
                        "absolute right-2 top-2 flex size-4 items-center justify-center rounded-full text-[9px] font-bold",
                        active ? "bg-white text-[#16a34a]" : "bg-[#16a34a] text-white"
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MobileNavLink({
  item,
  rootHref,
  badge,
}: {
  item: DashboardNavLink;
  rootHref: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const { href, label, shortLabel, icon: Icon } = item;
  const active = isActive(pathname, href, rootHref);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
        active ? "text-[#16a34a]" : "text-forest-900/50"
      )}
    >
      <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
      {shortLabel ?? label}
      {Boolean(badge && badge > 0) && (
        <span className="absolute right-[calc(50%-1.25rem)] top-1 flex size-4 items-center justify-center rounded-full bg-[#16a34a] text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
