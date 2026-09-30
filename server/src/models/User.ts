import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "ADMIN" | "LIBRARY_OWNER" | "STUDENT";
  city?: string;
  state?: string;
  avatarUrl?: string;
  examType?: string;
  targetYear?: number;
  fcmToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // Wishlist (Req 9)
  wishlist: Types.ObjectId[];
  // Referral (Req 11)
  referredBy?: Types.ObjectId;
  referralCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:                 { type: String, required: true, trim: true },
    email:                { type: String, required: true, lowercase: true, trim: true },
    phone:                { type: String, required: true, trim: true },
    passwordHash:         { type: String, required: true },
    role:                 { type: String, enum: ["ADMIN", "LIBRARY_OWNER", "STUDENT"], required: true },
    city:                 { type: String },
    state:                { type: String },
    avatarUrl:            { type: String },
    examType:             { type: String },
    targetYear:           { type: Number },
    fcmToken:             { type: String },
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date },
    // Wishlist (Req 9)
    wishlist:             { type: [{ type: Schema.Types.ObjectId, ref: "Library" }], default: [] },
    // Referral (Req 11)
    referredBy:           { type: Schema.Types.ObjectId, ref: "User" },
    referralCredits:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, city: 1 });
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ wishlist: 1 }, { sparse: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
