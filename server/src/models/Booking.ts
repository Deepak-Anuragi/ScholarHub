import mongoose, { Schema, Document, Types } from "mongoose";

export type BookingPlan = "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type BookingStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface IBooking extends Document {
  studentId: Types.ObjectId;
  libraryId: Types.ObjectId;
  slotId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  plan: BookingPlan;
  /** The library's own fee for the plan. Paid out to the owner in full. */
  libraryFee?: number;
  /** Platform commission charged on top of it. */
  platformFee?: number;
  /** libraryFee + platformFee — what the student is charged. */
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  razorpayOrderId?: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    studentId:       { type: Schema.Types.ObjectId, ref: "User", required: true },
    libraryId:       { type: Schema.Types.ObjectId, ref: "Library", required: true },
    slotId:          { type: Schema.Types.ObjectId, ref: "Slot" },
    startDate:       { type: Date, required: true },
    endDate:         { type: Date, required: true },
    plan:            { type: String, enum: ["MONTHLY", "QUARTERLY", "ANNUAL"], required: true },
    libraryFee:      { type: Number },
    platformFee:     { type: Number },
    amountPaid:      { type: Number, required: true },
    paymentStatus:   { type: String, enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"], default: "PENDING" },
    paymentId:       { type: String },
    razorpayOrderId: { type: String },
    status:          { type: String, enum: ["ACTIVE", "EXPIRED", "CANCELLED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

BookingSchema.index({ studentId: 1, status: 1 });
BookingSchema.index({ libraryId: 1, status: 1 });
BookingSchema.index({ paymentId: 1 });
BookingSchema.index({ razorpayOrderId: 1 });

export default mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
