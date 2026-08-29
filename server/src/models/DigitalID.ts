import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDigitalID extends Document {
  bookingId: Types.ObjectId;
  studentId: Types.ObjectId;
  libraryId: Types.ObjectId;
  qrCodeUrl?: string;
  qrData: string;
  issuedAt: Date;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DigitalIDSchema = new Schema<IDigitalID>(
  {
    bookingId:  { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    studentId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    libraryId:  { type: Schema.Types.ObjectId, ref: "Library", required: true },
    qrCodeUrl:  { type: String },
    qrData:     { type: String, required: true },
    issuedAt:   { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
  },
  { timestamps: true }
);

DigitalIDSchema.index({ bookingId: 1 }, { unique: true });
DigitalIDSchema.index({ studentId: 1 });

export default mongoose.models.DigitalID ||
  mongoose.model<IDigitalID>("DigitalID", DigitalIDSchema);
