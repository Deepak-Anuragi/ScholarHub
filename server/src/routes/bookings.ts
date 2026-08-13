import crypto from "crypto";
import { Router, Request, Response } from "express";

import connectDB from "../lib/mongodb";
import BookingModel from "../models/Booking";
import DigitalIDModel from "../models/DigitalID";
import PayoutLedgerModel from "../models/PayoutLedger";
import SlotModel from "../models/Slot";
import LibraryModel from "../models/Library";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ── POST /api/bookings/create-order ───────────────────────────────────────
router.post("/create-order", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    const { libraryId, slotId, plan, startDate } = req.body as {
      libraryId?: string; slotId?: string;
      plan?: "MONTHLY" | "QUARTERLY" | "ANNUAL"; startDate?: string;
    };

    if (!libraryId || !plan || !startDate) {
      res.status(400).json({ error: "libraryId, plan, and startDate are required." });
      return;
    }

    await connectDB();
    const library = await LibraryModel.findById(libraryId);
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }

    if (slotId) {
      const slot = await SlotModel.findById(slotId);
      if (!slot || slot.availableSeats <= 0) {
        res.status(409).json({ error: "Selected slot is full. Please choose another slot or join the waitlist." });
        return;
      }
    }

    const addMonths = (date: Date, months: number) => {
      const d = new Date(date); d.setMonth(d.getMonth() + months); return d;
    };
    const start = new Date(startDate);
    const end = plan === "QUARTERLY" ? addMonths(start, 3) : plan === "ANNUAL" ? addMonths(start, 12) : addMonths(start, 1);

    const libFee = plan === "QUARTERLY" ? (library.quarterlyFee ?? library.monthlyFee * 3)
      : plan === "ANNUAL" ? (library.annualFee ?? library.monthlyFee * 12) : library.monthlyFee;
    const platformFee = Math.round(libFee * 0.02);
    const total = libFee + platformFee;

    let razorpayOrderId: string;
    let razorpayKeyId: string | undefined;

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const Razorpay = (await import("razorpay")).default;
      const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const order = await rzp.orders.create({ amount: total * 100, currency: "INR", receipt: `scholarsHub_${Date.now()}` });
      razorpayOrderId = order.id;
      razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    } else {
      razorpayOrderId = `mock_order_${Date.now()}`;
    }

    const booking = await BookingModel.create({
      studentId: user.id, libraryId, slotId: slotId ?? undefined,
      startDate: start, endDate: end, plan, amountPaid: total,
      paymentStatus: "PENDING", razorpayOrderId,
    });

    res.json({
      bookingId: String(booking._id), razorpay_order_id: razorpayOrderId,
      razorpay_key_id: razorpayKeyId, amount: total, library_fee: libFee,
      platform_fee: platformFee, currency: "INR", library_name: library.name,
      plan, start_date: start.toISOString(), end_date: end.toISOString(),
    });
  } catch (err) {
    console.error("[create-order]", err);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// ── POST /api/bookings/confirm ─────────────────────────────────────────────
router.post("/confirm", async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body as {
      razorpay_order_id?: string; razorpay_payment_id?: string;
      razorpay_signature?: string; bookingId?: string;
    };

    const isMockOrder = razorpay_order_id?.startsWith("mock_order_");
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!isMockOrder && keySecret && razorpay_order_id && razorpay_payment_id) {
      const expected = crypto.createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      if (expected !== razorpay_signature) {
        res.status(400).json({ error: "Invalid payment signature." });
        return;
      }
    }

    await connectDB();
    const booking = await BookingModel.findOneAndUpdate(
      { _id: bookingId, razorpayOrderId: razorpay_order_id },
      { paymentStatus: "SUCCESS", status: "ACTIVE", paymentId: razorpay_payment_id },
      { new: true }
    );

    if (!booking) { res.status(404).json({ error: "Booking not found." }); return; }

    if (booking.slotId) await SlotModel.findByIdAndUpdate(booking.slotId, { $inc: { availableSeats: -1 } });
    await LibraryModel.findByIdAndUpdate(booking.libraryId, { $inc: { availableSeats: -1 } });

    const qrData = JSON.stringify({
      bookingId: String(booking._id), studentId: String(booking.studentId),
      libraryId: String(booking.libraryId), plan: booking.plan, validUntil: booking.endDate.toISOString(),
    });
    await DigitalIDModel.create({
      bookingId: booking._id, studentId: booking.studentId,
      libraryId: booking.libraryId, qrData, issuedAt: new Date(), validUntil: booking.endDate,
    });

    const commissionRate = 0.10;
    const platformShare = Math.round(booking.amountPaid * commissionRate);
    const ownerShare = booking.amountPaid - platformShare;
    const library = await LibraryModel.findById(booking.libraryId);
    if (library) {
      await PayoutLedgerModel.create({
        bookingId: booking._id, libraryId: booking.libraryId, ownerId: library.ownerId,
        totalAmount: booking.amountPaid, commissionRate, platformShare, ownerShare, payoutStatus: "PENDING",
      });
    }

    res.json({ success: true, bookingId: String(booking._id) });
  } catch (err) {
    console.error("[confirm]", err);
    res.status(500).json({ error: "Failed to confirm booking." });
  }
});

export default router;
