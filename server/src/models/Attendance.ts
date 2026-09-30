import mongoose, { Schema, Document, Types } from "mongoose";

export type AttendanceStatus = "PRESENT" | "ABSENT";

export interface IAttendance extends Document {
  libraryId: Types.ObjectId;
  studentId: Types.ObjectId;
  bookingId: Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  markedBy: Types.ObjectId;
  markedAt: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    libraryId: { type: Schema.Types.ObjectId, ref: "Library", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    date:      { type: Date, required: true },
    status:    { type: String, enum: ["PRESENT", "ABSENT"], required: true },
    markedBy:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    markedAt:  { type: Date, required: true },
    note:      { type: String, trim: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ libraryId: 1, date: 1 });
AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index(
  { libraryId: 1, studentId: 1, bookingId: 1, date: 1 },
  { unique: true }
);

export default mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);
