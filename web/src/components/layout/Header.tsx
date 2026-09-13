"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Menu } from "lucide-react";
import { useState } from "react";

import ShinyText from "@/components/ShinyText";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { getDashboardPath } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Libraries", href: "/libraries" },
  { label: "Map", href: "/map" },
  { label: "Courses", href: "/courses" },
];

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative text-sm font-medium transition-colors",
        isActive
          ? "text-forest-900 dark:text-foreground"
          : "text-forest-900/70 hover:text-forest-900 dark:text-muted-foreground dark:hover:text-foreground"
      )}
    >
      {label}
      {isActive ? (
        <span className="absolute -bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#16a34a]" />
      ) : null}
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open account menu"
        >
          <Avatar size="default">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-[#16a34a]/15 text-[#16a34a]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(getDashboardPath(user.role))}>
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleLogout()}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthButtons({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/auth/login" onClick={onNavigate}>
          Sign In
        </Link>
      </Button>
      <Button
        size="sm"
        className="bg-[#16a34a] text-white hover:bg-[#15803d]"
        asChild
      >
        <Link href="/auth/signup" onClick={onNavigate}>
          Register
        </Link>
      </Button>
    </div>
  );
}

function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
        <SheetHeader>
          <SheetTitle className="text-left font-display text-forest-900">
            Scholar&apos;s Hub
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              onClick={() => onOpenChange(false)}
            />
          ))}
        </nav>
        <div className="mt-8 border-t border-line pt-6">
          {isLoading ? (
            <div className="h-9 w-full animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          ) : (
            <AuthButtons onNavigate={() => onOpenChange(false)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  const scrolled = useScrollPosition();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-[var(--header-height)] border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-line/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-border dark:bg-background/95"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white shadow-sm">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <ShinyText
            text="Scholar's Hub"
            speed={3}
            color="#16a34a"
            shineColor="#86efac"
            className="font-display text-lg font-semibold sm:text-xl"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex md:items-center md:gap-2">
            {isLoading ? (
              <div className="h-9 w-28 animate-pulse rounded-full bg-muted" />
            ) : isAuthenticated ? (
              <>
                <NotificationBell />
                <UserMenu />
              </>
            ) : (
              <AuthButtons />
            )}
          </div>
          <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
        </div>
      </div>
    </header>
  );
}
