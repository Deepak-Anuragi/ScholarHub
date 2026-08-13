import mongoose, { Schema, Document, Types } from "mongoose";

export type PayoutStatus = "PENDING" | "PAID";

export interface IPayoutLedger extends Document {
  bookingId: Types.ObjectId;
  libraryId: Types.ObjectId;
  ownerId: Types.ObjectId;
  totalAmount: number;
  commissionRate: number;
  platformShare: number;
  ownerShare: number;
  payoutStatus: PayoutStatus;
  payoutDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutLedgerSchema = new Schema<IPayoutLedger>(
  {
    bookingId:      { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    libraryId:      { type: Schema.Types.ObjectId, ref: "Library", required: true },
    ownerId:        { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalAmount:    { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    platformShare:  { type: Number, required: true },
    ownerShare:     { type: Number, required: true },
    payoutStatus:   { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },
    payoutDate:     { type: Date },
  },
  { timestamps: true }
);

PayoutLedgerSchema.index({ ownerId: 1, payoutStatus: 1 });
PayoutLedgerSchema.index({ libraryId: 1 });

export default mongoose.models.PayoutLedger ||
  mongoose.model<IPayoutLedger>("PayoutLedger", PayoutLedgerSchema);
