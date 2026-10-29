import crypto from "crypto";
import { Router, Request, Response } from "express";

import connectDB from "../lib/mongodb";
import { priceBooking, splitPayout } from "../lib/pricing";
import BookingModel from "../models/Booking";
import DigitalIDModel from "../models/DigitalID";
import PayoutLedgerModel from "../models/PayoutLedger";
import SlotModel from "../models/Slot";
import LibraryModel from "../models/Library";
import UserModel from "../models/User";
import NotificationModel from "../models/Notification";
import { emitNotificationCount } from "../lib/notifications";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ── POST /api/bookings/validate-coupon ────────────────────────────────────
router.post("/validate-coupon", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, amount } = req.body as { code?: string; amount?: number };
    if (!code || typeof code !== "string" || !code.trim()) {
      res.status(400).json({ error: "Coupon code is required." });
      return;
    }

    await connectDB();
    const CouponModel = (await import("../models/Coupon")).default;
    const now = new Date();
    const coupon = await CouponModel.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      expiresAt: { $gt: now },
    });

    if (!coupon) {
      res.status(404).json({ error: "Invalid or expired coupon code." });
      return;
    }

    if (coupon.usedCount >= coupon.maxUses) {
      res.status(400).json({ error: "Coupon usage limit has been reached." });
      return;
    }

    const baseAmount = typeof amount === "number" && amount > 0 ? amount : 0;
    const discount =
      coupon.discountType === "percent"
        ? Math.floor((baseAmount * coupon.discountValue) / 100)
        : Math.min(baseAmount, coupon.discountValue);

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
    });
  } catch (err) {
    console.error("[validate-coupon]", err);
    res.status(500).json({ error: "Failed to validate coupon." });
  }
});

