import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { UpsertProfileBody, SubmitOnboardingBody } from "@workspace/api-zod";

const router = Router();

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!users.length) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const user = users[0];
  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
  });
});

// PUT /api/users/me
router.put("/me", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const parsed = UpsertProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);

  if (existing.length === 0) {
    const inserted = await db
      .insert(usersTable)
      .values({
        clerkId,
        name: parsed.data.name ?? "EcoQuest User",
        email: "",
        ...parsed.data,
      })
      .returning();
    const user = inserted[0];
    res.json({ ...user, createdAt: user.createdAt.toISOString() });
    return;
  }

  const updated = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();
  const user = updated[0];
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

// POST /api/users/me/onboarding
router.post("/me/onboarding", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const parsed = SubmitOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  // Calculate initial carbon score
  const transportEmissions: Record<string, number> = {
    walking: 0,
    bicycle: 0.02,
    car: 0.21,
    motorcycle: 0.11,
    "public transport": 0.05,
  };
  const transportKgPerDay = (transportEmissions[data.transportation] ?? 0.1) * data.dailyTravelKm;
  const electricityKgPerDay = (data.electricityBill * 0.12) / 30;
  const foodEmissions: Record<string, number> = { vegan: 2.5, vegetarian: 3.8, "non-vegetarian": 7.2 };
  const foodKgPerDay = (foodEmissions[data.foodPreference] ?? 5) / 365;
  const shoppingEmissions: Record<string, number> = { never: 0.1, rarely: 0.3, monthly: 0.8, weekly: 2.1, daily: 4.5 };
  const shoppingKgPerDay = (shoppingEmissions[data.shoppingFrequency] ?? 0.5) / 30;
  const airTravelKgPerDay = (data.airTravelPerYear * 255) / 365;
  const totalKgPerDay = transportKgPerDay + electricityKgPerDay + foodKgPerDay + shoppingKgPerDay + airTravelKgPerDay;
  const annualTons = (totalKgPerDay * 365) / 1000;

  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);

  let user;
  if (existing.length === 0) {
    const inserted = await db
      .insert(usersTable)
      .values({
        clerkId,
        name: "EcoQuest User",
        email: "",
        ...data,
        carbonScore: annualTons,
        onboardingComplete: true,
        badges: ["Eco Beginner"],
        greenPoints: 50,
      })
      .returning();
    user = inserted[0];
  } else {
    const updated = await db
      .update(usersTable)
      .set({
        ...data,
        carbonScore: annualTons,
        onboardingComplete: true,
        badges: existing[0].badges.includes("Eco Beginner") ? existing[0].badges : [...existing[0].badges, "Eco Beginner"],
        greenPoints: existing[0].greenPoints + 50,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    user = updated[0];
  }

  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

export default router;
