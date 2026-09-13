import { Router, Request, Response } from "express";

import connectDB from "../lib/mongodb";
import { isDatabaseUnavailable } from "../lib/db-errors";
import { getCities, getDistricts, getStates } from "../lib/locations";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { state, district } = req.query as { state?: string; district?: string };

  try {
    await connectDB();

    if (state && district) {
      res.json({ cities: await getCities(state, district) });
      return;
    }
    if (state) {
      res.json({ districts: await getDistricts(state) });
      return;
    }
    res.json({ states: await getStates() });
  } catch (err) {
    // A dead database must not read as "there are no places", which is what
    // the old seed-derived list quietly papered over.
    if (isDatabaseUnavailable(err)) {
      console.error("[locations] database unavailable", err);
      res.status(503).json({ error: "Service temporarily unavailable." });
      return;
    }
    console.error("[locations]", err);
    res.status(500).json({ error: "Failed to fetch locations." });
  }
});

export default router;
