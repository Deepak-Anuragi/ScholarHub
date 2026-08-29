import mongoose from "mongoose";

import NotificationModel from "../models/Notification";
import WaitlistModel from "../models/Waitlist";
import { sendSeatAlertEmail } from "./email";
import { emitNotificationCount } from "./notifications";

/** How long a notified student keeps first claim on the seat. */
export const WAITLIST_HOLD_MS = 2 * 60 * 60 * 1000;

type Id = mongoose.Types.ObjectId | string;

export interface NotifyWaitlistParams {
  libraryId: Id;
  /** Shown in the alert, so the student knows which library opened up. */
  libraryName: string;
  /** Waitlists are per slot; omitted only for a library-wide opening. */
  slotId?: Id | null;
  /** How many seats came free. At most this many people are told. */
  seats: number;
}

/**
 * Tell the front of a slot's queue that a seat opened, and hold it for them.
 *
 * Called from two places — an owner raising a slot's seat count, and the
 * nightly expiry job — so the alert, the email, the hold and the socket
 * badge stay in one place instead of being copied.
 *
 * Anyone whose hold is still running is skipped rather than told twice: a
 * second seat freeing up belongs to the next person in line, not to the one
 * already holding one.
 */
export async function notifyWaitlist(params: NotifyWaitlistParams): Promise<number> {
  const { libraryId, libraryName, slotId, seats } = params;
  if (seats <= 0) return 0;

  const now = new Date();
  const waiting = await WaitlistModel.find({
    libraryId,
    ...(slotId ? { slotId } : {}),
    $or: [{ notified: false }, { heldUntil: { $lte: now } }],
  })
    .sort({ position: 1 })
    .limit(seats)
    .populate("studentId", "name email phone fcmToken");

  let notified = 0;
  for (const entry of waiting) {
    const student = entry.studentId as {
      _id: mongoose.Types.ObjectId;
      name?: string;
      email?: string;
    } | null;

    // The account behind the entry is gone: populate hands back null, and
    // there is nobody left to tell. Skipping beats taking the caller down.
    if (!student) {
      console.warn(`[waitlist] entry ${String(entry._id)} has no student; skipping.`);
      continue;
    }

    await NotificationModel.create({
      userId: student._id,
      type: "SEAT_ALERT",
      title: "Seat Available!",
      message: `A seat opened at ${libraryName}. You have 2 hrs to book.`,
      link: `/library/${String(entry.libraryId)}`,
      isRead: false,
    });

    if (student.email) {
      try {
        await sendSeatAlertEmail(
          student.email,
          student.name ?? "Student",
          libraryName,
          `/library/${String(entry.libraryId)}`
        );
      } catch (emailErr) {
        // Email is best-effort: the in-app alert has already been written.
        console.error("[waitlist] seat alert email failed:", emailErr);
      }
    }

    await WaitlistModel.findByIdAndUpdate(entry._id, {
      notified: true,
      heldUntil: new Date(Date.now() + WAITLIST_HOLD_MS),
    });

    await emitNotificationCount(String(student._id));
    notified += 1;
  }

  return notified;
}

/**
 * Drop entries whose two-hour hold ran out without a booking.
 *
 * Leaving them in place would stall the queue: they sit at the front holding
 * a claim they no longer have. Positions behind them close up, the same way
 * they do when a student leaves a waitlist by hand.
 */
export async function releaseExpiredHolds(now: Date = new Date()): Promise<number> {
  const lapsed = await WaitlistModel.find({
    notified: true,
    heldUntil: { $lte: now },
  }).sort({ position: 1 });

  for (const entry of lapsed) {
    const removed = await WaitlistModel.findByIdAndDelete(entry._id);
    if (!removed) continue; // Someone else got there first.

    await WaitlistModel.updateMany(
      {
        libraryId: entry.libraryId,
        slotId: entry.slotId ?? null,
        position: { $gt: entry.position },
      },
      { $inc: { position: -1 } }
    );
  }

  return lapsed.length;
}
