import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const challengeTemplatesTable = pgTable("challenge_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
});

export const userChallengesTable = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  assignedDate: text("assigned_date").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChallengeTemplateSchema = createInsertSchema(challengeTemplatesTable).omit({ id: true });
export type InsertChallengeTemplate = z.infer<typeof insertChallengeTemplateSchema>;
export type ChallengeTemplate = typeof challengeTemplatesTable.$inferSelect;

export const insertUserChallengeSchema = createInsertSchema(userChallengesTable).omit({ id: true, createdAt: true });
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type UserChallenge = typeof userChallengesTable.$inferSelect;
