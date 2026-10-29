"use client";

import { useCallback, useEffect, useState } from "react";
import { BookMarked, Clock, Download, RotateCw, XCircle } from "lucide-react";
import { downloadReceipt, type ReceiptData } from "@/components/booking/ReceiptPDF";
import { CancellationModal } from "@/components/booking/CancellationModal";

import AnimatedContent from "@/components/AnimatedContent";
import { DigitalIDCard } from "@/components/dashboard/DigitalIDCard";
import { useAuth } from "@/components/providers/auth-provider";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

import { api } from "@/lib/api";

type Booking = {
  _id: string;
  studentId?: string;
  libraryId: { _id: string; name: string; address: string; city: string };
  slotId?: { name: string; startTime: string; endTime: string };
  plan: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentStatus: string;
  seatNumber?: string;
};

function StatusBadge({ status }: { status: Booking["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        status === "ACTIVE"
          ? "bg-[#16a34a]/10 text-[#16a34a]"
          : status === "EXPIRED"
          ? "bg-amber-100 text-amber-700"
          : "bg-red-100 text-red-600"
      )}
    >
      {status}
    </span>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [idModal, setIdModal] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    api
      .get<{ active?: Booking[]; past?: Booking[] }>("/student/bookings")
      .then((d) => {
        const activeList = d.active ?? [];
        const pastList = d.past ?? [];
        setActive(activeList);
        setPast(pastList);
        setIsOffline(false);
        if (typeof window !== "undefined" && activeList.length > 0) {
          localStorage.setItem(
            "scholarshub_offline_booking",
            JSON.stringify({
              booking: activeList[0],
              user: user ? { name: user.name, email: user.email, id: user.id } : null,
              cachedAt: new Date().toISOString(),
            })
          );
        }
      })
      .catch(() => {
        if (typeof window !== "undefined") {
          const cachedRaw = localStorage.getItem("scholarshub_offline_booking");
          if (cachedRaw) {
            try {
              const parsed = JSON.parse(cachedRaw);
              if (parsed?.booking) {
                setActive([parsed.booking]);
                setPast([]);
                setIsOffline(true);
                return;
              }
            } catch {
              // ignore parse errors
            }
          }
        }
        setActive([]);
        setPast([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleDownload = async (b: Booking) => {
    setDownloading(b._id);
    try {
      const data = await api.get<ReceiptData>(`/student/bookings/${b._id}/receipt`);
      await downloadReceipt(data, b._id);
    } catch {
      alert("Failed to download receipt. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const handleRenew = async (b: Booking) => {
    if (!confirm(`Extend/renew your ${b.plan.toLowerCase()} booking at ${b.libraryId.name}?`)) {
      return;
    }
    setRenewing(b._id);
    try {
      const res = await fetch(`/api/student/bookings/${b._id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: b.plan }),
      });
      const data = (await res.json()) as {
        error?: string;
        bookingId: string;
        razorpay_order_id: string;
        razorpay_key_id?: string;
        amount: number;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create renewal order.");
      }

      const isMock = !data.razorpay_key_id || data.razorpay_order_id.startsWith("mock_order_");
      if (isMock) {
        const confirmRes = await fetch("/api/bookings/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: `mock_renew_${Date.now()}`,
            razorpay_signature: "mock_signature",
            bookingId: data.bookingId,
          }),
        });
        if (!confirmRes.ok) {
          const d = (await confirmRes.json()) as { error?: string };
          throw new Error(d.error ?? "Renewal confirmation failed.");
        }
        alert("Booking renewed successfully!");
        fetchBookings();
        return;
      }

      const RazorpayCheckout = (await import("@/lib/razorpay-loader")).loadRazorpay;
      await RazorpayCheckout({
        key: data.razorpay_key_id!,
        amount: data.amount * 100,
        currency: "INR",
        order_id: data.razorpay_order_id,
        name: "Scholar's Hub",
        description: `Renewal — ${b.libraryId.name}`,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const confirmRes = await fetch("/api/bookings/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              ...response,
              bookingId: data.bookingId,
            }),
          });
          if (confirmRes.ok) {
            alert("Booking renewed successfully!");
            fetchBookings();
          } else {
            const d = (await confirmRes.json()) as { error?: string };
            alert(d.error ?? "Renewal payment confirmation failed.");
          }
        },
        theme: { color: "#16a34a" },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to renew booking.");
    } finally {
      setRenewing(null);
    }
  };

  const BookingRow = ({ b }: { b: Booking }) => (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-forest-900">{b.libraryId.name}</p>
            <StatusBadge status={b.status} />
          </div>
          <p className="mt-0.5 text-xs text-forest-900/50">
            {b.libraryId.city}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-forest-900">
          ₹{b.amountPaid.toLocaleString("en-IN")}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        <div>
          <p className="text-forest-900/40">Plan</p>
          <p className="font-semibold capitalize text-forest-900">
            {b.plan.toLowerCase()}
          </p>
        </div>
        {b.slotId && (
          <div>
            <p className="text-forest-900/40">Slot</p>
            <p className="font-semibold text-forest-900">{b.slotId.name}</p>
          </div>
        )}
        {b.seatNumber && (
          <div>
            <p className="text-forest-900/40">Seat</p>
            <p className="font-semibold text-[#16a34a]">Seat {b.seatNumber}</p>
          </div>
        )}
        <div>
          <p className="text-forest-900/40">From</p>
          <p className="font-semibold text-forest-900">{fmt(b.startDate)}</p>
        </div>
        <div>
          <p className="text-forest-900/40">Until</p>
          <p className="font-semibold text-forest-900">{fmt(b.endDate)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {b.status === "ACTIVE" && (
          <>
            <button
              type="button"
              onClick={() => setIdModal(b)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a]/10 px-3 py-1.5 text-xs font-semibold text-[#16a34a] transition hover:bg-[#16a34a]/20"
            >
              <BookMarked className="size-3.5" />
              View Digital ID
            </button>
            <button
              type="button"
              onClick={() => void handleRenew(b)}
              disabled={renewing === b._id}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-forest-900 transition hover:border-[#16a34a] hover:text-[#16a34a] disabled:opacity-50"
            >
              <RotateCw className={cn("size-3.5", renewing === b._id && "animate-spin")} />
              {renewing === b._id ? "Renewing…" : "Renew"}
            </button>
            <button
              type="button"
              onClick={() => setCancelTarget(b)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              <XCircle className="size-3.5" />
              Cancel Booking
            </button>
          </>
        )}
        {b.status === "EXPIRED" && (
          <button
            type="button"
            onClick={() => void handleRenew(b)}
            disabled={renewing === b._id}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-forest-900 transition hover:border-[#16a34a] hover:text-[#16a34a] disabled:opacity-50"
          >
            <RotateCw className={cn("size-3.5", renewing === b._id && "animate-spin")} />
            {renewing === b._id ? "Renewing…" : "Renew"}
          </button>
        )}
        {b.paymentStatus === "SUCCESS" && (
          <button
            type="button"
            onClick={() => void handleDownload(b)}
            disabled={downloading === b._id}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-forest-900/70 transition hover:text-forest-900 disabled:opacity-50"
          >
            {downloading === b._id ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900/60" />
            ) : (
              <Download className="size-3.5" />
            )}
            Receipt
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <AnimatedContent distance={20} duration={0.45} threshold={0}>
          <div className="mb-6">
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
              My Bookings
            </h1>
            <p className="mt-1 text-sm text-forest-900/60">
              Active and past library reservations
            </p>
          </div>
        </AnimatedContent>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Offline banner */}
            {isOffline && (
              <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                </span>
                <span>
                  <strong>Offline Mode:</strong> No internet connection detected. Showing your last-cached active booking & Digital ID details.
                </span>
              </div>
            )}

            {/* Active */}
            <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
              <section className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <BookMarked className="size-4 text-[#16a34a]" />
                  <h2 className="text-sm font-semibold text-forest-900">
                    Active ({active.length})
                  </h2>
                </div>
                {active.length === 0 ? (
                  <p className="text-sm text-forest-900/50">
                    No active bookings.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {active.map((b) => (
                      <BookingRow key={b._id} b={b} />
                    ))}
                  </div>
                )}
              </section>
            </AnimatedContent>

            {/* Past */}
            {past.length > 0 && (
              <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.1}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="size-4 text-forest-900/50" />
                    <h2 className="text-sm font-semibold text-forest-900">
                      Past Bookings ({past.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {past.map((b) => (
                      <BookingRow key={b._id} b={b} />
                    ))}
                  </div>
                </section>
              </AnimatedContent>
            )}
          </>
        )}
      </div>

      {/* Digital ID modal */}
      {idModal && user && (
        <Modal
          open
          onOpenChange={(next) => {
            if (!next) setIdModal(null);
          }}
          title="Student Digital ID"
          showTitle={false}
          className="max-w-sm bg-transparent p-0 shadow-none"
        >
          <DigitalIDCard
            bookingId={idModal._id}
            studentId={user.id}
            studentName={user.name}
            studentEmail={user.email}
            avatarUrl={user.avatarUrl}
            libraryName={idModal.libraryId.name}
            libraryId={idModal.libraryId._id}
            slotName={idModal.slotId?.name}
            plan={idModal.plan}
            startDate={idModal.startDate}
            endDate={idModal.endDate}
          />
        </Modal>
      )}
      {/* Cancellation modal */}
      {cancelTarget && (
        <CancellationModal
          open={Boolean(cancelTarget)}
          onOpenChange={(next) => {
            if (!next) setCancelTarget(null);
          }}
          bookingId={cancelTarget._id}
          libraryName={cancelTarget.libraryId.name}
          onCancelled={() => {
            setCancelTarget(null);
            fetchBookings();
          }}
        />
      )}
    </>
  );
}
