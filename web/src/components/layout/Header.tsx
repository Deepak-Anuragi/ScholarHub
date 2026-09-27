"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Menu, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

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
import ShinyText from "@/components/ShinyText";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { getDashboardPath } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home",      href: "/" },
  { label: "Libraries", href: "/libraries" },
  { label: "Map",       href: "/map" },
  { label: "Courses",   href: "/courses" },
];

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative text-sm font-medium transition-colors duration-200",
        isActive
          ? "text-[#16a34a]"
          : "text-forest-900/65 hover:text-forest-900 dark:text-white/60 dark:hover:text-white"
      )}
    >
      {label}
      {isActive && (
        <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-[#16a34a]" />
      )}
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const handleLogout = async () => { await logout(); router.push("/"); router.refresh(); };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none border-2 border-line transition focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2"
          aria-label="Open account menu"
        >
          <Avatar size="default">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
            <AvatarFallback className="bg-[#16a34a]/15 font-semibold text-[#16a34a]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(getDashboardPath(user.role))}>Dashboard</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/profile")}>Profile</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => void handleLogout()}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthButtons({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Button
      size="sm"
      className="rounded-full bg-[#16a34a] text-white hover:bg-[#15803d] gap-1.5 px-4 shadow-sm shadow-[#16a34a]/20"
      asChild
    >
      <Link href="/auth/login" onClick={onNavigate}>
        Sign In <ArrowRight className="size-3.5" />
      </Link>
    </Button>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 rounded-full" aria-label="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {[
          { value: "light",  label: "Light",  Icon: Sun },
          { value: "dark",   label: "Dark",   Icon: Moon },
          { value: "system", label: "System", Icon: Monitor },
        ].map(({ value, label, Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)} className="gap-2.5">
            <Icon className="size-4" />
            {label}
            {theme === value && <span className="ml-auto text-[#16a34a]">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100vw-2rem,22rem)]">
        <SheetHeader>
          <SheetTitle className="text-left font-display text-xl text-forest-900">
            Scholar&apos;s Hub
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} onClick={() => onOpenChange(false)} />
          ))}
        </nav>
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <ThemeToggle />
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
        "sticky top-0 z-50 h-[var(--header-height)] border-b transition-all duration-300",
        scrolled
          ? "border-line/60 bg-white/95 shadow-sm backdrop-blur-md dark:border-[#27272a] dark:bg-[#09090b]/95"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#16a34a] text-white shadow-sm">
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex md:items-center md:gap-1.5">
            <ThemeToggle />
            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
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