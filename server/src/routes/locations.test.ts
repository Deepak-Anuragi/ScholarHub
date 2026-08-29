import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../app";
import { clearDb, closeDb, createLibrary, openDb, sessionFor } from "../test/helpers";

const app = createApp();

beforeAll(openDb);
beforeEach(clearDb);
afterAll(closeDb);

async function seedPlaces() {
  const owner = sessionFor("owner");
  await createLibrary(owner.id, {
    name: "Indore Central",
    state: "Madhya Pradesh",
    district: "Indore",
    city: "Indore",
  });
  await createLibrary(owner.id, {
    name: "Vijay Nagar Study Room",
    state: "Madhya Pradesh",
    district: "Indore",
    city: "Vijay Nagar",
  });
  await createLibrary(owner.id, {
    name: "Bhopal Readers",
    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
  });
  await createLibrary(owner.id, {
    name: "Jaipur Hall",
    state: "Rajasthan",
    district: "Jaipur",
    city: "Jaipur",
  });
}

describe("GET /api/locations", () => {
  // The dropdowns used to be built from lib/mock-data, so they offered places
  // with nothing behind them: pick one and the listing comes back empty.
  it("offers nothing when the database holds no libraries", async () => {
    const res = await request(app).get("/api/locations");

    expect(res.status).toBe(200);
    expect(res.body.states).toEqual([]);
  });

  it("lists the states libraries are actually in, sorted and deduplicated", async () => {
    await seedPlaces();

    const res = await request(app).get("/api/locations");

    expect(res.status).toBe(200);
    expect(res.body.states).toEqual(["Madhya Pradesh", "Rajasthan"]);
  });

  it("narrows districts to the chosen state", async () => {
    await seedPlaces();

    const res = await request(app).get("/api/locations?state=Madhya%20Pradesh");

    expect(res.status).toBe(200);
    expect(res.body.districts).toEqual(["Bhopal", "Indore"]);
  });

  it("narrows cities to the chosen state and district", async () => {
    await seedPlaces();

    const res = await request(app).get(
      "/api/locations?state=Madhya%20Pradesh&district=Indore"
    );

    expect(res.status).toBe(200);
    expect(res.body.cities).toEqual(["Indore", "Vijay Nagar"]);
  });

  // The listing matches these fields case-insensitively, so a value taken
  // from one dropdown must still match when handed back to the next.
  it("matches a state or district whatever its casing", async () => {
    await seedPlaces();

    const districts = await request(app).get("/api/locations?state=madhya%20pradesh");
    const cities = await request(app).get(
      "/api/locations?state=MADHYA%20PRADESH&district=indore"
    );

    expect(districts.body.districts).toEqual(["Bhopal", "Indore"]);
    expect(cities.body.cities).toEqual(["Indore", "Vijay Nagar"]);
  });

  it("does not offer places whose only library is delisted", async () => {
    await seedPlaces();
    const owner = sessionFor("owner");
    await createLibrary(owner.id, {
      name: "Closed Hall",
      state: "Goa",
      district: "Panaji",
      city: "Panaji",
      isActive: false,
    });

    const res = await request(app).get("/api/locations");

    expect(res.body.states).not.toContain("Goa");
  });

  it("returns nothing for a state that has no libraries", async () => {
    await seedPlaces();

    const res = await request(app).get("/api/locations?state=Kerala");

    expect(res.status).toBe(200);
    expect(res.body.districts).toEqual([]);
  });
});
