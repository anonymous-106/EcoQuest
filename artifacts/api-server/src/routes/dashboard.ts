import { Router } from "express";
import { db, usersTable, activitiesTable, userChallengesTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;

  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!users.length) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = users[0];
  const userId = user.id;

  // Recent activities (last 10)
  const recentActivities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.userId, userId))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(10);

  // Completed challenges count
  const completedChallenges = await db
    .select()
    .from(userChallengesTable)
    .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.completed, true)));

  // Build weekly emissions (last 7 days)
  const today = new Date();
  const weeklyEmissions = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayActivities = recentActivities.filter(a => a.date === dateStr);
    const kg = dayActivities.reduce((sum, a) => sum + a.emissionKg, 0);
    weeklyEmissions.push({ day: days[d.getDay()], kg: Math.round(kg * 100) / 100 });
  }

  // Monthly emissions (last 6 months from activities)
  const allActivities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.userId, userId));

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }

  for (const activity of allActivities) {
    const month = activity.date.substring(0, 7);
    if (monthlyMap.has(month)) {
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + activity.emissionKg);
    }
  }

  const monthlyEmissions = Array.from(monthlyMap.entries()).map(([key, kg]) => {
    const [, m] = key.split("-");
    return { month: monthNames[parseInt(m) - 1], kg: Math.round(kg * 100) / 100 };
  });

  // Category breakdown
  const categoryMap = new Map<string, number>();
  for (const activity of allActivities) {
    categoryMap.set(activity.category, (categoryMap.get(activity.category) ?? 0) + activity.emissionKg);
  }
  const totalEmissions = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0) || 1;
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, kg]) => ({
    category,
    kg: Math.round(kg * 100) / 100,
    percentage: Math.round((kg / totalEmissions) * 100),
  }));

  res.json({
    carbonScore: user.carbonScore,
    greenPoints: user.greenPoints,
    streak: user.streak,
    badges: user.badges ?? [],
    weeklyEmissions,
    monthlyEmissions,
    categoryBreakdown,
    recentActivities: recentActivities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    completedChallenges: completedChallenges.length,
  });
});

export default router;
