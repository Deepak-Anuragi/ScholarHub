import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILibraryPhoto {
  url: string;
  isCover: boolean;
  order: number;
}

export interface ILibrary extends Document {
  ownerId: Types.ObjectId;
  name: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  totalSeats: number;
  availableSeats: number;
  monthlyFee: number;
  quarterlyFee?: number;
  annualFee?: number;
  facilities: string[];
  studentTypes: string[];
  photos: ILibraryPhoto[];
  isVerified: boolean;
  isActive: boolean;
  ratingAvg: number;
  reviewCount: number;
  whatsapp?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryPhotoSchema = new Schema<ILibraryPhoto>(
  {
    url:     { type: String, required: true },
    isCover: { type: Boolean, default: false },
    order:   { type: Number, default: 0 },
  },
  { _id: false }
);

const LibrarySchema = new Schema<ILibrary>(
  {
    ownerId:        { type: Schema.Types.ObjectId, ref: "User", required: true },
    name:           { type: String, required: true, trim: true },
    description:    { type: String },
    address:        { type: String, required: true },
    city:           { type: String, required: true },
    district:       { type: String, required: true },
    state:          { type: String, required: true },
    pincode:        { type: String, required: true },
    lat:            { type: Number },
    lng:            { type: Number },
    totalSeats:     { type: Number, required: true, default: 0 },
    availableSeats: { type: Number, required: true, default: 0 },
    monthlyFee:     { type: Number, required: true },
    quarterlyFee:   { type: Number },
    annualFee:      { type: Number },
    facilities:     [{ type: String }],
    studentTypes:   [{ type: String }],
    photos:         [LibraryPhotoSchema],
    isVerified:     { type: Boolean, default: false },
    isActive:       { type: Boolean, default: true },
    ratingAvg:      { type: Number, default: 0 },
    reviewCount:    { type: Number, default: 0 },
    whatsapp:       { type: String },
    contactEmail:   { type: String },
    contactPhone:   { type: String },
  },
  { timestamps: true }
);

// Indexes for common query patterns
LibrarySchema.index({ city: 1, state: 1 });
LibrarySchema.index({ isActive: 1, isVerified: 1 });
LibrarySchema.index({ lat: 1, lng: 1 });
LibrarySchema.index({ monthlyFee: 1 });
LibrarySchema.index({ ratingAvg: -1 });
LibrarySchema.index({ availableSeats: -1 });
// Full-text search index for name, description, city, address
LibrarySchema.index({ name: "text", description: "text", city: "text", address: "text" });

export default mongoose.models.Library ||
  mongoose.model<ILibrary>("Library", LibrarySchema);
