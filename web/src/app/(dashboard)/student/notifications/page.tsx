"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_COLORS: Record<string, string> = {
  BOOKING_CONFIRMED:  "bg-[#16a34a]/10 text-[#16a34a]",
  RENEWAL_REMINDER:   "bg-amber-100 text-amber-700",
  BOOKING_CANCELLED:  "bg-red-100 text-red-600",
  WAITLIST_NOTIFIED:  "bg-blue-100 text-blue-700",
  REVIEW_PROMPT:      "bg-purple-100 text-purple-700",
  PAYMENT_SUCCESS:    "bg-[#16a34a]/10 text-[#16a34a]",
};

function fmt(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return diffMins + "m ago";
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return diffHours + "h ago";
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return diffDays + "d ago";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ notifications?: Notification[] }>("/notifications?limit=50")
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markOne = async (id: string) => {
    try {
      await api.patch("/notifications/" + id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* silent */ }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-forest-900/60">
              {unread > 0
                ? unread + " unread notification" + (unread > 1 ? "s" : "")
                : "All caught up"}
            </p>
          </div>
          {unread > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void markAll()}
              disabled={markingAll}
              className="shrink-0"
            >
              <Check className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white/60 py-16 text-center">
            <BellOff className="mx-auto size-8 text-forest-900/20" />
            <p className="mt-3 text-sm font-semibold text-forest-900">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-forest-900/50">
              Booking updates, reminders, and alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => !n.isRead && void markOne(n._id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition",
                  n.isRead
                    ? "border-line bg-white/60"
                    : "border-[#16a34a]/20 bg-white shadow-soft hover:shadow-lift"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      n.isRead ? "bg-sage-100" : "bg-[#16a34a]/10"
                    )}
                  >
                    <Bell
                      className={cn(
                        "size-4",
                        n.isRead ? "text-forest-900/30" : "text-[#16a34a]"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          n.isRead ? "text-forest-900/60" : "text-forest-900"
                        )}
                      >
                        {n.title}
                      </p>
                      {TYPE_COLORS[n.type] && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            TYPE_COLORS[n.type]
                          )}
                        >
                          {n.type.replace(/_/g, " ")}
                        </span>
                      )}
                      {!n.isRead && (
                        <span className="ml-auto size-2 shrink-0 rounded-full bg-[#16a34a]" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-forest-900/60 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] text-forest-900/30">
                      {fmt(n.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </AnimatedContent>
    </div>
  );
}
