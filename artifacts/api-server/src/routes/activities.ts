import { Router } from "express";
import { db, activitiesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { LogActivityBody, CalculateFootprintBody, GetActivitiesQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /api/activities
router.get("/", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const parsed = GetActivitiesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!users.length) {
    res.json([]);
    return;
  }

  const activities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.userId, users[0].id))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

// POST /api/activities
router.post("/", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const parsed = LogActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!users.length) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const inserted = await db
    .insert(activitiesTable)
    .values({ ...parsed.data, userId: users[0].id })
    .returning();

  const activity = inserted[0];
  res.status(201).json({ ...activity, createdAt: activity.createdAt.toISOString() });
});

// POST /api/activities/calculator
router.post("/calculator", async (req, res) => {
  const parsed = CalculateFootprintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const transportEmissions: Record<string, number> = {
    walking: 0, bicycle: 0.02, car: 0.21, motorcycle: 0.11, "public transport": 0.05,
  };
  const transportKgPerDay = (transportEmissions[data.transportation] ?? 0.1) * data.dailyTravelKm;
  const electricityKgPerDay = (data.electricityBill * 0.12) / 30;
  const foodEmissions: Record<string, number> = { vegan: 2.5, vegetarian: 3.8, "non-vegetarian": 7.2 };
  const foodKgPerDay = (foodEmissions[data.foodPreference] ?? 5) / 365;
  const shoppingEmissions: Record<string, number> = { never: 0.1, rarely: 0.3, monthly: 0.8, weekly: 2.1, daily: 4.5 };
  const shoppingKgPerDay = (shoppingEmissions[data.shoppingFrequency] ?? 0.5) / 30;
  const airTravelKgPerDay = (data.airTravelPerYear * 255) / 365;
  const lifestyleKgPerDay = 0.5;

  const totalKgPerDay = transportKgPerDay + electricityKgPerDay + foodKgPerDay + shoppingKgPerDay + airTravelKgPerDay + lifestyleKgPerDay;
  const monthlyKg = totalKgPerDay * 30;
  const annualKg = totalKgPerDay * 365;
  const annualTons = annualKg / 1000;

  const impactLevel = annualTons < 4 ? "low" : annualTons < 10 ? "moderate" : "high";

  res.json({
    dailyKg: Math.round(totalKgPerDay * 100) / 100,
    monthlyKg: Math.round(monthlyKg * 100) / 100,
    annualKg: Math.round(annualKg * 100) / 100,
    impactLevel,
    breakdown: {
      transportation: Math.round(transportKgPerDay * 365 * 100) / 100,
      electricity: Math.round(electricityKgPerDay * 365 * 100) / 100,
      food: Math.round(foodKgPerDay * 365 * 100) / 100,
      shopping: Math.round(shoppingKgPerDay * 365 * 100) / 100,
      lifestyle: Math.round(lifestyleKgPerDay * 365 * 100) / 100,
    },
    comparisons: {
      treesNeeded: Math.round(annualTons / 0.022),
      carKm: Math.round(annualKg / 0.21),
      householdDays: Math.round(annualKg / (8.9 / 365)),
    },
  });
});

export default router;
