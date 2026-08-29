import crypto from "crypto";

import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../app";
import { priceBooking, splitPayout } from "../lib/pricing";
import BookingModel from "../models/Booking";
import DigitalIDModel from "../models/DigitalID";
import LibraryModel from "../models/Library";
import PayoutLedgerModel from "../models/PayoutLedger";
import SlotModel from "../models/Slot";
import {
  clearDb,
  closeDb,
  createLibrary,
  createSlot,
  openDb,
  sessionFor,
} from "../test/helpers";

const app = createApp();

beforeAll(openDb);
beforeEach(clearDb);
afterEach(() => vi.unstubAllEnvs());
afterAll(closeDb);

function razorpaySignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

async function pendingBooking(studentId: string) {
  const owner = sessionFor("owner");
  const library = await createLibrary(owner.id);
  const slot = await createSlot(library._id);
  const { libraryFee, platformFee, total } = priceBooking(library.monthlyFee);

  const booking = await BookingModel.create({
    studentId,
    libraryId: library._id,
    slotId: slot._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    plan: "MONTHLY",
    libraryFee,
    platformFee,
    amountPaid: total,
    paymentStatus: "PENDING",
    razorpayOrderId: "order_TESTORDER1",
  });

  return { booking, library, slot, libraryFee, platformFee, total };
}

describe("POST /api/bookings/create-order", () => {
  it("returns a breakdown whose parts add up to the amount charged", async () => {
    // No Razorpay keys: the route mints a mock order instead of calling out.
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");

    const student = sessionFor("student");
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);

    const res = await request(app)
      .post("/api/bookings/create-order")
      .set("Cookie", student.cookie)
      .send({ libraryId: String(library._id), plan: "MONTHLY", startDate: new Date().toISOString() });

    expect(res.status).toBe(200);
    expect(res.body.library_fee + res.body.platform_fee).toBe(res.body.amount);
    expect(res.body.library_fee).toBe(library.monthlyFee);

    // The same figures are persisted, so the payout is split on what the
    // student saw rather than recomputed from a total.
    const booking = await BookingModel.findById(res.body.bookingId);
    expect(booking?.libraryFee).toBe(res.body.library_fee);
    expect(booking?.platformFee).toBe(res.body.platform_fee);
    expect(booking?.amountPaid).toBe(res.body.amount);
  });
});

describe("POST /api/bookings/confirm", () => {
  it("takes a seat exactly once when the same confirmation is replayed", async () => {
    const student = sessionFor("student");
    const { booking, library, slot } = await pendingBooking(student.id);
    const paymentId = "pay_TESTPAYMENT1";

    const body = {
      bookingId: String(booking._id),
      razorpay_order_id: booking.razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: razorpaySignature(booking.razorpayOrderId as string, paymentId),
    };

    const first = await request(app)
      .post("/api/bookings/confirm")
      .set("Cookie", student.cookie)
      .send(body);
    // Razorpay retries webhooks, so a replay must not decrement seats twice.
    const second = await request(app)
      .post("/api/bookings/confirm")
      .set("Cookie", student.cookie)
      .send(body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.alreadyConfirmed).toBe(true);

    expect((await LibraryModel.findById(library._id))?.availableSeats).toBe(
      library.availableSeats - 1
    );
    expect((await SlotModel.findById(slot._id))?.availableSeats).toBe(
      slot.availableSeats - 1
    );
    expect(await DigitalIDModel.countDocuments({ bookingId: booking._id })).toBe(1);
    expect(await PayoutLedgerModel.countDocuments({ bookingId: booking._id })).toBe(1);
  });

  it("writes a ledger row whose shares add up to the amount charged", async () => {
    const student = sessionFor("student");
    const { booking, libraryFee, platformFee, total } = await pendingBooking(student.id);
    const paymentId = "pay_TESTPAYMENT2";

    await request(app)
      .post("/api/bookings/confirm")
      .set("Cookie", student.cookie)
      .send({
        bookingId: String(booking._id),
        razorpay_order_id: booking.razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: razorpaySignature(booking.razorpayOrderId as string, paymentId),
      });

    const ledger = await PayoutLedgerModel.findOne({ bookingId: booking._id });
    expect(ledger).not.toBeNull();
    expect(ledger!.totalAmount).toBe(total);
    expect(ledger!.platformShare + ledger!.ownerShare).toBe(ledger!.totalAmount);
    expect(ledger!.ownerShare).toBe(libraryFee);
    expect(ledger!.platformShare).toBe(platformFee);
    expect(ledger!.commissionRate).toBe(splitPayout(total, libraryFee).commissionRate);
  });

  it("rejects a payment whose signature does not verify", async () => {
    const student = sessionFor("student");
    const { booking, library } = await pendingBooking(student.id);

    const res = await request(app)
      .post("/api/bookings/confirm")
      .set("Cookie", student.cookie)
      .send({
        bookingId: String(booking._id),
        razorpay_order_id: booking.razorpayOrderId,
        razorpay_payment_id: "pay_FORGED",
        razorpay_signature: "0".repeat(64),
      });

    expect(res.status).toBe(400);
    expect((await BookingModel.findById(booking._id))?.paymentStatus).toBe("PENDING");
    expect((await LibraryModel.findById(library._id))?.availableSeats).toBe(
      library.availableSeats
    );
  });

  it("refuses a mock order id once Razorpay is configured", async () => {
    const student = sessionFor("student");
    const { booking } = await pendingBooking(student.id);
    await BookingModel.findByIdAndUpdate(booking._id, { razorpayOrderId: "mock_order_1" });

    const res = await request(app)
      .post("/api/bookings/confirm")
      .set("Cookie", student.cookie)
      .send({ bookingId: String(booking._id), razorpay_order_id: "mock_order_1" });

    expect(res.status).toBe(400);
    expect((await BookingModel.findById(booking._id))?.paymentStatus).toBe("PENDING");
  });

  it("cannot confirm another student's booking", async () => {
    const student = sessionFor("student");
    const intruder = sessionFor("student");
    const { booking, library } = await pendingBooking(student.id);
    const paymentId = "pay_TESTPAYMENT3";

    const res = await request(app)
      .post("/api/bookings/confirm")
      .set("Cookie", intruder.cookie)
      .send({
        bookingId: String(booking._id),
        razorpay_order_id: booking.razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: razorpaySignature(booking.razorpayOrderId as string, paymentId),
      });

    expect(res.status).toBe(404);
    expect((await BookingModel.findById(booking._id))?.paymentStatus).toBe("PENDING");
    expect((await LibraryModel.findById(library._id))?.availableSeats).toBe(
      library.availableSeats
    );
  });
});
