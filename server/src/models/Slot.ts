import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISlot extends Document {
  libraryId: Types.ObjectId;
  name: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  availableSeats: number;
  monthlyFee?: number;
  quarterlyFee?: number;
  annualFee?: number;
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
    monthlyFee:     { type: Number },
    quarterlyFee:   { type: Number },
    annualFee:      { type: Number },
  },
  { timestamps: true }
);

SlotSchema.index({ libraryId: 1 });

(SlotSchema.pre as unknown as (event: string, fn: (this: ISlot) => Promise<void> | void) => void)(
  "validate",
  async function checkSeatInvariant() {
    const total = Number(this.totalSeats);
    const avail = Number(this.availableSeats);
    if (Number.isFinite(total) && Number.isFinite(avail) && avail > total) {
      const msg = `availableSeats (${avail}) cannot exceed totalSeats (${total})`;
      const ValidationError = mongoose.Error.ValidationError;
      const ValidatorError = mongoose.Error.ValidatorError;
      const err = new ValidationError();
      err.errors.availableSeats = new ValidatorError({
        message: msg,
        path: "availableSeats",
        value: avail,
        reason: undefined as unknown as Error,
      });
      throw err;
    }
  }
);

export default mongoose.models.Slot ||
  mongoose.model<ISlot>("Slot", SlotSchema);
