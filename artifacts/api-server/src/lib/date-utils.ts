/** Pure date/aggregation utilities — no DB, no Express, fully unit-testable. */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export interface ActivityLike {
  date: string;
  emissionKg: number;
}

export interface CategoryLike {
  category: string;
  emissionKg: number;
}

export interface DayEmission {
  day: string;
  kg: number;
}

export interface MonthEmission {
  month: string;
  kg: number;
}

export interface CategoryBreakdown {
  category: string;
  kg: number;
  percentage: number;
}

/**
 * Returns today's date as a YYYY-MM-DD string (local time).
 */
export function todayString(baseDate?: Date): string {
  const d = baseDate ?? new Date();
  return d.toISOString().split("T")[0];
}

/**
 * Builds a 7-element weekly emissions array (oldest → newest) for the
 * 7 days ending on `baseDate` (inclusive). Days with no activity return 0.
 */
export function buildWeeklyEmissions(
  activities: ActivityLike[],
  baseDate?: Date,
): DayEmission[] {
  const today = baseDate ?? new Date();
  const result: DayEmission[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const kg = activities
      .filter((a) => a.date === dateStr)
      .reduce((sum, a) => sum + a.emissionKg, 0);
    result.push({ day: DAY_LABELS[d.getDay()], kg: Math.round(kg * 100) / 100 });
  }

  return result;
}

/**
 * Builds a monthly emissions array (oldest → newest) for the last `months`
 * calendar months ending on `baseDate`. Months with no activity return 0.
 */
export function buildMonthlyEmissions(
  activities: ActivityLike[],
  months = 6,
  baseDate?: Date,
): MonthEmission[] {
  const today = baseDate ?? new Date();
  const monthlyMap = new Map<string, number>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }

  for (const activity of activities) {
    const month = activity.date.substring(0, 7);
    if (monthlyMap.has(month)) {
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + activity.emissionKg);
    }
  }

  return Array.from(monthlyMap.entries()).map(([key, kg]) => {
    const monthNum = parseInt(key.split("-")[1], 10) - 1;
    return { month: MONTH_LABELS[monthNum], kg: Math.round(kg * 100) / 100 };
  });
}

/**
 * Groups activities by category and computes each category's total kg and
 * percentage of overall emissions. Returns an empty array for empty input.
 */
export function buildCategoryBreakdown(activities: CategoryLike[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, number>();
  for (const activity of activities) {
    categoryMap.set(
      activity.category,
      (categoryMap.get(activity.category) ?? 0) + activity.emissionKg,
    );
  }

  const totalEmissions = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
  if (totalEmissions === 0) return [];

  return Array.from(categoryMap.entries()).map(([category, kg]) => ({
    category,
    kg: Math.round(kg * 100) / 100,
    percentage: Math.round((kg / totalEmissions) * 100),
  }));
}
