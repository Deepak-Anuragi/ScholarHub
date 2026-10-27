import mongoose, { Schema, Document, Types } from "mongoose";

export type DiscountType = "percent" | "flat";

export interface ICoupon extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code:          { type: String, required: true, trim: true, uppercase: true },
    discountType:  { type: String, enum: ["percent", "flat"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxUses:       { type: Number, required: true, min: 1 },
    usedCount:     { type: Number, default: 0 },
    expiresAt:     { type: Date, required: true },
    isActive:      { type: Boolean, default: true },
    createdBy:     { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, expiresAt: 1 });

export default mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);