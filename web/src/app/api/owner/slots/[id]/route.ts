import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import SlotModel from "@/models/Slot";
import WaitlistModel from "@/models/Waitlist";
import NotificationModel from "@/models/Notification";
import { getSessionUser } from "@/lib/auth-session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Verify ownership
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) return NextResponse.json({ error: "Library not found." }, { status: 404 });

    const prevSlot = await SlotModel.findOne({
      _id: params.id,
      libraryId: library._id,
    });
    if (!prevSlot) return NextResponse.json({ error: "Slot not found." }, { status: 404 });

    const body = (await req.json()) as Partial<{
      name: string;
      startTime: string;
      endTime: string;
      totalSeats: number;
      availableSeats: number;
    }>;

    const updatedSlot = await SlotModel.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );

    // Waitlist trigger — seats became available
    const prevAvailable = prevSlot.availableSeats;
    const newAvailable = updatedSlot?.availableSeats ?? 0;
    const freed = newAvailable - prevAvailable;

    if (freed > 0) {
      const waitlisted = await WaitlistModel.find({ slotId: params.id })
        .sort({ position: 1 })
        .limit(freed)
        .lean();

      for (const entry of waitlisted) {
        await NotificationModel.create({
          userId: entry.studentId,
          type: "WAITLIST_AVAILABLE",
          title: "Seat Available!",
          message: `A seat opened up at ${library.name}. Book now before it fills up.`,
          link: `/library/${library._id}`,
          isRead: false,
        });
      }
    }

    return NextResponse.json({ slot: updatedSlot });
  } catch (err) {
    console.error("[owner/slots PATCH]", err);
    return NextResponse.json({ error: "Failed to update slot." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) return NextResponse.json({ error: "Library not found." }, { status: 404 });

    await SlotModel.findOneAndDelete({
      _id: params.id,
      libraryId: library._id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[owner/slots DELETE]", err);
    return NextResponse.json({ error: "Failed to delete slot." }, { status: 500 });
  }
}
