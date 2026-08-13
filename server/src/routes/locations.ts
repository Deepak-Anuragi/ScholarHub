import { Router, Request, Response } from "express";
import { getCities, getDistricts, getStates } from "../lib/locations";

const router = Router();

router.get("/", (req: Request, res: Response): void => {
  const { state, district } = req.query as { state?: string; district?: string };
  if (state && district) { res.json({ cities: getCities(state, district) }); return; }
  if (state) { res.json({ districts: getDistricts(state) }); return; }
  res.json({ states: getStates() });
});

export default router;
