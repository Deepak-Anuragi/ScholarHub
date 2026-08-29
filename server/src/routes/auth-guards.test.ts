import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../app";
import { SESSION_COOKIE } from "../lib/auth";
import { clearDb, closeDb, cookieFor, openDb, sessionFor } from "../test/helpers";

const app = createApp();

beforeAll(openDb);
beforeEach(clearDb);
afterAll(closeDb);

describe("session cookies", () => {
  // The original encoder base64-encoded the user object with no signature, so
  // a visitor could mint {"role":"admin"} and take over the admin dashboard.
  it("rejects the unsigned base64 cookie the old encoder produced", async () => {
    const forged = Buffer.from(
      JSON.stringify({
        id: "64b8d9f0c1a2b3d4e5f60718",
        name: "Mallory",
        email: "mallory@test.local",
        role: "admin",
      })
    ).toString("base64");

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", cookieFor(forged));

    expect(res.status).toBe(403);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const token = jwt.sign(
      { id: "64b8d9f0c1a2b3d4e5f60718", name: "M", email: "m@test.local", role: "admin" },
      "not-the-servers-secret"
    );

    const res = await request(app).get("/api/admin/stats").set("Cookie", cookieFor(token));

    expect(res.status).toBe(403);
  });

  it("rejects a valid token whose payload has been tampered with", async () => {
    const { cookie } = sessionFor("student");
    const [header, payload, signature] = cookie.slice(SESSION_COOKIE.length + 1).split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString()) as Record<string, unknown>;
    decoded.role = "admin";
    const swapped = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", cookieFor(`${header}.${swapped}.${signature}`));

    expect(res.status).toBe(403);
  });

  it("accepts a session it signed itself", async () => {
    const admin = sessionFor("admin");
    const res = await request(app).get("/api/admin/stats").set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
  });
});

describe("role guards", () => {
  it("requireAdmin blocks a student", async () => {
    const student = sessionFor("student");
    const res = await request(app).get("/api/admin/stats").set("Cookie", student.cookie);

    expect(res.status).toBe(403);
  });

  it("requireOwner blocks a student", async () => {
    const student = sessionFor("student");
    const res = await request(app).get("/api/owner/library").set("Cookie", student.cookie);

    expect(res.status).toBe(403);
  });

  it("requireOwner lets an owner through", async () => {
    const owner = sessionFor("owner");
    const res = await request(app).get("/api/owner/library").set("Cookie", owner.cookie);

    expect(res.status).toBe(200);
  });

  it("requireAuth rejects an unauthenticated booking confirmation", async () => {
    const res = await request(app).post("/api/bookings/confirm").send({
      bookingId: "64b8d9f0c1a2b3d4e5f60718",
      razorpay_order_id: "order_whatever",
    });

    expect(res.status).toBe(401);
  });
});
