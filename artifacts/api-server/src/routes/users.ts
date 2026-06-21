import { Router } from "express";
import type { Request } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { UpsertProfileBody, SubmitOnboardingBody } from "@workspace/api-zod";
import { calculateCarbonScore, getNewBadges } from "../lib/calculator";
import { getOrCreateUser } from "../lib/user";

const router = Router();

// GET /api/users/me — auto-provisions user on first login
router.get("/me", requireAuth, async (req: Request, res) => {
  const { clerkId } = req as AuthRequest;
  const user = await getOrCreateUser(clerkId);
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

// PUT /api/users/me
router.put("/me", requireAuth, async (req: Request, res) => {
  const { clerkId } = req as AuthRequest;
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
router.post("/me/onboarding", requireAuth, async (req: Request, res) => {
  const { clerkId } = req as AuthRequest;
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

  const eco_beginner = existing.badges.includes("Eco Beginner") ? [] : ["Eco Beginner"];

  const updated = await db
    .update(usersTable)
    .set({
      ...data,
      carbonScore: annualTons,
      onboardingComplete: true,
      badges: [...existing.badges, ...eco_beginner, ...newBadges],
      greenPoints: newPoints,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  const user = updated[0];
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

export default router;
