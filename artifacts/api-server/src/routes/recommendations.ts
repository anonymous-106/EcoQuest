import { Router } from "express";
import { db, recommendationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// GET /api/recommendations
router.get("/", requireAuth, async (_req, res) => {
  const recs = await db.select().from(recommendationsTable);
  res.json(recs);
});

export default router;
