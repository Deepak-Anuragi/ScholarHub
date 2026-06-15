"use client";

import { useEffect, useState } from "react";
import { BookMarked, Clock, X } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DigitalIDCard } from "@/components/dashboard/DigitalIDCard";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

type Booking = {
  _id: string;
  libraryId: { _id: string; name: string; address: string; city: string };
  slotId?: { name: string; startTime: string; endTime: string };
  plan: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentStatus: string;
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

  useEffect(() => {
    fetch("/api/student/bookings", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { active?: Booking[]; past?: Booking[] }) => {
        setActive(d.active ?? []);
        setPast(d.past ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

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

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
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
        <div>
          <p className="text-forest-900/40">From</p>
          <p className="font-semibold text-forest-900">{fmt(b.startDate)}</p>
        </div>
        <div>
          <p className="text-forest-900/40">Until</p>
          <p className="font-semibold text-forest-900">{fmt(b.endDate)}</p>
        </div>
      </div>

      {b.status === "ACTIVE" && (
        <button
          type="button"
          onClick={() => setIdModal(b)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#16a34a]/10 px-3 py-1.5 text-xs font-semibold text-[#16a34a] transition hover:bg-[#16a34a]/20"
        >
          <BookMarked className="size-3.5" />
          View Digital ID
        </button>
      )}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/50 backdrop-blur-sm p-4"
          onClick={() => setIdModal(null)}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIdModal(null)}
              className="absolute -right-3 -top-3 z-10 flex size-8 items-center justify-center rounded-full bg-white shadow-md"
              aria-label="Close"
            >
              <X className="size-4 text-forest-900" />
            </button>
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
          </div>
        </div>
      )}
    </>
  );
}
