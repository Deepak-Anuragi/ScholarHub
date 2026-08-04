"use client";

import { useState } from "react";
import { Bell, Loader2, Send } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";

type Target = "ALL" | "STUDENT" | "LIBRARY_OWNER";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState<Target>("ALL");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, message, link: link.trim() || undefined, target }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Failed to send notifications.");
      }
      setSent(true);
      setTitle("");
      setMessage("");
      setLink("");
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Announcements</h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Send in-app notifications to all users or a specific role
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="max-w-lg space-y-5 rounded-card border border-line bg-white p-6 shadow-soft">
          {/* Target */}
          <div>
            <p className="mb-2 text-sm font-semibold text-forest-900">Send To</p>
            <div className="flex gap-2">
              {(["ALL","STUDENT","LIBRARY_OWNER"] as Target[]).map((t) => (
                <button key={t} type="button" onClick={() => setTarget(t)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    target === t
                      ? "border-forest-900 bg-forest-900 text-white"
                      : "border-line text-forest-900/60 hover:border-forest-900/40"
                  }`}>
                  {t === "ALL" ? "All Users" : t === "STUDENT" ? "Students Only" : "Owners Only"}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New feature available!"
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm outline-none transition focus:border-forest-900"
            />
          </label>

          {/* Message */}
          <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement here…"
              rows={4}
              className="rounded-xl border border-line bg-sage-100/40 px-3 py-2.5 text-sm outline-none transition focus:border-forest-900 resize-none"
            />
          </label>

          {/* Link (optional) */}
          <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
            Link (optional)
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /libraries"
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm outline-none transition focus:border-forest-900"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
          )}

          <Button
            onClick={() => void handleSend()}
            disabled={sending || !title.trim() || !message.trim()}
            className="w-full bg-forest-900 text-white hover:bg-forest-700"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : sent ? (
              <><Bell className="size-4" /> Sent!</>
            ) : (
              <><Send className="size-4" /> Send Notification</>
            )}
          </Button>

          <p className="text-center text-xs text-forest-900/40">
            This will create in-app notification records for the selected users.
          </p>
        </div>
      </AnimatedContent>
    </div>
  );
}
