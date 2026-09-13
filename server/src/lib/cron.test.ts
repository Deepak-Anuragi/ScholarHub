import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import cron from "node-cron";

import { createApp } from "../app";
import { EXPIRY_SCHEDULE, expireFinishedBookings } from "./cron";
import { notifyWaitlist, releaseExpiredHolds, WAITLIST_HOLD_MS } from "./waitlist";
import BookingModel from "../models/Booking";
import LibraryModel from "../models/Library";
import NotificationModel from "../models/Notification";
import SlotModel from "../models/Slot";
import WaitlistModel from "../models/Waitlist";
import {
  clearDb,
  closeDb,
  createLibrary,
  createSlot,
  createUser,
  openDb,
  sessionFor,
} from "../test/helpers";

const app = createApp();

beforeAll(openDb);
beforeEach(clearDb);
afterAll(closeDb);

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function bookedSeat(overrides: Record<string, unknown> = {}) {
  const owner = sessionFor("owner");
  const student = sessionFor("student");
  // Seats as they stand after a confirmed booking took one of each.
  const library = await createLibrary(owner.id, { totalSeats: 50, availableSeats: 49 });
  const slot = await createSlot(library._id, { totalSeats: 20, availableSeats: 19 });

  const booking = await BookingModel.create({
    studentId: student.id,
    libraryId: library._id,
    slotId: slot._id,
    startDate: daysAgo(60),
    endDate: daysAgo(1),
    plan: "MONTHLY",
    libraryFee: 1500,
    platformFee: 30,
    amountPaid: 1530,
    paymentStatus: "SUCCESS",
    status: "ACTIVE",
    ...overrides,
  });

  return { owner, student, library, slot, booking };
}

describe("the schedule", () => {
  // A typo here would otherwise only show up as a job that never runs.
  it("is a cron expression node-cron accepts", () => {
    expect(cron.validate(EXPIRY_SCHEDULE)).toBe(true);
  });
});

describe("expireFinishedBookings", () => {
  it("expires a finished booking and gives the seat back", async () => {
    const { booking, library, slot } = await bookedSeat();

    const report = await expireFinishedBookings();

    expect(report.expired).toBe(1);
    expect(report.seatsReturned).toBe(1);
    expect((await BookingModel.findById(booking._id))?.status).toBe("EXPIRED");
    expect((await LibraryModel.findById(library._id))?.availableSeats).toBe(50);
    expect((await SlotModel.findById(slot._id))?.availableSeats).toBe(20);
  });

  it("leaves a booking that has not finished alone", async () => {
    const { booking, library } = await bookedSeat({ endDate: daysAhead(10) });

    const report = await expireFinishedBookings();

    expect(report.expired).toBe(0);
    expect((await BookingModel.findById(booking._id))?.status).toBe("ACTIVE");
    expect((await LibraryModel.findById(library._id))?.availableSeats).toBe(49);
  });

  // status defaults to ACTIVE at create time, before payment, and an unpaid
  // booking never took a seat — returning one would invent a seat.
  it("ignores a booking that was never paid for", async () => {
    const { booking, library, slot } = await bookedSeat({ paymentStatus: "PENDING" });

    const report = await expireFinishedBookings();

    expect(report.expired).toBe(0);
    expect((await BookingModel.findById(booking._id))?.status).toBe("ACTIVE");
    expect((await LibraryModel.findById(library._id))?.availableSeats).toBe(49);
    expect((await SlotModel.findById(slot._id))?.availableSeats).toBe(19);
  });

  it("returns the seat exactly once when the job runs twice", async () => {
    const { library, slot } = await bookedSeat();

    await expireFinishedBookings();
    const second = await expireFinishedBookings();

    expect(second.expired).toBe(0);
    expect((await LibraryModel.findById(library._id))?.availableSeats).toBe(50);
    expect((await SlotModel.findById(slot._id))?.availableSeats).toBe(20);
  });

  it("never counts a seat past the seats that exist", async () => {
    // A seat already returned by hand: the counts are full before the run.
    const { library, slot } = await bookedSeat();
    await LibraryModel.findByIdAndUpdate(library._id, { availableSeats: 50 });
    await SlotModel.findByIdAndUpdate(slot._id, { availableSeats: 20 });

    await expireFinishedBookings();

    expect((await LibraryModel.findById(library._id))?.availableSeats).toBe(50);
    expect((await SlotModel.findById(slot._id))?.availableSeats).toBe(20);
  });

  it("alerts the front of the queue for the slot that freed up", async () => {
    const { library, slot } = await bookedSeat();
    const first = await createUser("student");
    const second = await createUser("student");
    await WaitlistModel.create({ studentId: first.id, libraryId: library._id, slotId: slot._id, position: 1 });
    await WaitlistModel.create({ studentId: second.id, libraryId: library._id, slotId: slot._id, position: 2 });

    const report = await expireFinishedBookings();

    expect(report.waitlistNotified).toBe(1);
    expect(await NotificationModel.countDocuments({ userId: first.id, type: "SEAT_ALERT" })).toBe(1);
    expect(await NotificationModel.countDocuments({ userId: second.id })).toBe(0);

    const held = await WaitlistModel.findOne({ studentId: first.id });
    expect(held?.notified).toBe(true);
    expect(held!.heldUntil!.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("notifyWaitlist", () => {
  it("moves down the queue instead of telling one person twice", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);
    const slot = await createSlot(library._id);
    const first = await createUser("student");
    const second = await createUser("student");
    await WaitlistModel.create({ studentId: first.id, libraryId: library._id, slotId: slot._id, position: 1 });
    await WaitlistModel.create({ studentId: second.id, libraryId: library._id, slotId: slot._id, position: 2 });

    const args = {
      libraryId: library._id as never,
      libraryName: library.name,
      slotId: slot._id as never,
      seats: 1,
    };
    await notifyWaitlist(args);
    await notifyWaitlist(args);

    expect(await NotificationModel.countDocuments({ userId: first.id })).toBe(1);
    expect(await NotificationModel.countDocuments({ userId: second.id })).toBe(1);
  });

  // populate() hands back null for an entry whose account is gone, which used
  // to throw and, from the owner route, turned a valid update into a 500.
  it("skips an entry whose student no longer exists", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);
    const slot = await createSlot(library._id);
    const ghost = sessionFor("student");
    const real = await createUser("student");
    await WaitlistModel.create({ studentId: ghost.id, libraryId: library._id, slotId: slot._id, position: 1 });
    await WaitlistModel.create({ studentId: real.id, libraryId: library._id, slotId: slot._id, position: 2 });

    const notified = await notifyWaitlist({
      libraryId: library._id as never,
      libraryName: library.name,
      slotId: slot._id as never,
      seats: 2,
    });

    expect(notified).toBe(1);
    expect(await NotificationModel.countDocuments({ userId: real.id })).toBe(1);
  });

  it("tells nobody when no seat came free", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);
    const slot = await createSlot(library._id);
    const student = await createUser("student");
    await WaitlistModel.create({ studentId: student.id, libraryId: library._id, slotId: slot._id, position: 1 });

    const notified = await notifyWaitlist({
      libraryId: library._id as never,
      libraryName: library.name,
      slotId: slot._id as never,
      seats: 0,
    });

    expect(notified).toBe(0);
    expect(await NotificationModel.countDocuments()).toBe(0);
  });
});

