import { Router } from "express";
import { db, activitiesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { LogActivityBody, GetActivitiesQueryParams } from "@workspace/api-zod";
import { calculateFootprint } from "../lib/calculator";

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

// GET /api/activities
router.get("/", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const parsed = GetActivitiesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const user = await getOrCreateUser(clerkId);

  const activities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.userId, user.id))
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

  const user = await getOrCreateUser(clerkId);

  const inserted = await db
    .insert(activitiesTable)
    .values({ ...parsed.data, userId: user.id })
    .returning();

  const activity = inserted[0];
  res.status(201).json({ ...activity, createdAt: activity.createdAt.toISOString() });
});

// POST /api/activities/calculator
router.post("/calculator", async (req, res) => {
  const { transportation, dailyTravelKm, electricityBill, foodPreference, shoppingFrequency, airTravelPerYear } = req.body;

  if (
    typeof transportation !== "string" ||
    typeof dailyTravelKm !== "number" ||
    typeof electricityBill !== "number" ||
    typeof foodPreference !== "string" ||
    typeof shoppingFrequency !== "string" ||
    typeof airTravelPerYear !== "number"
  ) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const result = calculateFootprint({ transportation, dailyTravelKm, electricityBill, foodPreference, shoppingFrequency, airTravelPerYear });
  res.json(result);
});

export default router;
