import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import BookingModel from "@/models/Booking";
import DigitalIDModel from "@/models/DigitalID";
import PayoutLedgerModel from "@/models/PayoutLedger";
import SlotModel from "@/models/Slot";
import LibraryModel from "@/models/Library";

type ConfirmBody = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingId: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConfirmBody;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } =
      body;

    // ── Signature verification ──────────────────────────────────────────────
    const isMockOrder = razorpay_order_id.startsWith("mock_order_");
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!isMockOrder && keySecret) {
      const expectedSig = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSig !== razorpay_signature) {
        return NextResponse.json(
          { error: "Invalid payment signature." },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Update booking to SUCCESS
    const booking = await BookingModel.findOneAndUpdate(
      { _id: bookingId, razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: "SUCCESS",
        status: "ACTIVE",
        paymentId: razorpay_payment_id,
      },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Decrement slot's available seats
    if (booking.slotId) {
      await SlotModel.findByIdAndUpdate(booking.slotId, {
        $inc: { availableSeats: -1 },
      });
    }

    // Decrement library's available seats
    await LibraryModel.findByIdAndUpdate(booking.libraryId, {
      $inc: { availableSeats: -1 },
    });

    // Create Digital ID
    const qrData = JSON.stringify({
      bookingId: String(booking._id),
      studentId: String(booking.studentId),
      libraryId: String(booking.libraryId),
      plan: booking.plan,
      validUntil: booking.endDate.toISOString(),
    });

    await DigitalIDModel.create({
      bookingId: booking._id,
      studentId: booking.studentId,
      libraryId: booking.libraryId,
      qrData,
      issuedAt: new Date(),
      validUntil: booking.endDate,
    });

    // Create Payout Ledger entry (10% platform commission)
    const commissionRate = 0.10;
    const platformShare = Math.round(booking.amountPaid * commissionRate);
    const ownerShare = booking.amountPaid - platformShare;

    const library = await LibraryModel.findById(booking.libraryId);
    if (library) {
      await PayoutLedgerModel.create({
        bookingId: booking._id,
        libraryId: booking.libraryId,
        ownerId: library.ownerId,
        totalAmount: booking.amountPaid,
        commissionRate,
        platformShare,
        ownerShare,
        payoutStatus: "PENDING",
      });
    }

    return NextResponse.json({ success: true, bookingId: String(booking._id) });
  } catch (err) {
    console.error("[confirm]", err);
    return NextResponse.json({ error: "Failed to confirm booking." }, { status: 500 });
  }
}
