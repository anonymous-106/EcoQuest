import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { UpsertProfileBody, SubmitOnboardingBody } from "@workspace/api-zod";
import { calculateCarbonScore, getNewBadges } from "../lib/calculator";

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
  const annualTons = calculateCarbonScore({
    transportation: data.transportation,
    dailyTravelKm: data.dailyTravelKm,
    electricityBill: data.electricityBill,
    foodPreference: data.foodPreference,
    shoppingFrequency: data.shoppingFrequency,
    airTravelPerYear: data.airTravelPerYear,
  });

  const existing = await getOrCreateUser(clerkId);
  const newPoints = existing.greenPoints + 50;
  const newBadges = getNewBadges(existing.greenPoints, newPoints, existing.badges);

  const updated = await db
    .update(usersTable)
    .set({
      ...data,
      carbonScore: annualTons,
      onboardingComplete: true,
      badges: [...existing.badges, ...newBadges, ...(!existing.badges.includes("Eco Beginner") ? ["Eco Beginner"] : [])],
      greenPoints: newPoints,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  const user = updated[0];
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

export default router;
