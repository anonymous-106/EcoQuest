import { Router } from "express";
import type { Request } from "express";
import { db, activitiesTable, userChallengesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getOrCreateUser } from "../lib/user";
import {
  buildWeeklyEmissions,
  buildMonthlyEmissions,
  buildCategoryBreakdown,
} from "../lib/date-utils";

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", requireAuth, async (req: Request, res) => {
  const { clerkId } = req as AuthRequest;
  const user = await getOrCreateUser(clerkId);
  const userId = user.id;

  const [allActivities, completedChallenges] = await Promise.all([
    db.select().from(activitiesTable).where(eq(activitiesTable.userId, userId)),
    db
      .select()
      .from(userChallengesTable)
      .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.completed, true))),
  ]);

  const recentActivities = [...allActivities]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  res.json({
    carbonScore: user.carbonScore ?? 0,
    greenPoints: user.greenPoints ?? 0,
    streak: user.streak ?? 0,
    badges: user.badges ?? [],
    weeklyEmissions: buildWeeklyEmissions(allActivities),
    monthlyEmissions: buildMonthlyEmissions(allActivities),
    categoryBreakdown: buildCategoryBreakdown(allActivities),
    recentActivities: recentActivities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    completedChallenges: completedChallenges.length,
  });
});

export default router;
