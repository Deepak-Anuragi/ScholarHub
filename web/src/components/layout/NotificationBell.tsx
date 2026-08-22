"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { io, Socket } from "socket.io-client";
import {
  Bell,
  BookMarked,
  CheckCheck,
  Info,
  Loader2,
  Star,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  SEAT_ALERT: Users,
  BOOKING_CONFIRMED: BookMarked,
  REVIEW_REMINDER: Star,
};

function NotificationIcon({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] ?? Info;
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#16a34a]/10 text-[#16a34a]">
      <Icon className="size-4" />
    </div>
  );
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get<{ unreadCount?: number; count?: number }>(
        "/notifications/count"
      );
      setUnreadCount(data.unreadCount ?? data.count ?? 0);
    } catch {
      /* ignore polling errors */
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingList(true);
    try {
      const data = await api.get<{ notifications?: NotificationItem[] }>(
        "/notifications?limit=20"
      );
      setNotifications(data.notifications ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingList(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const initialFetch = window.setTimeout(() => void fetchCount(), 0);
    const interval = setInterval(() => void fetchCount(), 30_000);
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [fetchCount, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("scholars_token") ||
          localStorage.getItem("token") ||
          ""
        : "";

    const socket: Socket = io(apiUrl, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("notification_count", (data: { unreadCount?: number; count?: number }) => {
      setUnreadCount(data.unreadCount ?? data.count ?? 0);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    const fetchTask = window.setTimeout(() => void fetchNotifications(), 0);
    return () => window.clearTimeout(fetchTask);
  }, [open, fetchNotifications]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* continue navigation even if mark-read fails */
      }
    }

    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-forest-900/70 outline-none transition hover:bg-sage-100 hover:text-forest-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-muted-foreground dark:hover:text-foreground"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-lg dark:border-border dark:bg-background">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-border">
            <p className="text-sm font-semibold text-forest-900 dark:text-foreground">
              Notifications
            </p>
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleMarkAllRead()}
                disabled={markingAll}
                className="h-8 px-2 text-xs text-[#16a34a] hover:bg-[#16a34a]/10"
              >
                {markingAll ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="mr-1 size-3.5" />
                    Mark all as read
                  </>
                )}
              </Button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-[#16a34a]" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="py-10 text-center text-sm text-forest-900/50">
                No notifications yet.
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification._id}>
                    <button
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-sage-100/60 dark:hover:bg-muted/50",
                        !notification.isRead && "bg-[#16a34a]/5"
                      )}
                    >
                      <NotificationIcon type={notification.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="truncate text-sm font-semibold text-forest-900 dark:text-foreground">
                            {notification.title}
                          </p>
                          {!notification.isRead ? (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#16a34a]" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-forest-900/60 dark:text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-forest-900/40 dark:text-muted-foreground/70">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
