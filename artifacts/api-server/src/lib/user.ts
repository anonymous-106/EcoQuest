import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_USER = {
  name: "EcoQuest User",
  email: "",
  greenPoints: 0,
  streak: 0,
  badges: [] as string[],
  onboardingComplete: false,
  carbonScore: 0,
} as const;

/**
 * Fetches an existing user by Clerk ID, or creates a new one with default
 * values on first login (JIT provisioning).
 */
export async function getOrCreateUser(clerkId: string) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const inserted = await db
    .insert(usersTable)
    .values({ clerkId, ...DEFAULT_USER })
    .returning();

  return inserted[0];
}
