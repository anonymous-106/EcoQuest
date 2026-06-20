import { Router } from "express";
import { db, usersTable, challengeTemplatesTable, userChallengesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { CompleteChallengeParams } from "@workspace/api-zod";

const router = Router();

const BADGE_THRESHOLDS: Record<string, { points: number; name: string }> = {
  "Green Explorer": { points: 200, name: "Green Explorer" },
  "Tree Saver": { points: 500, name: "Tree Saver" },
  "Carbon Ninja": { points: 1000, name: "Carbon Ninja" },
  "Sustainability Hero": { points: 2000, name: "Sustainability Hero" },
};

// GET /api/challenges
router.get("/", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!users.length) {
    res.json([]);
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const userId = users[0].id;

  // Get or create today's challenges
  const existing = await db
    .select()
    .from(userChallengesTable)
    .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.assignedDate, today)));

  const templates = await db.select().from(challengeTemplatesTable);

  if (existing.length === 0 && templates.length > 0) {
    // Assign 5 random challenges for today
    const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, 5);
    await db.insert(userChallengesTable).values(
      shuffled.map(t => ({ userId, challengeId: t.id, assignedDate: today, completed: false }))
    );

    const newChallenges = await db
      .select()
      .from(userChallengesTable)
      .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.assignedDate, today)));

    res.json(newChallenges.map(uc => {
      const template = templates.find(t => t.id === uc.challengeId)!;
      return {
        id: uc.id,
        title: template.title,
        description: template.description,
        points: template.points,
        difficulty: template.difficulty,
        category: template.category,
        completed: uc.completed,
        completedAt: uc.completedAt ? uc.completedAt.toISOString() : null,
      };
    }));
    return;
  }

  res.json(existing.map(uc => {
    const template = templates.find(t => t.id === uc.challengeId);
    if (!template) return null;
    return {
      id: uc.id,
      title: template.title,
      description: template.description,
      points: template.points,
      difficulty: template.difficulty,
      category: template.category,
      completed: uc.completed,
      completedAt: uc.completedAt ? uc.completedAt.toISOString() : null,
    };
  }).filter(Boolean));
});

// POST /api/challenges/:id/complete
router.post("/:id/complete", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkId as string;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = CompleteChallengeParams.safeParse({ id: parseInt(rawId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid challenge id" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!users.length) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const userChallenge = await db
    .select()
    .from(userChallengesTable)
    .where(eq(userChallengesTable.id, parsed.data.id))
    .limit(1);

  if (!userChallenge.length) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  if (userChallenge[0].completed) {
    const template = await db.select().from(challengeTemplatesTable).where(eq(challengeTemplatesTable.id, userChallenge[0].challengeId)).limit(1);
    const user = users[0];
    res.json({
      challenge: {
        id: userChallenge[0].id,
        title: template[0]?.title ?? "",
        description: template[0]?.description ?? "",
        points: template[0]?.points ?? 0,
        difficulty: template[0]?.difficulty ?? "easy",
        category: template[0]?.category ?? "",
        completed: true,
        completedAt: userChallenge[0].completedAt?.toISOString() ?? null,
      },
      pointsEarned: 0,
      newTotal: user.greenPoints,
      newStreak: user.streak,
      newBadges: [],
    });
    return;
  }

  const template = await db.select().from(challengeTemplatesTable).where(eq(challengeTemplatesTable.id, userChallenge[0].challengeId)).limit(1);
  const points = template[0]?.points ?? 10;

  await db
    .update(userChallengesTable)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(userChallengesTable.id, parsed.data.id));

  const user = users[0];
  const newPoints = user.greenPoints + points;
  const today = new Date().toISOString().split("T")[0];
  const newStreak = user.lastLoginDate === today ? user.streak : user.streak + 1;

  // Check for new badges
  const newBadges: string[] = [];
  const currentBadges = user.badges ?? [];
  for (const [, badge] of Object.entries(BADGE_THRESHOLDS)) {
    if (newPoints >= badge.points && !currentBadges.includes(badge.name)) {
      newBadges.push(badge.name);
    }
  }

  const updatedUser = await db
    .update(usersTable)
    .set({
      greenPoints: newPoints,
      streak: newStreak,
      lastLoginDate: today,
      badges: ([...currentBadges, ...newBadges] as string[]),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  res.json({
    challenge: {
      id: userChallenge[0].id,
      title: template[0]?.title ?? "",
      description: template[0]?.description ?? "",
      points,
      difficulty: template[0]?.difficulty ?? "easy",
      category: template[0]?.category ?? "",
      completed: true,
      completedAt: new Date().toISOString(),
    },
    pointsEarned: points,
    newTotal: updatedUser[0].greenPoints,
    newStreak: updatedUser[0].streak,
    newBadges,
  });
});

export default router;
