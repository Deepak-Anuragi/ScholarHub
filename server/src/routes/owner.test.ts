import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../app";
import LibraryModel from "../models/Library";
import SlotModel from "../models/Slot";
import {
  clearDb,
  closeDb,
  createLibrary,
  createSlot,
  openDb,
  sessionFor,
} from "../test/helpers";

const app = createApp();

beforeAll(openDb);
beforeEach(clearDb);
afterAll(closeDb);

describe("PATCH /api/owner/library", () => {
  // The route used to spread req.body, so an owner could verify their own
  // listing — the badge students are told to trust — or hand it to someone else.
  it("ignores fields an owner may not set", async () => {
    const owner = sessionFor("owner");
    const someoneElse = sessionFor("owner");
    const library = await createLibrary(owner.id);

    const res = await request(app)
      .patch("/api/owner/library")
      .set("Cookie", owner.cookie)
      .send({
        name: "Renamed Reading Room",
        isVerified: true,
        ratingAvg: 5,
        reviewCount: 900,
        ownerId: someoneElse.id,
      });

    expect(res.status).toBe(200);

    const saved = await LibraryModel.findById(library._id);
    expect(saved?.name).toBe("Renamed Reading Room");
    expect(saved?.isVerified).toBe(false);
    expect(saved?.ratingAvg).toBe(0);
    expect(saved?.reviewCount).toBe(0);
    expect(String(saved?.ownerId)).toBe(owner.id);
  });

  it("does not touch another owner's library", async () => {
    const owner = sessionFor("owner");
    const other = sessionFor("owner");
    const theirs = await createLibrary(other.id, { name: "Their Library" });

    const res = await request(app)
      .patch("/api/owner/library")
      .set("Cookie", owner.cookie)
      .send({ name: "Mine now" });

    expect(res.status).toBe(404);
    expect((await LibraryModel.findById(theirs._id))?.name).toBe("Their Library");
  });
});

describe("owner library photos", () => {
  it("hands out a signature scoped to the owner's own library", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);

    const res = await request(app)
      .get("/api/owner/library/photos/signature")
      .set("Cookie", owner.cookie);

    expect(res.status).toBe(200);
    expect(res.body.folder).toBe(`scholarshub/libraries/${String(library._id)}`);
    expect(res.body.signature).toMatch(/^[0-9a-f]{40}$/);
  });

  // The route used to store any url string the client sent, and next.config
  // rendered images from any host.
  it("refuses a photo URL that did not come from our own account", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);

    const res = await request(app)
      .post("/api/owner/library/photos")
      .set("Cookie", owner.cookie)
      .send({ url: "https://example.com/seed/1/800/600.jpg" });

    expect(res.status).toBe(400);
    expect((await LibraryModel.findById(library._id))?.photos).toHaveLength(0);
  });

  it("stores a delivery URL from our own account", async () => {
    const owner = sessionFor("owner");
    const library = await createLibrary(owner.id);
    const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/scholarshub/libraries/a.jpg`;

    const res = await request(app)
      .post("/api/owner/library/photos")
      .set("Cookie", owner.cookie)
      .send({ url });

    expect(res.status).toBe(200);
    expect((await LibraryModel.findById(library._id))?.photos[0]?.url).toBe(url);
  });
});

describe("PATCH /api/owner/slots/:id", () => {
  // Whitelisted for the same reason: owning a slot today is not permission to
  // move it into someone else's library.
  it("cannot move a slot into another library", async () => {
    const owner = sessionFor("owner");
    const other = sessionFor("owner");
    const mine = await createLibrary(owner.id);
    const theirs = await createLibrary(other.id, { name: "Their Library" });
    const slot = await createSlot(mine._id);

    const res = await request(app)
      .patch(`/api/owner/slots/${String(slot._id)}`)
      .set("Cookie", owner.cookie)
      .send({ name: "Evening", libraryId: String(theirs._id) });

    expect(res.status).toBe(200);

    const saved = await SlotModel.findById(slot._id);
    expect(saved?.name).toBe("Evening");
    expect(String(saved?.libraryId)).toBe(String(mine._id));
  });
});
