import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWaitlist extends Document {
  studentId: Types.ObjectId;
  libraryId: Types.ObjectId;
  slotId?: Types.ObjectId;
  position: number;
  notified: boolean;
  heldUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    libraryId: { type: Schema.Types.ObjectId, ref: "Library", required: true },
    slotId:    { type: Schema.Types.ObjectId, ref: "Slot" },
    position:  { type: Number, required: true },
    notified:  { type: Boolean, default: false },
    heldUntil: { type: Date },
  },
  { timestamps: true }
);

WaitlistSchema.index({ libraryId: 1, slotId: 1, position: 1 });
WaitlistSchema.index({ studentId: 1 });

export default mongoose.models.Waitlist ||
  mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);
