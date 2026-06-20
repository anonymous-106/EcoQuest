import { Router } from "express";
import { db, recommendationsTable, recommendationCompletionsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getOrCreateUser(clerkId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];
  const inserted = await db
    .insert(usersTable)
    .values({ clerkId, name: "EcoQuest User", email: "", greenPoints: 0, streak: 0, badges: [], onboardingComplete: false, carbonScore: 0 })
    .returning();
  return inserted[0];
}

// GET /api/recommendations — returns recs with completedUntil per user
router.get("/", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const user = await getOrCreateUser(clerkId);

  const recs = await db.select().from(recommendationsTable);
  const now = new Date();

  // Get active completions (not yet expired) for this user
  const completions = await db
    .select()
    .from(recommendationCompletionsTable)
    .where(eq(recommendationCompletionsTable.userId, user.id));

  const completionMap = new Map<number, Date>();
  for (const c of completions) {
    if (c.resetsAt > now) {
      completionMap.set(c.recommendationId, c.resetsAt);
    }
  }

  res.json(recs.map(r => ({
    ...r,
    completedUntil: completionMap.has(r.id) ? completionMap.get(r.id)!.toISOString() : null,
  })));
});

// POST /api/recommendations/:id/complete — mark as done for 24h
router.post("/:id/complete", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const recId = parseInt(rawId);

  if (isNaN(recId)) {
    res.status(400).json({ error: "Invalid recommendation id" });
    return;
  }

  const user = await getOrCreateUser(clerkId);
  const now = new Date();
  const resetsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

  // Check if already has an active completion
  const existing = await db
    .select()
    .from(recommendationCompletionsTable)
    .where(
      and(
        eq(recommendationCompletionsTable.userId, user.id),
        eq(recommendationCompletionsTable.recommendationId, recId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].resetsAt > now) {
      // Already done and not yet reset — return current state
      res.json({ recommendationId: recId, completedUntil: existing[0].resetsAt.toISOString() });
      return;
    }
    // Expired — update it
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
