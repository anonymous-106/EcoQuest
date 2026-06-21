import { Router } from "express";
import type { Request } from "express";
import { db, usersTable, challengeTemplatesTable, userChallengesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CompleteChallengeParams } from "@workspace/api-zod";
import { getNewBadges } from "../lib/calculator";
import { getOrCreateUser } from "../lib/user";

const router = Router();

// GET /api/challenges
router.get("/", requireAuth, async (req: Request, res) => {
  const { clerkId } = req as AuthRequest;
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (!users.length) {
    res.json([]);
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const userId = users[0].id;

  const [existing, templates] = await Promise.all([
    db
      .select()
      .from(userChallengesTable)
      .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.assignedDate, today))),
    db.select().from(challengeTemplatesTable),
  ]);

  const formatChallenges = (ucs: typeof existing) =>
    ucs
      .map((uc) => {
        const template = templates.find((t) => t.id === uc.challengeId);
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
      })
      .filter(Boolean);

  if (existing.length === 0 && templates.length > 0) {
    const shuffled = [...templates].sort(() => Math.random() - 0.5).slice(0, 5);
    await db.insert(userChallengesTable).values(
      shuffled.map((t) => ({ userId, challengeId: t.id, assignedDate: today, completed: false })),
    );
    const newChallenges = await db
      .select()
      .from(userChallengesTable)
      .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.assignedDate, today)));
    res.json(formatChallenges(newChallenges));
    return;
  }

  res.json(formatChallenges(existing));
});

// POST /api/challenges/:id/complete
router.post("/:id/complete", requireAuth, async (req: Request, res) => {
  const { clerkId } = req as AuthRequest;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = CompleteChallengeParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid challenge id" });
    return;
  }

  const user = await getOrCreateUser(clerkId);
  const userChallenge = await db
    .select()
    .from(userChallengesTable)
    .where(eq(userChallengesTable.id, parsed.data.id))
    .limit(1);

  if (!userChallenge.length) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const [template] = await db
    .select()
    .from(challengeTemplatesTable)
    .where(eq(challengeTemplatesTable.id, userChallenge[0].challengeId))
    .limit(1);

  const challengeData = {
    id: userChallenge[0].id,
    title: template?.title ?? "",
    description: template?.description ?? "",
    points: template?.points ?? 0,
    difficulty: template?.difficulty ?? "easy",
    category: template?.category ?? "",
  };

  if (userChallenge[0].completed) {
    res.json({
      challenge: { ...challengeData, completed: true, completedAt: userChallenge[0].completedAt?.toISOString() ?? null },
      pointsEarned: 0,
      newTotal: user.greenPoints,
      newStreak: user.streak,
      newBadges: [],
    });
    return;
  }

  const points = template?.points ?? 10;
  await db
    .update(userChallengesTable)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(userChallengesTable.id, parsed.data.id));

  const newPoints = user.greenPoints + points;
  const today = new Date().toISOString().split("T")[0];
  const newStreak = user.lastLoginDate === today ? user.streak : user.streak + 1;
  const currentBadges = user.badges ?? [];
  const newBadges = getNewBadges(user.greenPoints, newPoints, currentBadges);

  const [updatedUser] = await db
    .update(usersTable)
    .set({
      greenPoints: newPoints,
      streak: newStreak,
      lastLoginDate: today,
      badges: [...currentBadges, ...newBadges] as string[],
      updatedAt: new Date(),
    })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  res.json({
    challenge: { ...challengeData, completed: true, completedAt: new Date().toISOString() },
    pointsEarned: points,
    newTotal: updatedUser.greenPoints,
    newStreak: updatedUser.streak,
    newBadges,
  });
});

export default router;
