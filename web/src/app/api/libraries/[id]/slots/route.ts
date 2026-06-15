import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import SlotModel from "@/models/Slot";
import { librarySlots } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const slots = await SlotModel.find({ libraryId: params.id }).lean();
    return NextResponse.json({ slots });
  } catch (err) {
    // Fall back to mock data if MongoDB isn't connected yet
    const isMissingUri =
      err instanceof Error && err.message.includes("MONGODB_URI");
    const isMongoErr = err instanceof mongoose.Error || isMissingUri;

    if (isMongoErr || !process.env.MONGODB_URI) {
      const mockSlots = librarySlots[params.id] ?? [];
      return NextResponse.json({ slots: mockSlots });
    }

    console.error("[slots GET]", err);
    return NextResponse.json({ error: "Failed to fetch slots." }, { status: 500 });
  }
}
