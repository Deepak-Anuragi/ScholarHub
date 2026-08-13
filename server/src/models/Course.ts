import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description?: string;
  subject: string;
  examTypes: string[];
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
  createdBy: Types.ObjectId;
  enrolledCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title:         { type: String, required: true, trim: true },
    description:   { type: String },
    subject:       { type: String, required: true },
    examTypes:     [{ type: String }],
    fileUrl:       { type: String, required: true },
    thumbnailUrl:  { type: String },
    fileSize:      { type: Number },
    createdBy:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CourseSchema.index({ examTypes: 1 });

export default mongoose.models.Course ||
  mongoose.model<ICourse>("Course", CourseSchema);