describe("releaseExpiredHolds", () => {
  it("drops a lapsed hold and closes the gap behind it", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);
    const slot = await createSlot(library._id);
    const lapsed = sessionFor("student");
    const waiting = sessionFor("student");

    await WaitlistModel.create({
      studentId: lapsed.id,
      libraryId: library._id,
      slotId: slot._id,
      position: 1,
      notified: true,
      heldUntil: new Date(Date.now() - 60_000),
    });
    const behind = await WaitlistModel.create({
      studentId: waiting.id,
      libraryId: library._id,
      slotId: slot._id,
      position: 2,
    });

    const released = await releaseExpiredHolds();

    expect(released).toBe(1);
    expect(await WaitlistModel.countDocuments({ studentId: lapsed.id })).toBe(0);
    expect((await WaitlistModel.findById(behind._id))?.position).toBe(1);
  });

  it("leaves a hold that is still running", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);
    const slot = await createSlot(library._id);
    const holder = sessionFor("student");
    await WaitlistModel.create({
      studentId: holder.id,
      libraryId: library._id,
      slotId: slot._id,
      position: 1,
      notified: true,
      heldUntil: new Date(Date.now() + WAITLIST_HOLD_MS),
    });

    expect(await releaseExpiredHolds()).toBe(0);
    expect(await WaitlistModel.countDocuments({ studentId: holder.id })).toBe(1);
  });
});

// The owner route and the nightly job share one notifier; this proves the
// route still reaches it after the extraction.
describe("PATCH /api/owner/slots/:id", () => {
  it("alerts the waitlist when an owner raises the seat count", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);
    const slot = await createSlot(library._id, { totalSeats: 20, availableSeats: 0 });
    const student = await createUser("student");
    await WaitlistModel.create({
      studentId: student.id,
      libraryId: library._id,
      slotId: slot._id,
      position: 1,
    });

    const res = await request(app)
      .patch(`/api/owner/slots/${String(slot._id)}`)
      .set("Cookie", owner.cookie)
      .send({ availableSeats: 2 });

    expect(res.status).toBe(200);
    expect(await NotificationModel.countDocuments({ userId: student.id, type: "SEAT_ALERT" })).toBe(1);
    expect((await WaitlistModel.findOne({ studentId: student.id }))?.notified).toBe(true);
  });
});
