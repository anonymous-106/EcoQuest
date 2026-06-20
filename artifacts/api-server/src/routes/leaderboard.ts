import { Router } from "express";
import { db, usersTable, userChallengesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /api/leaderboard
router.get("/", requireAuth, async (req, res) => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.greenPoints))
    .limit(limit);

  const completedCounts = await db
    .select({ userId: userChallengesTable.userId, count: sql<number>`count(*)` })
    .from(userChallengesTable)
    .where(eq(userChallengesTable.completed, true))
    .groupBy(userChallengesTable.userId);

  const countMap = new Map(completedCounts.map(c => [c.userId, Number(c.count)]));

  res.json(users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name,
    profileImage: u.profileImage ?? null,
    greenPoints: u.greenPoints,
    carbonScore: u.carbonScore,
    streak: u.streak,
    badges: u.badges ?? [],
    completedChallenges: countMap.get(u.id) ?? 0,
  })));
});

// GET /api/leaderboard/me
router.get("/me", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;

  const allUsers = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.greenPoints));

  const myIndex = allUsers.findIndex(u => u.clerkId === clerkId);
  if (myIndex === -1) {
    res.json({ rank: 0, totalUsers: allUsers.length, percentile: 0, greenPoints: 0, carbonScore: 0 });
    return;
  }

  const me = allUsers[myIndex];
  const rank = myIndex + 1;
  const percentile = Math.round((1 - rank / allUsers.length) * 100);

  res.json({
    rank,
    totalUsers: allUsers.length,
    percentile,
    greenPoints: me.greenPoints,
    carbonScore: me.carbonScore,
  });
});

export default router;
