import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import BookingModel from "@/models/Booking";
import LibraryModel from "@/models/Library";
import SlotModel from "@/models/Slot";
import { getSessionUser } from "@/lib/auth-session";

type CreateOrderBody = {
  libraryId: string;
  slotId?: string;
  plan: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  startDate: string; // ISO date string
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function calcEndDate(startDate: Date, plan: CreateOrderBody["plan"]): Date {
  switch (plan) {
    case "QUARTERLY":
      return addMonths(startDate, 3);
    case "ANNUAL":
      return addMonths(startDate, 12);
    case "MONTHLY":
    default:
      return addMonths(startDate, 1);
  }
}

function calcAmount(
  library: { monthlyFee: number; quarterlyFee?: number | null; annualFee?: number | null },
  plan: CreateOrderBody["plan"]
): number {
  switch (plan) {
    case "QUARTERLY":
      return library.quarterlyFee ?? library.monthlyFee * 3;
    case "ANNUAL":
      return library.annualFee ?? library.monthlyFee * 12;
    case "MONTHLY":
    default:
      return library.monthlyFee;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to book a seat." }, { status: 401 });
    }

    const body = (await req.json()) as CreateOrderBody;
    const { libraryId, slotId, plan, startDate } = body;

    if (!libraryId || !plan || !startDate) {
      return NextResponse.json(
        { error: "libraryId, plan, and startDate are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const library = await LibraryModel.findById(libraryId);
    if (!library) {
      return NextResponse.json({ error: "Library not found." }, { status: 404 });
    }

    if (slotId) {
      const slot = await SlotModel.findById(slotId);
      if (!slot || slot.availableSeats <= 0) {
        return NextResponse.json(
          { error: "Selected slot is full. Please choose another slot or join the waitlist." },
          { status: 409 }
        );
      }
    }

    const start = new Date(startDate);
    const end = calcEndDate(start, plan);
    const amount = calcAmount(library, plan);
    const platformFee = Math.round(amount * 0.02); // 2% platform convenience fee
    const total = amount + platformFee;

    // ── Razorpay order creation ──────────────────────────────────────────────
    // When Razorpay keys are present, create a real order.
    // During development without keys, we generate a mock order ID.
    let razorpayOrderId: string;
    let razorpayKeyId: string | undefined;

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const order = await razorpay.orders.create({
        amount: total * 100, // paise
        currency: "INR",
        receipt: `scholarsHub_${Date.now()}`,
      });

      razorpayOrderId = order.id;
      razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    } else {
      // Dev / mock — prefixed so UI can detect it
      razorpayOrderId = `mock_order_${Date.now()}`;
    }

    // Create a PENDING booking — confirmed after Razorpay webhook
    const booking = await BookingModel.create({
      studentId: user.id,
      libraryId,
      slotId: slotId ?? undefined,
      startDate: start,
      endDate: end,
      plan,
      amountPaid: total,
      paymentStatus: "PENDING",
      razorpayOrderId,
    });

    return NextResponse.json({
      bookingId: String(booking._id),
      razorpay_order_id: razorpayOrderId,
      razorpay_key_id: razorpayKeyId,
      amount: total,
      library_fee: amount,
      platform_fee: platformFee,
      currency: "INR",
      library_name: library.name,
      plan,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
