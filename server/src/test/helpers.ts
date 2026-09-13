import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import { encodeSession, SESSION_COOKIE, type AuthUser, type UserRole } from "../lib/auth";
import LibraryModel from "../models/Library";
import SlotModel from "../models/Slot";
import UserModel from "../models/User";

export async function openDb(): Promise<void> {
  await connectDB();
}

export async function closeDb(): Promise<void> {
  await mongoose.disconnect();
  // lib/mongodb caches the connection on globalThis and hands it back without
  // checking readyState, so the cache has to go with the connection.
  global._mongooseCache = { conn: null, promise: null };
}

export async function clearDb(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export interface TestSession {
  id: string;
  cookie: string;
  user: AuthUser;
}

/** A genuinely signed session, the way lib/auth issues one at login. */
export function sessionFor(role: UserRole, id?: string): TestSession {
  const userId = id ?? String(new mongoose.Types.ObjectId());
  const user: AuthUser = {
    id: userId,
    name: `${role} tester`,
    email: `${role}@test.local`,
    role,
  };
  return { id: userId, cookie: `${SESSION_COOKIE}=${encodeSession(user)}`, user };
}

export function cookieFor(token: string): string {
  return `${SESSION_COOKIE}=${token}`;
}

/** The User row a session points at, for anything that populates studentId. */
export async function createUser(
  role: UserRole,
  overrides: Record<string, unknown> = {}
): Promise<TestSession & { doc: { _id: unknown } }> {
  const doc = await UserModel.create({
    name: `${role} tester`,
    email: `${role}-${new mongoose.Types.ObjectId()}@test.local`,
    phone: "9999999999",
    passwordHash: "not-a-real-hash",
    role: role === "owner" ? "LIBRARY_OWNER" : role.toUpperCase(),
    ...overrides,
  });
  return { ...sessionFor(role, String(doc._id)), doc };
}

export async function createLibrary(
  ownerId: string,
  overrides: Record<string, unknown> = {}
) {
  return LibraryModel.create({
    ownerId,
    name: "Test Reading Room",
    address: "1 Test Road",
    city: "Indore",
    district: "Indore",
    state: "Madhya Pradesh",
    pincode: "452001",
    totalSeats: 50,
    availableSeats: 50,
    monthlyFee: 1500,
    quarterlyFee: 4000,
    annualFee: 15000,
    ...overrides,
  });
}

export async function createSlot(libraryId: unknown, overrides: Record<string, unknown> = {}) {
  return SlotModel.create({
    libraryId,
    name: "Morning",
    startTime: "06:00",
    endTime: "12:00",
    totalSeats: 20,
    availableSeats: 20,
    ...overrides,
  });
}
