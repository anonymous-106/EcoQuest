import { pgTable, text, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  carbonSavingKg: real("carbon_saving_kg").notNull(),
  moneySavingMonthly: real("money_saving_monthly").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
});

export const insertRecommendationSchema = createInsertSchema(recommendationsTable).omit({ id: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;
