import cron, { type ScheduledTask } from "node-cron";

import BookingModel from "../models/Booking";
import LibraryModel from "../models/Library";
import SlotModel from "../models/Slot";
import connectDB from "./mongodb";
import { notifyWaitlist, releaseExpiredHolds } from "./waitlist";

/** 02:00 in the timezone below — quiet hours for an Indian study-hall app. */
export const EXPIRY_SCHEDULE = "0 2 * * *";
const TIMEZONE = process.env.CRON_TIMEZONE ?? "Asia/Kolkata";

export interface ExpiryReport {
  expired: number;
  seatsReturned: number;
  waitlistNotified: number;
  holdsReleased: number;
}

/**
 * Bookings were set ACTIVE on confirm and never moved off it, so the seat
 * taken at booking was never given back and availableSeats drifted towards
 * zero. This walks the finished ones, returns their seats, and tells whoever
 * is waiting on that slot.
 *
 * Only bookings that were actually paid for are considered: `status` defaults
 * to ACTIVE at create time, before payment, and an unpaid booking never took
 * a seat to begin with.
 */
export async function expireFinishedBookings(now: Date = new Date()): Promise<ExpiryReport> {
  const report: ExpiryReport = { expired: 0, seatsReturned: 0, waitlistNotified: 0, holdsReleased: 0 };

  const finished = await BookingModel.find({
    status: "ACTIVE",
    paymentStatus: "SUCCESS",
    endDate: { $lt: now },
  }).select("_id libraryId slotId");

  // Seats freed per slot, so one alert per slot carries the whole count
  // instead of one notification per booking.
  const freedPerSlot = new Map<string, { libraryId: string; slotId: string | null; seats: number }>();

  for (const booking of finished) {
    // Guarded on status so a second run — or an overlapping one — cannot
    // return the same seat twice.
    const claimed = await BookingModel.findOneAndUpdate(
      { _id: booking._id, status: "ACTIVE" },
      { status: "EXPIRED" }
    );
    if (!claimed) continue;
    report.expired += 1;

    // Never push a count past the seats that physically exist: a seat may
    // have been returned by hand, or the total lowered since booking.
    const belowCapacity = { $expr: { $lt: ["$availableSeats", "$totalSeats"] } };

    if (booking.slotId) {
      await SlotModel.findOneAndUpdate(
        { _id: booking.slotId, ...belowCapacity },
        { $inc: { availableSeats: 1 } }
      );
    }
    const library = await LibraryModel.findOneAndUpdate(
      { _id: booking.libraryId, ...belowCapacity },
      { $inc: { availableSeats: 1 } }
    );
    if (library) report.seatsReturned += 1;

    const key = `${String(booking.libraryId)}:${String(booking.slotId ?? "")}`;
    const entry = freedPerSlot.get(key);
    if (entry) {
      entry.seats += 1;
    } else {
      freedPerSlot.set(key, {
        libraryId: String(booking.libraryId),
        slotId: booking.slotId ? String(booking.slotId) : null,
        seats: 1,
      });
    }
  }

  for (const { libraryId, slotId, seats } of freedPerSlot.values()) {
    const library = await LibraryModel.findById(libraryId).select("name");
    if (!library) continue;
    report.waitlistNotified += await notifyWaitlist({
      libraryId,
      libraryName: library.name,
      slotId,
      seats,
    });
  }

  report.holdsReleased = await releaseExpiredHolds(now);
  return report;
}

async function runExpiry(): Promise<void> {
  try {
    await connectDB();
    const report = await expireFinishedBookings();
    console.log(
      `[cron] expired ${report.expired} booking(s), returned ${report.seatsReturned} seat(s), ` +
        `alerted ${report.waitlistNotified} waiting student(s), released ${report.holdsReleased} lapsed hold(s).`
    );
  } catch (err) {
    // A failed run must not take the process down; the next one retries.
    console.error("[cron] booking expiry failed:", err);
  }
}

/**
 * Registers the daily job. Returns null when nothing was scheduled, which is
 * the case under a serverless host — there is no long-lived process there to
 * run it, and every cold start would register another copy.
 */
export function startScheduledJobs(): ScheduledTask | null {
  const serverless = Boolean(
    process.env.VERCEL ??
      process.env.AWS_LAMBDA_FUNCTION_NAME ??
      process.env.NETLIFY ??
      process.env.FUNCTIONS_WORKER_RUNTIME
  );

  if (serverless || process.env.DISABLE_CRON === "true" || process.env.NODE_ENV === "test") {
    console.log("[cron] booking expiry not scheduled in this environment.");
    return null;
  }

  const task = cron.schedule(EXPIRY_SCHEDULE, runExpiry, {
    timezone: TIMEZONE,
    name: "booking-expiry",
    noOverlap: true,
  });
  console.log(`[cron] booking expiry scheduled (${EXPIRY_SCHEDULE}, ${TIMEZONE}).`);
  return task;
}
