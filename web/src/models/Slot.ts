import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISlot extends Document {
  libraryId: Types.ObjectId;
  name: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  availableSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema<ISlot>(
  {
    libraryId:      { type: Schema.Types.ObjectId, ref: "Library", required: true },
    name:           { type: String, required: true },
    startTime:      { type: String, required: true },
    endTime:        { type: String, required: true },
    totalSeats:     { type: Number, required: true },
    availableSeats: { type: Number, required: true },
  },
  { timestamps: true }
);

SlotSchema.index({ libraryId: 1 });

export default mongoose.models.Slot ||
  mongoose.model<ISlot>("Slot", SlotSchema);
