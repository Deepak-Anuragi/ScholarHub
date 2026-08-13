import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentCourse extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentCourseSchema = new Schema<IStudentCourse>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId:  { type: Schema.Types.ObjectId, ref: "Course", required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

StudentCourseSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export default mongoose.models.StudentCourse ||
  mongoose.model<IStudentCourse>("StudentCourse", StudentCourseSchema);
