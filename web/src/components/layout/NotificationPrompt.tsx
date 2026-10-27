"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestNotificationPermission, subscribeToPushNotifications } from "@/lib/push-notifications";
import { useAuth } from "@/components/providers/auth-provider";

export function NotificationPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      const dismissed = localStorage.getItem("notif-prompt-dismissed");
      if (!dismissed) setShow(true);
    }
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted && user) {
        await subscribeToPushNotifications(user.id);
      }
      setShow(false);
    } catch (err) {
      console.error("Failed to enable notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("notif-prompt-dismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-card border border-line bg-white p-4 shadow-2xl">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-lg p-1 text-forest-900/30 transition hover:bg-sage-100 hover:text-forest-900"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#16a34a]/10">
          <Bell className="size-5 text-[#16a34a]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-forest-900">Enable Notifications</p>
          <p className="mt-0.5 text-xs text-forest-900/60">
            Get notified about booking reminders, seat availability, and important updates.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => void handleEnable()}
              disabled={loading}
              className="bg-[#16a34a] text-white hover:bg-[#15803d]"
            >
              {loading ? "Enabling..." : "Enable"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}