// ── POST /api/bookings/create-order ───────────────────────────────────────
router.post("/create-order", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    const { libraryId, slotId, plan, startDate, seatNumber, couponCode } = req.body as {
      libraryId?: string; slotId?: string;
      plan?: "MONTHLY" | "QUARTERLY" | "ANNUAL"; startDate?: string;
      seatNumber?: string;
      couponCode?: string;
    };

    if ((user.role as string).toLowerCase() === "admin") {
      res.status(403).json({ error: "Administrators cannot book library seats. Please sign in with a student account to book." });
      return;
    }

    if (!libraryId || !plan || !startDate) {
      res.status(400).json({ error: "libraryId, plan, and startDate are required." });
      return;
    }

    await connectDB();
    const library = await LibraryModel.findById(libraryId);
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    if (library.isActive === false || library.isSuspended === true || (library as any).status === "SUSPENDED") {
      res.status(400).json({ error: "This library is currently suspended and cannot accept new bookings." });
      return;
    }

    let slot: InstanceType<typeof SlotModel> | null = null;
    if (slotId) {
      slot = await SlotModel.findById(slotId);
      if (!slot || slot.availableSeats <= 0) {
        res.status(409).json({ error: "Selected slot is full. Please choose another slot or join the waitlist." });
        return;
      }
    }

    // AC-SM-4: Reject bookings that start inside any blocked date range
    const bookingStartMs = new Date(startDate).getTime();
    if (Array.isArray(library.blockedDates) && library.blockedDates.length > 0) {
      for (const bd of library.blockedDates) {
        const s = new Date(bd.start).getTime();
        const e = new Date(bd.end).getTime();
        if (bookingStartMs >= s && bookingStartMs <= e) {
          res.status(409).json({
            error: `Library is blocked from ${new Date(s).toISOString().slice(0, 10)} to ${new Date(e).toISOString().slice(0, 10)} (${bd.type}${bd.note ? `: ${bd.note}` : ""}). Please pick another start date.`,
          });
          return;
        }
      }
    }

    // Task 8.4 — Seat conflict check (Req 5.4)
    if (seatNumber) {
      const seatQuery: Record<string, unknown> = {
        libraryId,
        seatNumber,
        status: "ACTIVE",
      };
      if (slotId) seatQuery.slotId = slotId;

      const seatConflict = await BookingModel.exists(seatQuery);
      if (seatConflict) {
        res.status(409).json({ error: "Seat already taken. Please choose another seat." });
        return;
      }
    }

    const addMonths = (date: Date, months: number) => {
      const d = new Date(date); d.setMonth(d.getMonth() + months); return d;
    };
    const start = new Date(startDate);
    const end = plan === "QUARTERLY" ? addMonths(start, 3) : plan === "ANNUAL" ? addMonths(start, 12) : addMonths(start, 1);

    // AC-SM-2: Prefer slot-level pricing, fall back to library-level
    const slotFees = slot
      ? { monthlyFee: slot.monthlyFee, quarterlyFee: slot.quarterlyFee, annualFee: slot.annualFee }
      : null;
    const monthlyBase = slotFees?.monthlyFee ?? library.monthlyFee;
    const planFee =
      plan === "QUARTERLY"
        ? (slotFees?.quarterlyFee ?? library.quarterlyFee ?? monthlyBase * 3)
        : plan === "ANNUAL"
          ? (slotFees?.annualFee ?? library.annualFee ?? monthlyBase * 12)
          : monthlyBase;
    const { libraryFee, platformFee, total: baseTotal } = priceBooking(planFee);

    // Task 16.4 — Apply referral discount (Req 11.4, 11.5)
    let discountAmount = 0;
    let creditsRemaining = 0;

    const studentUser = await UserModel.findById(user.id).select("referralCredits");
    if (studentUser && studentUser.referralCredits > 0) {
      const potentialDiscount = Math.min(50, studentUser.referralCredits);
      // Ensure amountPaid never drops below ₹1
      if (baseTotal - potentialDiscount >= 1) {
        discountAmount = potentialDiscount;
      }
      // Deduct credits atomically
      if (discountAmount > 0) {
        await UserModel.findByIdAndUpdate(user.id, { $inc: { referralCredits: -discountAmount } });
        creditsRemaining = studentUser.referralCredits - discountAmount;
      } else {
        creditsRemaining = studentUser.referralCredits;
      }
    }

    // Coupon discount
    let couponDiscount = 0;
    let appliedCouponCode: string | undefined;
    if (couponCode) {
      try {
        const CouponModel = (await import("../models/Coupon")).default;
        const now = new Date();
        const coupon = await CouponModel.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
          expiresAt: { $gt: now },
        });
        if (coupon && coupon.usedCount < coupon.maxUses) {
          const subtotal = baseTotal - discountAmount;
          const potential = coupon.discountType === "percent"
            ? Math.floor(subtotal * coupon.discountValue / 100)
            : coupon.discountValue;
          if (subtotal - potential >= 1) {
            couponDiscount = potential;
            appliedCouponCode = coupon.code;
            await CouponModel.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
          }
        }
      } catch { /* coupon lookup failure is non-critical */ }
    }
    const total = baseTotal - discountAmount - couponDiscount;

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

    // Task 8.4 — Store seatNumber on Booking document (Req 5.3)
    const booking = await BookingModel.create({
      studentId: user.id, libraryId, slotId: slotId ?? undefined,
      startDate: start, endDate: end, plan,
      libraryFee, platformFee, amountPaid: total,
      paymentStatus: "PENDING", razorpayOrderId,
      ...(seatNumber ? { seatNumber } : {}),
    });

    res.json({
      bookingId: String(booking._id), razorpay_order_id: razorpayOrderId,
      razorpay_key_id: razorpayKeyId, amount: total, library_fee: libraryFee,
      platform_fee: platformFee, currency: "INR", library_name: library.name,
      plan, start_date: start.toISOString(), end_date: end.toISOString(),
      discountAmount, creditsRemaining, couponDiscount, couponCode: appliedCouponCode,
    });
  } catch (err) {
    console.error("[create-order]", err);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// ── POST /api/bookings/confirm ─────────────────────────────────────────────
router.post("/confirm", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body as {
      razorpay_order_id?: string; razorpay_payment_id?: string;
      razorpay_signature?: string; bookingId?: string;
    };

    if (!bookingId || !razorpay_order_id) {
      res.status(400).json({ error: "bookingId and razorpay_order_id are required." });
      return;
    }

    const isMockOrder = razorpay_order_id.startsWith("mock_order_");
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const razorpayConfigured = Boolean(keyId && keySecret);

    if (isMockOrder) {
      // Mock orders exist so the flow is demoable without Razorpay keys. They
      // must never be accepted by a configured or production deployment —
      // otherwise anyone can mint a paid booking by prefixing their order id.
      if (razorpayConfigured || process.env.NODE_ENV === "production") {
        res.status(400).json({ error: "Invalid payment reference." });
        return;
      }
    } else {
      // Fail closed: a real order without a verifiable signature is rejected.
      // Previously a missing RAZORPAY_KEY_SECRET silently skipped this check.
      if (!razorpayConfigured) {
        res.status(503).json({ error: "Payment verification is unavailable." });
        return;
      }
      if (!razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({ error: "Missing payment confirmation details." });
        return;
      }
      const expected = crypto.createHmac("sha256", keySecret!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      const expectedBuf = Buffer.from(expected, "utf8");
      const actualBuf = Buffer.from(razorpay_signature, "utf8");
      if (
        expectedBuf.length !== actualBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, actualBuf)
      ) {
        res.status(400).json({ error: "Invalid payment signature." });
        return;
      }
    }

    await connectDB();

    // paymentStatus: "PENDING" in the filter makes this idempotent, and
    // studentId scopes it to the caller. Razorpay retries webhooks, so a
    // replay must not decrement seats or write ledger rows a second time.
    const booking = await BookingModel.findOneAndUpdate(
      {
        _id: bookingId,
        razorpayOrderId: razorpay_order_id,
        studentId: user.id,
        paymentStatus: "PENDING",
      },
      { paymentStatus: "SUCCESS", status: "ACTIVE", paymentId: razorpay_payment_id },
      { new: true }
    );

    if (!booking) {
      // Either already confirmed (a retry) or not this student's booking.
      // Answer 200 for an own, already-successful booking so retries settle.
      const existing = await BookingModel.findOne({
        _id: bookingId,
        razorpayOrderId: razorpay_order_id,
        studentId: user.id,
      });
      if (existing?.paymentStatus === "SUCCESS") {
        const notifExists = await NotificationModel.exists({
          userId: user.id,
          link: "/student/bookings",
        });
        if (!notifExists) {
          const libDoc = await LibraryModel.findById(existing.libraryId).select("name").lean();
          await NotificationModel.create({
            userId: user.id,
            type: "BOOKING_CONFIRMED",
            title: `Booking Confirmed at ${libDoc?.name || "Library"}`,
            message: `Your booking at ${libDoc?.name || "the library"} is now active! Plan: ${existing.plan}. Your Digital ID pass is ready.`,
            link: "/student/bookings",
          });
          await emitNotificationCount(user.id);
        }
        res.json({ success: true, bookingId: String(existing._id), alreadyConfirmed: true });
        return;
      }
      res.status(404).json({ error: "Booking not found." });
      return;
    }

    // Guarded so a seat count can never be driven negative by a race.
    if (booking.slotId) {
      await SlotModel.findOneAndUpdate(
        { _id: booking.slotId, availableSeats: { $gt: 0 } },
        { $inc: { availableSeats: -1 } }
      );
    }
    await LibraryModel.findOneAndUpdate(
      { _id: booking.libraryId, availableSeats: { $gt: 0 } },
      { $inc: { availableSeats: -1 } }
    );

    const qrData = JSON.stringify({
      bookingId: String(booking._id), studentId: String(booking.studentId),
      libraryId: String(booking.libraryId), plan: booking.plan, validUntil: booking.endDate.toISOString(),
    });

    // Task 8.5 — Include seatNumber in DigitalID if present (Req 5.5)
    await DigitalIDModel.create({
      bookingId: booking._id, studentId: booking.studentId,
      libraryId: booking.libraryId, qrData, issuedAt: new Date(), validUntil: booking.endDate,
      ...(booking.seatNumber ? { seatNumber: booking.seatNumber } : {}),
    });

    // The owner is paid the library's fee in full; the platform keeps the fee
    // it charged the student on top of it. Derived from the same rate as
    // create-order, so the ledger always reconciles with what was charged.
    const split = splitPayout(booking.amountPaid, booking.libraryFee);
    const library = await LibraryModel.findById(booking.libraryId);
    if (library) {
      await PayoutLedgerModel.create({
        bookingId: booking._id, libraryId: booking.libraryId, ownerId: library.ownerId,
        ...split, payoutStatus: "PENDING",
      });
    }

    // Task 16.3 — Award ₹50 referral credits on first successful booking (Req 11.3)
    const successfulBookingCount = await BookingModel.countDocuments({
      studentId: user.id,
      paymentStatus: "SUCCESS",
    });

    if (successfulBookingCount === 1) {
      // This is the student's first successful booking — check for referrer
      const studentDoc = await UserModel.findById(user.id).select("referredBy");
      if (studentDoc?.referredBy) {
        // Award ₹50 to the referred student
        await UserModel.findByIdAndUpdate(user.id, { $inc: { referralCredits: 50 } });
        // Award ₹50 to the referring student
        await UserModel.findByIdAndUpdate(studentDoc.referredBy, { $inc: { referralCredits: 50 } });
      }
    }

    const isManualApproval = library?.bookingApprovalMode === "MANUAL_APPROVAL";
    if (isManualApproval) {
      booking.approvalStatus = "PENDING";
      await booking.save();
    }

    // Professional booking notification for Library Owner (Req 6.6)
    if (library?.ownerId) {
      const studentUser = await UserModel.findById(user.id).select("name phone email").lean();
      const slotDoc = booking.slotId ? await SlotModel.findById(booking.slotId).select("name startTime endTime").lean() : null;
      const slotDetail = slotDoc ? ` (${slotDoc.name}: ${slotDoc.startTime} - ${slotDoc.endTime})` : "";
      const seatDetail = booking.seatNumber ? ` | Seat #${booking.seatNumber}` : "";

      await NotificationModel.create({
        userId: library.ownerId,
        type: "NEW_BOOKING",
        title: isManualApproval ? "New Booking Awaiting Approval!" : "New Student Booking Confirmed!",
        message: isManualApproval
          ? `${studentUser?.name || "A student"} has requested a seat at ${library.name}${slotDetail}${seatDetail} under the ${booking.plan} plan. Please review and approve in Bookings.`
          : `${studentUser?.name || "A student"} has booked a seat at ${library.name}${slotDetail}${seatDetail} under the ${booking.plan} plan. Payout of ₹${booking.libraryFee} credited to ledger.`,
        link: "/owner/bookings",
      });
      await emitNotificationCount(String(library.ownerId));
    }

    // Booking notification for Student
    await NotificationModel.create({
      userId: user.id,
      type: "BOOKING_CONFIRMED",
      title: isManualApproval
        ? `Booking Request Received for ${library?.name || "Library"}`
        : `Booking Confirmed at ${library?.name || "Library"}`,
      message: isManualApproval
        ? `Your reservation at ${library?.name || "the library"} is pending owner confirmation. You will be notified once approved!`
        : `Your booking at ${library?.name || "the library"} is now active! Plan: ${booking.plan}. Your Digital ID pass is ready.`,
      link: "/student/bookings",
    });
    await emitNotificationCount(user.id);

    res.json({ success: true, bookingId: String(booking._id) });
  } catch (err) {
    console.error("[confirm]", err);
    res.status(500).json({ error: "Failed to confirm booking." });
  }
});

export default router;
