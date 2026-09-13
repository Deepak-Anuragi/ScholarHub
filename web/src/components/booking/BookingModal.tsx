"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, ChevronRight, Loader2, X } from "lucide-react";
import confetti from "canvas-confetti";

import AnimatedContent from "@/components/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { PLATFORM_RATE_LABEL, priceBooking } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Plan = "MONTHLY" | "QUARTERLY" | "ANNUAL";

type SlotOption = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  availableSeats: number;
  totalSeats: number;
};

type LibraryFees = {
  monthlyFee: number;
  quarterlyFee?: number | null;
  annualFee?: number | null;
};

type BookingModalProps = {
  libraryId: string;
  libraryName: string;
  fees: LibraryFees;
  slots: SlotOption[];
  /** Preselected by a renewal link, so the plan carries over. */
  initialPlan?: Plan;
  initialSlotId?: string;
  onClose: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<Plan, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
};

function planFee(fees: LibraryFees, plan: Plan): number {
  switch (plan) {
    case "QUARTERLY":
      return fees.quarterlyFee ?? fees.monthlyFee * 3;
    case "ANNUAL":
      return fees.annualFee ?? fees.monthlyFee * 12;
    default:
      return fees.monthlyFee;
  }
}

function planDurationLabel(plan: Plan): string {
  switch (plan) {
    case "QUARTERLY":
      return "3 months";
    case "ANNUAL":
      return "12 months";
    default:
      return "1 month";
  }
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function calcEndDate(start: Date, plan: Plan): Date {
  switch (plan) {
    case "QUARTERLY":
      return addMonths(start, 3);
    case "ANNUAL":
      return addMonths(start, 12);
    default:
      return addMonths(start, 1);
  }
}

function fmt(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxStartIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Select", "Review", "Pay"];
  return (
    <div className="flex items-center justify-center gap-2" aria-label="Booking steps">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done
                  ? "bg-[#16a34a] text-white"
                  : active
                  ? "bg-forest-900 text-sand-100"
                  : "bg-sage-100 text-forest-900/50"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <CheckCircle className="size-4" /> : num}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                active ? "text-forest-900" : "text-forest-900/40"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight className="size-3 text-forest-900/30" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({
  fees,
  slots,
  plan,
  setPlan,
  selectedSlotId,
  setSelectedSlotId,
  startDate,
  setStartDate,
  onNext,
}: {
  fees: LibraryFees;
  slots: SlotOption[];
  plan: Plan;
  setPlan: (p: Plan) => void;
  selectedSlotId: string;
  setSelectedSlotId: (id: string) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  onNext: () => void;
}) {
  const fee = planFee(fees, plan);
  const { total } = priceBooking(fee);
  const startDt = new Date(startDate + "T00:00:00");
  const endDt = calcEndDate(startDt, plan);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const canProceed = selectedSlotId !== "" || slots.length === 0;

  const plans: Plan[] = ["MONTHLY", "QUARTERLY", "ANNUAL"];

  return (
    <AnimatedContent distance={30} duration={0.4} threshold={0} delay={0}>
      <div className="space-y-5">
        {/* Plan selector */}
        <div>
          <p className="mb-2 text-sm font-semibold text-forest-900">Choose Plan</p>
          <div className="grid grid-cols-3 gap-2">
            {plans.map((p) => {
              const f = planFee(fees, p);
              const active = plan === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-all",
                    active
                      ? "border-[#16a34a] bg-[#16a34a]/8 ring-1 ring-[#16a34a]"
                      : "border-line bg-white hover:border-forest-700/40"
                  )}
                >
                  <p className="text-xs font-semibold text-forest-900">
                    {PLAN_LABELS[p]}
                  </p>
                  <p className="mt-1 text-sm font-bold text-forest-900">
                    ₹{f.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-forest-900/50">
                    {planDurationLabel(p)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot selector */}
        {slots.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-forest-900">Choose Slot</p>
            <div className="space-y-2">
              {slots.map((slot) => {
                const full = slot.availableSeats <= 0;
                const active = selectedSlotId === slot.id;
                return (
                  <label
                    key={slot.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition-all",
                      full
                        ? "cursor-not-allowed border-line bg-sage-100/40 opacity-60"
                        : active
                        ? "border-[#16a34a] bg-[#16a34a]/8 ring-1 ring-[#16a34a]"
                        : "border-line bg-white hover:border-forest-700/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="slot"
                        value={slot.id}
                        disabled={full}
                        checked={active}
                        onChange={() => setSelectedSlotId(slot.id)}
                        className="accent-[#16a34a]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-forest-900">
                          {slot.name}
                        </p>
                        <p className="text-xs text-forest-900/60">
                          {slot.startTime} – {slot.endTime}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        full
                          ? "bg-red-100 text-red-600"
                          : slot.availableSeats <= 5
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sage-100 text-forest-900"
                      )}
                    >
                      {full ? "Full" : `${slot.availableSeats}/${slot.totalSeats}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Start date */}
        <div>
          <p className="mb-2 text-sm font-semibold text-forest-900">Start Date</p>
          <input
            type="date"
            value={startDate}
            min={todayIso()}
            max={maxStartIso()}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
          />
        </div>

        {/* Summary strip */}
        <div className="rounded-2xl bg-sage-100/70 p-4 text-sm">
          <div className="flex justify-between text-forest-900/70">
            <span>Plan</span>
            <span className="font-semibold text-forest-900">{PLAN_LABELS[plan]}</span>
          </div>
          {selectedSlot && (
            <div className="mt-1 flex justify-between text-forest-900/70">
              <span>Slot</span>
              <span className="font-semibold text-forest-900">{selectedSlot.name}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between text-forest-900/70">
            <span>Duration</span>
            <span className="font-semibold text-forest-900">
              {fmt(startDt)} → {fmt(endDt)}
            </span>
          </div>
          <div className="mt-2 border-t border-line pt-2 flex justify-between font-semibold text-forest-900">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <Button
          className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
          disabled={!canProceed}
          onClick={onNext}
        >
          Review Booking
        </Button>
      </div>
    </AnimatedContent>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  libraryName,
  fees,
  plan,
  selectedSlotId,
  slots,
  startDate,
  onBack,
  onNext,
  isLoading,
}: {
  libraryName: string;
  fees: LibraryFees;
  plan: Plan;
  selectedSlotId: string;
  slots: SlotOption[];
  startDate: string;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  const { user } = useAuth();

  const fee = planFee(fees, plan);
  const { platformFee, total } = priceBooking(fee);
  const startDt = new Date(startDate + "T00:00:00");
  const endDt = calcEndDate(startDt, plan);
  const slot = slots.find((s) => s.id === selectedSlotId);

  return (
    <AnimatedContent distance={30} direction="horizontal" duration={0.35} threshold={0} delay={0}>
      <div className="space-y-5">
        {/* Order summary */}
        <div>
          <p className="mb-3 text-sm font-semibold text-forest-900">Order Summary</p>
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Library", libraryName],
                  ["Plan", `${PLAN_LABELS[plan]} (${planDurationLabel(plan)})`],
                  ...(slot ? [["Slot", `${slot.name} (${slot.startTime}–${slot.endTime})`]] : []),
                  ["Start Date", fmt(startDt)],
                  ["End Date", fmt(endDt)],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-line last:border-0">
                    <td className="bg-sage-100/40 px-4 py-2.5 font-medium text-forest-900/70">
                      {label}
                    </td>
                    <td className="px-4 py-2.5 text-forest-900">{value}</td>
                  </tr>
                ))}
                <tr className="border-b border-line">
                  <td className="bg-sage-100/40 px-4 py-2.5 font-medium text-forest-900/70">
                    Library Fee
                  </td>
                  <td className="px-4 py-2.5 text-forest-900">
                    ₹{fee.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr className="border-b border-line">
                  <td className="bg-sage-100/40 px-4 py-2.5 font-medium text-forest-900/70">
                    Platform Fee ({PLATFORM_RATE_LABEL})
                  </td>
                  <td className="px-4 py-2.5 text-forest-900/70">
                    ₹{platformFee.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td className="bg-[#16a34a]/8 px-4 py-3 font-bold text-forest-900">
                    Total
                  </td>
                  <td className="bg-[#16a34a]/8 px-4 py-3 font-bold text-forest-900">
                    ₹<CountUp end={total} duration={0.8} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Student info */}
        {user && (
          <div className="rounded-2xl border border-line bg-sage-100/40 px-4 py-3 text-sm">
            <p className="font-semibold text-forest-900">{user.name}</p>
            <p className="text-forest-900/60">{user.email}</p>
          </div>
        )}

        {/* Cancellation policy */}
        <label className="flex cursor-pointer items-start gap-3 text-sm text-forest-900/70">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-[#16a34a]"
          />
          <span>
            I agree to the{" "}
            <a href="#" className="font-semibold text-[#16a34a] underline">
              cancellation policy
            </a>
            . No refunds after 24 hours of booking.
          </span>
        </label>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            className="flex-1 bg-[#16a34a] text-white hover:bg-[#15803d]"
            disabled={!agreed || isLoading}
            onClick={onNext}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </div>
      </div>
    </AnimatedContent>
  );
}

// ─── Step 3 success screen ────────────────────────────────────────────────────

function SuccessScreen({ onClose }: { onClose: () => void }) {
  return (
    <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0}>
      <div className="flex flex-col items-center py-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#16a34a]/15">
          <CheckCircle className="size-8 text-[#16a34a]" />
        </div>
        <h3 className="mt-4 font-display text-2xl text-forest-900">
          Booking Confirmed!
        </h3>
        <p className="mt-2 text-sm text-forest-900/60">
          Your Digital ID is ready. Check your dashboard for details.
        </p>
        <div className="mt-6 flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Go to Dashboard
          </Button>
          <Button
            className="flex-1 bg-[#16a34a] text-white hover:bg-[#15803d]"
            onClick={onClose}
          >
            Download ID
          </Button>
        </div>
      </div>
    </AnimatedContent>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function BookingModal({
  libraryId,
  libraryName,
  fees,
  slots,
  initialPlan,
  initialSlotId,
  onClose,
}: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [plan, setPlan] = useState<Plan>(initialPlan ?? "MONTHLY");
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    // A renewal names the slot it is renewing; otherwise take the first with
    // room. Either way the student can still change it on step 1.
    (initialSlotId && slots.some((s) => s.id === initialSlotId) ? initialSlotId : "") ||
      slots.find((s) => s.availableSeats > 0)?.id ||
      ""
  );
  const [startDate, setStartDate] = useState(todayIso());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#16a34a", "#86efac", "#f0e3d7", "#4a7c2a"],
    });
  }, []);

  const handlePayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create order
      const orderRes = await fetch("/api/bookings/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          libraryId,
          slotId: selectedSlotId || undefined,
          plan,
          startDate,
        }),
      });

      if (!orderRes.ok) {
        const data = (await orderRes.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create order.");
      }

      const orderData = (await orderRes.json()) as {
        bookingId: string;
        razorpay_order_id: string;
        razorpay_key_id?: string;
        amount: number;
      };

      // 2. Mock payment if no Razorpay key or mock order
      const isMock =
        !orderData.razorpay_key_id ||
        orderData.razorpay_order_id.startsWith("mock_order_");

      if (isMock) {
        // Simulate payment confirmation directly (dev only)
        const confirmRes = await fetch("/api/bookings/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            razorpay_order_id: orderData.razorpay_order_id,
            razorpay_payment_id: `mock_pay_${Date.now()}`,
            razorpay_signature: "mock_signature",
            bookingId: orderData.bookingId,
          }),
        });

        if (!confirmRes.ok) {
          const d = (await confirmRes.json()) as { error?: string };
          throw new Error(d.error ?? "Confirmation failed.");
        }

        fireConfetti();
        setStep(3);
        return;
      }

      // 3. Real Razorpay checkout
      if (typeof window === "undefined") return;
      const RazorpayCheckout = (await import("@/lib/razorpay-loader")).loadRazorpay;
      await RazorpayCheckout({
        key: orderData.razorpay_key_id!,
        amount: orderData.amount * 100,
        currency: "INR",
        order_id: orderData.razorpay_order_id,
        name: "Scholar's Hub",
        description: `${libraryName} — ${plan}`,
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
              bookingId: orderData.bookingId,
            }),
          });

          if (confirmRes.ok) {
            fireConfetti();
            setStep(3);
          } else {
            const d = (await confirmRes.json()) as { error?: string };
            setError(d.error ?? "Payment verification failed.");
          }
        },
        theme: { color: "#16a34a" },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [libraryId, libraryName, plan, selectedSlotId, startDate, fireConfetti]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-forest-900/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Booking modal"
    >
      <div className="w-full max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-sand-100 shadow-lift sm:max-w-md sm:rounded-[28px]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-sand-100/95 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/50">
              {step < 3 ? "Book a Seat" : "Confirmed"}
            </p>
            <p className="mt-0.5 text-base font-semibold text-forest-900 line-clamp-1">
              {libraryName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking modal"
            className="flex size-8 items-center justify-center rounded-full bg-sage-100 text-forest-900/70 transition hover:bg-sage-200"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="border-b border-line px-5 py-3">
            <StepIndicator step={step} />
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-5">
          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <Step1
              fees={fees}
              slots={slots}
              plan={plan}
              setPlan={setPlan}
              selectedSlotId={selectedSlotId}
              setSelectedSlotId={setSelectedSlotId}
              startDate={startDate}
              setStartDate={setStartDate}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <Step2
              libraryName={libraryName}
              fees={fees}
              plan={plan}
              selectedSlotId={selectedSlotId}
              slots={slots}
              startDate={startDate}
              onBack={() => setStep(1)}
              onNext={() => void handlePayment()}
              isLoading={isLoading}
            />
          )}

          {step === 3 && <SuccessScreen onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
