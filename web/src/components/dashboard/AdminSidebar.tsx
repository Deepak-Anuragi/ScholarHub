"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Bell,
  BookMarked,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  TrendingUp,
  Users,
  Building2,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin",                label: "Overview",       icon: LayoutDashboard },
  { href: "/admin/libraries",      label: "Libraries",      icon: Building2 },
  { href: "/admin/students",       label: "Students",       icon: Users },
  { href: "/admin/revenue",        label: "Revenue",        icon: TrendingUp },
  { href: "/admin/courses",        label: "Courses",        icon: GraduationCap },
  { href: "/admin/notifications",  label: "Notifications",  icon: Bell },
  { href: "/admin/chat",           label: "Chat Monitor",   icon: MessageCircle },
];

const MOBILE_NAV = [
  { href: "/admin",           label: "Home",      icon: LayoutDashboard },
  { href: "/admin/libraries", label: "Libraries", icon: Building2 },
  { href: "/admin/students",  label: "Students",  icon: Users },
  { href: "/admin/revenue",   label: "Revenue",   icon: TrendingUp },
  { href: "/admin/courses",   label: "Courses",   icon: GraduationCap },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-forest-900 text-white shadow-sm"
          : "text-forest-900/70 hover:bg-sage-100 hover:text-forest-900"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

function MobileNavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
        active ? "text-forest-900" : "text-forest-900/40"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
      {label}
    </Link>
  );
}

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const initials = (user?.name ?? "A")
    .split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  const handleLogout = async () => { await logout(); router.push("/"); };

  return (
    <>
      <aside className="sticky top-[var(--header-height)] hidden h-[calc(100vh-var(--header-height))] w-60 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-forest-900 text-white shadow-sm">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-forest-900">Scholar's Hub</p>
            <p className="text-[11px] text-forest-900/50">Admin Panel</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ href, label, icon }) => (
            <NavItem key={href} href={href} label={label} icon={icon} exact={href === "/admin"} />
          ))}
        </nav>

        <div className="border-t border-line p-3">
          {user && (
            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-sage-100/60 px-3 py-2">
              <Avatar size="sm">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                <AvatarFallback className="bg-forest-900/10 text-xs font-bold text-forest-900">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-forest-900">{user.name}</p>
                <p className="truncate text-[10px] text-forest-900/50">{user.email}</p>
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-line bg-white/95 backdrop-blur-sm lg:hidden" aria-label="Admin mobile nav">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => (
          <MobileNavItem key={href} href={href} label={label} icon={Icon} />
        ))}
      </nav>
    </>
  );
}
