import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  studentId: Types.ObjectId;
  libraryId: Types.ObjectId;
  bookingId: Types.ObjectId;
  rating: number;
  comment?: string;
  isVerified: boolean;
  ownerReply?: string;
  ownerRepliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    studentId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    libraryId:      { type: Schema.Types.ObjectId, ref: "Library", required: true },
    bookingId:      { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    rating:         { type: Number, required: true, min: 1, max: 5 },
    comment:        { type: String, trim: true },
    isVerified:     { type: Boolean, default: true },
    ownerReply:     { type: String },
    ownerRepliedAt: { type: Date },
  },
  { timestamps: true }
);

ReviewSchema.index({ libraryId: 1, createdAt: -1 });
ReviewSchema.index({ studentId: 1 });
ReviewSchema.index({ bookingId: 1 }, { unique: true });

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);
