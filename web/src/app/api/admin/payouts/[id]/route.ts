import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import PayoutLedgerModel from "@/models/PayoutLedger";
import { getSessionUser } from "@/lib/auth-session";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const payout = await PayoutLedgerModel.findByIdAndUpdate(
      id,
      { payoutStatus: "PAID", payoutDate: new Date() },
      { new: true }
    );

    if (!payout)
      return NextResponse.json({ error: "Payout not found." }, { status: 404 });

    return NextResponse.json({ payout: { ...payout.toObject(), _id: String(payout._id) } });
  } catch (err) {
    console.error("[admin/payouts PATCH]", err);
    return NextResponse.json({ error: "Failed to mark payout." }, { status: 500 });
  }
}
