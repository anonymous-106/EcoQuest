import { Router } from "express";
import type { Request } from "express";
import { db, recommendationsTable, recommendationCompletionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getOrCreateUser } from "../lib/user";

const router = Router();

// GET /api/recommendations — returns recs with completedUntil per user
router.get("/", requireAuth, async (req: Request, res) => {
  const { clerkId } = req as AuthRequest;
  const user = await getOrCreateUser(clerkId);

  const [recs, completions] = await Promise.all([
    db.select().from(recommendationsTable),
    db
      .select()
      .from(recommendationCompletionsTable)
      .where(eq(recommendationCompletionsTable.userId, user.id)),
  ]);

  const now = new Date();
  const completionMap = new Map<number, Date>();
  for (const c of completions) {
    if (c.resetsAt > now) {
      completionMap.set(c.recommendationId, c.resetsAt);
    }
  }

  res.json(
    recs.map((r) => ({
      ...r,
      completedUntil: completionMap.has(r.id)
        ? completionMap.get(r.id)!.toISOString()
        : null,
    })),
  );
});

// POST /api/recommendations/:id/complete — mark as done for 24h
router.post("/:id/complete", requireAuth, async (req: Request, res) => {
  const { clerkId } = req as AuthRequest;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const recId = parseInt(rawId, 10);

  if (isNaN(recId)) {
    res.status(400).json({ error: "Invalid recommendation id" });
    return;
  }

  const user = await getOrCreateUser(clerkId);
  const now = new Date();
  const resetsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const existing = await db
    .select()
    .from(recommendationCompletionsTable)
    .where(
      and(
        eq(recommendationCompletionsTable.userId, user.id),
        eq(recommendationCompletionsTable.recommendationId, recId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].resetsAt > now) {
      res.json({ recommendationId: recId, completedUntil: existing[0].resetsAt.toISOString() });
      return;
    }
    await db
      .update(recommendationCompletionsTable)
      .set({ completedAt: now, resetsAt })
      .where(eq(recommendationCompletionsTable.id, existing[0].id));
  } else {
    await db.insert(recommendationCompletionsTable).values({
      userId: user.id,
      recommendationId: recId,
      completedAt: now,
      resetsAt,
    });
  }

  res.json({ recommendationId: recId, completedUntil: resetsAt.toISOString() });
});

export default router;
