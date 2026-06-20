import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  profileImage: text("profile_image"),
  carbonScore: real("carbon_score").notNull().default(0),
  greenPoints: integer("green_points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  badges: text("badges").array().notNull().default([]),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  country: text("country"),
  ageGroup: text("age_group"),
  transportation: text("transportation"),
  dailyTravelKm: real("daily_travel_km"),
  electricityBill: real("electricity_bill"),
  householdSize: integer("household_size"),
  foodPreference: text("food_preference"),
  shoppingFrequency: text("shopping_frequency"),
  airTravelPerYear: integer("air_travel_per_year"),
  recyclingHabits: text("recycling_habits"),
  lastLoginDate: text("last_login_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
