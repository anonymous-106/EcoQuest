import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { UpsertProfileBody, SubmitOnboardingBody } from "@workspace/api-zod";

const router = Router();

async function getOrCreateUser(clerkId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];

  const inserted = await db
    .insert(usersTable)
    .values({
      clerkId,
      name: "EcoQuest User",
      email: "",
      greenPoints: 0,
      streak: 0,
      badges: [],
      onboardingComplete: false,
      carbonScore: 0,
    })
    .returning();
  return inserted[0];
}

// GET /api/users/me — auto-provisions user on first login
router.get("/me", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const user = await getOrCreateUser(clerkId);
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

// PUT /api/users/me
router.put("/me", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const parsed = UpsertProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateUser(clerkId);

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

  const existing = await getOrCreateUser(clerkId);

  const updated = await db
    .update(usersTable)
    .set({
      ...data,
      carbonScore: annualTons,
      onboardingComplete: true,
      badges: existing.badges.includes("Eco Beginner") ? existing.badges : [...existing.badges, "Eco Beginner"],
      greenPoints: existing.greenPoints + 50,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  const user = updated[0];
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

export default router;
