"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Users, MessageSquare, Send, Bell, Calendar, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type StudentBooking = {
  _id: string;
  studentId: { _id: string; name: string; email: string; phone?: string; avatarUrl?: string };
  slotId?: { name: string };
  plan: string;
  endDate: string;
  status?: string;
};

type Tab = 'students' | 'attendance';
type AttendanceRow = { studentId: string; bookingId: string; date: string; status: 'PRESENT' | 'ABSENT' };

export default function StudentsPage() {
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [tab, setTab] = useState<Tab>('students');

  const todayStr = new Date().toISOString().slice(0, 10);
  const [attendanceDate, setAttendanceDate] = useState<string>(todayStr);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [savingAttendance, setSavingAttendance] = useState<Record<string, boolean>>({});

  const [msgSheetOpen, setMsgSheetOpen] = useState(false);
  const [msgTargetBooking, setMsgTargetBooking] = useState<StudentBooking | null>(null);
  const [msgDraft, setMsgDraft] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [notifyRetrySecs, setNotifyRetrySecs] = useState<number>(0);
  const [notifySuccessCount, setNotifySuccessCount] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ students?: StudentBooking[] }>("/owner/students")
      .then((d) => {
        setBookings(d.students ?? []);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const res = await api.get<{ attendance?: AttendanceRow[] }>(`/owner/attendance?date=${attendanceDate}`);
      setAttendance(res.attendance ?? []);
    } catch (err: unknown) {
      setAttendanceError(err instanceof Error ? err.message : 'Failed to load attendance.');
    } finally {
      setAttendanceLoading(false);
    }
  }, [attendanceDate]);

  useEffect(() => { if (tab === 'attendance') void loadAttendance(); }, [tab, loadAttendance]);

  const markAttendance = async (booking: StudentBooking, status: 'PRESENT' | 'ABSENT') => {
    const key = booking._id;
    setSavingAttendance(prev => ({ ...prev, [key]: true }));
    setAttendanceError(null);
    try {
      const studentId = booking.studentId._id;
      setAttendance(prev => {
        const filtered = prev.filter(a => a.bookingId !== booking._id);
        return [...filtered, { studentId, bookingId: booking._id, date: attendanceDate, status }];
      });
      await api.post('/owner/attendance', { studentId, bookingId: booking._id, date: attendanceDate, status });
    } catch (err: unknown) {
      setAttendanceError(err instanceof Error ? err.message : 'Failed to mark attendance.');
      await loadAttendance();
    } finally {
      setSavingAttendance(prev => ({ ...prev, [key]: false }));
    }
  };

  const filtered = bookings.filter(
    (b) =>
      !query ||
      b.studentId?.name?.toLowerCase().includes(query.toLowerCase()) ||
      b.studentId?.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
              Students &amp; Attendance
            </h1>
            <p className="mt-1 text-sm text-forest-900/60">
              {bookings.length} active student{bookings.length !== 1 ? "s" : ""} in your library
            </p>
          </div>
          <Button
            onClick={() => { setNotifyOpen(true); setNotifyError(null); setNotifySuccessCount(null); }}
            className="bg-forest-700 text-white hover:bg-forest-900"
            size="sm"
          >
            <Bell className="size-4" /> Notify All Active
          </Button>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.03}>
        <div className="mb-4 flex items-center gap-1 rounded-xl bg-sage-100/60 p-1 w-fit">
          {(['students','attendance'] as Tab[]).map(t => (
            <button key={t} type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold transition",
                tab===t ? "bg-white text-forest-900 shadow-sm" : "text-forest-900/50 hover:text-forest-900"
              )}>
              {t === 'students' ? 'Current Students' : 'Attendance'}
            </button>
          ))}
        </div>
      </AnimatedContent>

      {tab === 'students' ? (
        <>
          <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.05}>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-forest-900/40" />
              <input
                type="text"
                placeholder="Search students…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full max-w-sm rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
              />
            </div>
          </AnimatedContent>

          <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.08}>
            {error ? (
              <DataError message={error} onRetry={load} />
            ) : loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-card border border-dashed border-line bg-white/60 py-14 text-center">
                <Users className="mx-auto size-8 text-forest-900/20" />
                <p className="mt-3 text-sm text-forest-900/50">
                  {query ? "No students match your search." : "No active students right now."}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((b) => {
                  const initials = (b.studentId?.name ?? "S")
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();
                  const daysLeft = Math.max(
                    0,
                    Math.ceil((new Date(b.endDate).getTime() - Date.now()) / 86_400_000)
                  );
                  return (
                    <div
                      key={b._id}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-700/10 text-sm font-bold text-forest-700">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-forest-900">
                          {b.studentId?.name ?? "—"}
                        </p>
                        <p className="truncate text-xs text-forest-900/50">
                          {b.studentId?.email}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                          {b.slotId?.name && (
                            <span className="rounded-full bg-sage-100 px-2 py-0.5 font-medium text-forest-900">
                              {b.slotId.name}
                            </span>
                          )}
                          <span className="rounded-full bg-sage-100 px-2 py-0.5 capitalize font-medium text-forest-900">
                            {b.plan.toLowerCase()}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 font-semibold",
                              daysLeft <= 7
                                ? "bg-amber-100 text-amber-700"
                                : "text-forest-900/50"
                            )}
                          >
                            {daysLeft}d left
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMsgTargetBooking(b); setMsgDraft(''); setMsgError(null); setMsgSheetOpen(true); }}
                        className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-forest-700 transition hover:bg-forest-700 hover:text-white"
                        title="Message student"
                        aria-label={`Message ${b.studentId?.name}`}
                      >
                        <MessageSquare className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </AnimatedContent>
        </>
      ) : (
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.05}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
              <Calendar className="size-4 text-forest-900/40" />
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-transparent text-sm text-forest-900 outline-none"
                aria-label="Attendance date"
              />
            </div>
            {attendanceError && <p className="text-sm text-red-600">{attendanceError}</p>}
          </div>

          {attendanceLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-white/60 py-14 text-center">
              <Users className="mx-auto size-8 text-forest-900/20" />
              <p className="mt-3 text-sm text-forest-900/50">No active students to mark attendance for.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map(b => {
                const row = attendance.find(a => a.bookingId === b._id);
                const saving = savingAttendance[b._id];
                const initials = (b.studentId?.name ?? 'S').split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase();
                return (
                  <div key={b._id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-700/10 text-sm font-bold text-forest-700">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-forest-900">{b.studentId?.name ?? '—'}</p>
                      <p className="truncate text-xs text-forest-900/50">{b.studentId?.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                        {b.slotId?.name && <span className="rounded-full bg-sage-100 px-2 py-0.5 font-medium text-forest-900">{b.slotId.name}</span>}
                        <span className="rounded-full bg-sage-100 px-2 py-0.5 capitalize font-medium text-forest-900">{b.plan.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void markAttendance(b, 'PRESENT')}
                        disabled={saving}
                        aria-label={`Mark ${b.studentId?.name ?? 'student'} present`}
                        className={cn(
                          "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                          row?.status === 'PRESENT'
                            ? "bg-[#16a34a] text-white shadow-sm"
                            : "bg-sage-100 text-[#16a34a] hover:bg-[#16a34a] hover:text-white",
                          saving && "opacity-60"
                        )}
                      >
                        <CheckCircle2 className="size-3.5" /> Present
                      </button>
                      <button
                        type="button"
                        onClick={() => void markAttendance(b, 'ABSENT')}
                        disabled={saving}
                        aria-label={`Mark ${b.studentId?.name ?? 'student'} absent`}
                        className={cn(
                          "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                          row?.status === 'ABSENT'
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
                          saving && "opacity-60"
                        )}
                      >
                        <XCircle className="size-3.5" /> Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnimatedContent>
      )}

      <Sheet open={msgSheetOpen} onOpenChange={(open) => { if (!msgSending) setMsgSheetOpen(open); }}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>
              Message {msgTargetBooking?.studentId?.name ?? 'Student'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col gap-4 py-4">
            {msgError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{msgError}</p>}
            <div className="flex-1">
              <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                Your message
                <textarea
                  value={msgDraft}
                  onChange={(e) => setMsgDraft(e.target.value)}
                  rows={10}
                  placeholder="Write a personal message to this student…"
                  className="rounded-xl border border-line bg-sage-100/40 px-3 py-2 text-sm text-forest-900 outline-none transition focus:border-forest-700 resize-none"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMsgSheetOpen(false)}
                disabled={msgSending}
              >
                Cancel
              </Button>
              <Button
                className="bg-forest-700 text-white hover:bg-forest-900"
                disabled={msgSending || !msgDraft.trim()}
                onClick={async () => {
                  if (!msgTargetBooking) return;
                  setMsgSending(true); setMsgError(null);
                  try {
                    await api.post(`/owner/students/${msgTargetBooking._id}/message`, { content: msgDraft.trim() });
                    setMsgDraft(''); setMsgSheetOpen(false);
                  } catch (err: unknown) {
                    setMsgError(err instanceof Error ? err.message : 'Could not send the message.');
                  } finally { setMsgSending(false); }
                }}
              >
                {msgSending ? <><Send className="size-4 animate-spin" /> Sending…</> : <><Send className="size-4" /> Send</>}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Modal open={notifyOpen} onOpenChange={(next) => { if (!notifySending) { setNotifyOpen(next); if (next) { setNotifyError(null); setNotifySuccessCount(null); setNotifyTitle(''); setNotifyBody(''); } } }} title="Notify All Active Students">
        <div className="space-y-3 pt-1">
          {notifySuccessCount !== null && (
            <div className="rounded-xl bg-[#16a34a]/10 p-3 text-sm font-semibold text-[#16a34a]">
              ✓ Notified {notifySuccessCount} active student{notifySuccessCount !== 1 ? 's' : ''}.
            </div>
          )}
          {notifyError && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {notifyError}{notifyRetrySecs > 0 && ` (retry after ${notifyRetrySecs}s)`}
            </div>
          )}
          <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
            Title
            <input
              type="text"
              value={notifyTitle}
              onChange={(e) => setNotifyTitle(e.target.value)}
              placeholder="e.g. Library Closed Tomorrow"
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
            Message
            <textarea
              value={notifyBody}
              onChange={(e) => setNotifyBody(e.target.value)}
              rows={5}
              placeholder="Write a short message that every active student will see in their notifications…"
              className="rounded-xl border border-line bg-sage-100/40 px-3 py-2 text-sm text-forest-900 outline-none transition focus:border-forest-700 resize-none"
            />
          </label>
          <p className="text-xs text-forest-900/50">
            Will be delivered to <span className="font-bold text-forest-900">{bookings.length}</span> active student{bookings.length !== 1 ? 's' : ''}. Rate limited to one per 10 minutes.
          </p>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setNotifyOpen(false)}
            disabled={notifySending}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#16a34a] text-white hover:bg-[#15803d]"
            disabled={notifySending || !notifyTitle.trim() || !notifyBody.trim() || notifyRetrySecs > 0}
            onClick={async () => {
              setNotifySending(true);
              setNotifyError(null);
              setNotifySuccessCount(null);
              setNotifyRetrySecs(0);
              try {
                const res = await api.post<{ notifiedCount?: number }>('/owner/students/notify-bulk', { title: notifyTitle.trim(), message: notifyBody.trim() });
                setNotifySuccessCount(res.notifiedCount ?? 0);
                setNotifyTitle(''); setNotifyBody('');
                setTimeout(() => setNotifyOpen(false), 1800);
              } catch (err: any) {
                const msg = err instanceof Error ? err.message : err?.data?.error ?? 'Could not send notification.';
                const retryAfter = (err?.data?.retryAfterSeconds) ? Number(err.data.retryAfterSeconds) : 0;
                setNotifyError(msg);
                if (retryAfter > 0) {
                  setNotifyRetrySecs(retryAfter);
                  const intv = setInterval(() => setNotifyRetrySecs(s => { if (s <= 1) { clearInterval(intv); return 0; } return s - 1; }), 1000);
                }
              } finally { setNotifySending(false); }
            }}
          >
            {notifySending ? <><Bell className="size-4 animate-spin" /> Sending…</> : <><Bell className="size-4" /> Send to {bookings.length} Students</>}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
