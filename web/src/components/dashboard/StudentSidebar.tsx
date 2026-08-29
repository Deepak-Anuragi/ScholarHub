"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  BookMarked,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Star,
  User,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/student",          label: "Overview",   icon: LayoutDashboard },
  { href: "/student/bookings", label: "My Bookings", icon: BookMarked },
  { href: "/student/payments", label: "Payments",   icon: CreditCard },
  { href: "/student/courses",  label: "Courses",    icon: GraduationCap },
  { href: "/student/reviews",  label: "Reviews",    icon: Star },
  { href: "/student/waitlist", label: "Waitlist",   icon: Users },
  { href: "/student/chat",     label: "Chat",       icon: MessageCircle },
  { href: "/student/profile",  label: "Profile",    icon: User },
];

// Bottom-nav items for mobile (5 most-used)
const MOBILE_NAV = [
  { href: "/student",          label: "Home",     icon: LayoutDashboard },
  { href: "/student/bookings", label: "Bookings", icon: BookMarked },
  { href: "/student/payments", label: "Payments", icon: CreditCard },
  { href: "/student/courses",  label: "Courses",  icon: GraduationCap },
  { href: "/student/profile",  label: "Profile",  icon: User },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
  badge,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-[#16a34a] text-white shadow-sm"
          : "text-forest-900/70 hover:bg-sage-100 hover:text-forest-900"
      )}
      aria-current={active ? "page" : undefined}
    >
      <div className="flex items-center gap-3">
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </div>
      {Boolean(badge && badge > 0) && (
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
            active ? "bg-white text-[#16a34a]" : "bg-[#16a34a] text-white"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function StudentSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ unreadCount?: number }>("/chat/unread-count")
      .then((d) => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => setUnreadCount(0));
  }, [user]);

  const initials = (user?.name ?? "S")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="sticky top-[var(--header-height)] hidden h-[calc(100vh-var(--header-height))] w-60 shrink-0 flex-col border-r border-line bg-white lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#16a34a] text-white shadow-sm">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-forest-900">Scholar's Hub</p>
            <p className="text-[11px] text-forest-900/50">Student Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              exact={href === "/student"}
              badge={href === "/student/chat" ? unreadCount : undefined}
            />
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-line p-3">
          {user && (
            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-sage-100/60 px-3 py-2">
              <Avatar size="sm">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-[#16a34a]/15 text-xs font-bold text-[#16a34a]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-forest-900">
                  {user.name}
                </p>
                <p className="truncate text-[10px] text-forest-900/50">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-forest-900/60 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-line bg-white/95 backdrop-blur-sm lg:hidden"
        aria-label="Mobile navigation"
      >
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          return (
            <MobileNavItem key={href} href={href} label={label} icon={Icon} />
          );
        })}
      </nav>
    </>
  );
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  const pathname = usePathname();
  const active =
    href === "/student"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
        active ? "text-[#16a34a]" : "text-forest-900/50"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
      {label}
    </Link>
  );
}
