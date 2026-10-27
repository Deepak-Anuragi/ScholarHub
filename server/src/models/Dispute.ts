import mongoose, { Schema, Document, Types } from "mongoose";

export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

export interface IDispute extends Document {
  studentId: Types.ObjectId;
  libraryId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  subject: string;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema<IDispute>(
  {
    studentId:    { type: Schema.Types.ObjectId, ref: "User",    required: true },
    libraryId:    { type: Schema.Types.ObjectId, ref: "Library", required: true },
    bookingId:    { type: Schema.Types.ObjectId, ref: "Booking" },
    subject:      { type: String, required: true, trim: true },
    description:  { type: String, required: true, trim: true },
    status:       { type: String, enum: ["open","under_review","resolved","rejected"], default: "open" },
    resolution:   { type: String },
    resolvedBy:   { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt:   { type: Date },
    refundAmount: { type: Number },
  },
  { timestamps: true }
);

DisputeSchema.index({ studentId: 1, createdAt: -1 });
DisputeSchema.index({ status: 1 });

export default mongoose.models.Dispute || mongoose.model<IDispute>("Dispute", DisputeSchema);