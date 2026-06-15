"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookMarked,
  Bell,
  CreditCard,
  GraduationCap,
  Star,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import BlurText from "@/components/BlurText/BlurText";
import { CountUp } from "@/components/home/CountUp";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveBooking = {
  _id: string;
  libraryId: { _id: string; name: string; address: string; city: string };
  slotId?: { name: string; startTime: string; endTime: string };
  plan: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  status: string;
};

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Stats = {
  totalBookings: number;
  totalSpent: number;
  reviewCount: number;
  courseCount: number;
  notifications: Notification[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function daysRemaining(end: string) {
  return Math.max(
    0,
    Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000)
  );
}

function totalDays(start: string, end: string) {
  return Math.max(
    1,
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
    )
  );
}

// ─── Active Booking Card ──────────────────────────────────────────────────────

function ActiveBookingCard({ booking }: { booking: ActiveBooking }) {
  const remaining = daysRemaining(booking.endDate);
  const total = totalDays(booking.startDate, booking.endDate);
  const elapsed = total - remaining;
  const pct = Math.round((elapsed / total) * 100);
  const isExpiringSoon = remaining <= 30;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
      <div className="bg-gradient-to-r from-[#16a34a] to-[#4a7c2a] px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Active Booking
        </p>
        <p className="mt-1 font-display text-xl text-white">
          {booking.libraryId.name}
        </p>
        <p className="text-sm text-white/70">{booking.libraryId.city}</p>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <div className="space-y-3">
          {booking.slotId && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/50">
                Slot
              </p>
              <p className="mt-0.5 text-sm font-medium text-forest-900">
                {booking.slotId.name} · {booking.slotId.startTime}–
                {booking.slotId.endTime}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/50">
              Plan
            </p>
            <p className="mt-0.5 text-sm font-medium text-forest-900 capitalize">
              {booking.plan.toLowerCase()}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/50">
              Validity
            </p>
            <p className="mt-0.5 text-sm font-medium text-forest-900">
              {new Date(booking.startDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}{" "}
              →{" "}
              {new Date(booking.endDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-end justify-between text-sm">
              <span className="font-semibold text-forest-900">
                {remaining} days left
              </span>
              <span className="text-forest-900/50">{pct}% used</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sage-100">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-700",
                  isExpiringSoon ? "bg-amber-400" : "bg-[#16a34a]"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            {isExpiringSoon && (
              <p className="mt-1 text-xs font-semibold text-amber-600">
                Expires soon — renew now
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              asChild
              size="sm"
              className="flex-1 bg-[#16a34a] text-white hover:bg-[#15803d]"
            >
              <Link href="/student/bookings">Digital ID</Link>
            </Button>
            {isExpiringSoon && (
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/library/${booking.libraryId._id ?? ""}`}>
                  Renew
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  prefix = "",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href: string;
  prefix?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[#16a34a]/10">
          <Icon className="size-5 text-[#16a34a]" aria-hidden />
        </div>
        <ArrowRight className="size-4 text-forest-900/30 transition group-hover:text-[#16a34a]" />
      </div>
      <p className="mt-3 text-2xl font-bold text-forest-900">
        {prefix}
        <CountUp end={value} duration={1.2} />
      </p>
      <p className="mt-0.5 text-sm text-forest-900/60">{label}</p>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentOverviewPage() {
  const { user } = useAuth();
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/student/bookings", { credentials: "include" })
        .then((r) => r.json())
        .then((d: { active?: ActiveBooking[] }) => d.active ?? []),
      fetch("/api/student/stats", { credentials: "include" })
        .then((r) => r.json())
        .then((d: Stats) => d),
    ])
      .then(([bookings, s]) => {
        setActiveBookings(bookings);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome */}
      <AnimatedContent distance={20} duration={0.5} threshold={0}>
        <div>
          <BlurText
            text={`${greeting()}, ${firstName}! 📚`}
            className="font-display text-3xl text-forest-900 sm:text-4xl"
            delay={80}
            animateBy="words"
            direction="top"
            immediate
          />
          <p className="mt-2 text-sm text-forest-900/60">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </AnimatedContent>

      {/* Active booking */}
      <div className="mt-6">
        {loading ? (
          <div className="h-52 animate-pulse rounded-card bg-white/80" />
        ) : activeBookings.length > 0 ? (
          <AnimatedContent distance={24} duration={0.5} threshold={0} delay={0.05}>
            <ActiveBookingCard booking={activeBookings[0]} />
          </AnimatedContent>
        ) : (
          <AnimatedContent distance={24} duration={0.5} threshold={0} delay={0.05}>
            <div className="rounded-card border border-dashed border-line bg-white/60 px-6 py-10 text-center">
              <BookMarked className="mx-auto size-8 text-forest-900/30" />
              <p className="mt-3 text-sm font-semibold text-forest-900">
                No active booking
              </p>
              <p className="mt-1 text-sm text-forest-900/50">
                Find a library and reserve your seat.
              </p>
              <Button
                asChild
                className="mt-4 bg-[#16a34a] text-white hover:bg-[#15803d]"
                size="sm"
              >
                <Link href="/libraries">Browse Libraries</Link>
              </Button>
            </div>
          </AnimatedContent>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            icon: BookMarked,
            label: "Active Bookings",
            value: stats?.totalBookings ?? 0,
            href: "/student/bookings",
          },
          {
            icon: CreditCard,
            label: "Total Spent",
            value: stats?.totalSpent ?? 0,
            href: "/student/payments",
            prefix: "₹",
          },
          {
            icon: Star,
            label: "Reviews Given",
            value: stats?.reviewCount ?? 0,
            href: "/student/reviews",
          },
          {
            icon: GraduationCap,
            label: "Courses Enrolled",
            value: stats?.courseCount ?? 0,
            href: "/student/courses",
          },
        ].map((card, i) => (
          <AnimatedContent
            key={card.label}
            distance={20}
            duration={0.45}
            threshold={0}
            delay={0.08 + i * 0.06}
          >
            <StatCard {...card} />
          </AnimatedContent>
        ))}
      </div>

      {/* Recent notifications */}
      {(stats?.notifications?.length ?? 0) > 0 && (
        <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.3}>
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="size-4 text-forest-900/60" />
              <p className="text-sm font-semibold text-forest-900">
                Recent Activity
              </p>
            </div>
            <div className="space-y-2">
              {stats?.notifications.map((n) => (
                <div
                  key={n._id}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm",
                    n.isRead
                      ? "border-line bg-white/60 text-forest-900/60"
                      : "border-[#16a34a]/20 bg-[#16a34a]/5 text-forest-900"
                  )}
                >
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-xs">{n.message}</p>
                  <p className="mt-1 text-[10px] text-forest-900/40">
                    <CalendarDays className="mr-1 inline size-3" />
                    {new Date(n.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedContent>
      )}
    </div>
  );
}
