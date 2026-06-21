import { describe, it, expect } from "vitest";
import {
  todayString,
  buildWeeklyEmissions,
  buildMonthlyEmissions,
  buildCategoryBreakdown,
} from "./date-utils";

// ─── todayString ───────────────────────────────────────────────────────────

describe("todayString", () => {
  it("returns a YYYY-MM-DD formatted string", () => {
    const result = todayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("accepts a baseDate and returns its date string", () => {
    const d = new Date("2026-06-21T12:00:00Z");
    expect(todayString(d)).toBe("2026-06-21");
  });

  it("pads month and day with leading zeros", () => {
    const d = new Date("2026-01-05T00:00:00Z");
    expect(todayString(d)).toMatch(/\d{4}-01-05/);
  });
});

// ─── buildWeeklyEmissions ─────────────────────────────────────────────────

describe("buildWeeklyEmissions", () => {
  const BASE = new Date("2026-06-21T12:00:00Z");

  it("returns exactly 7 entries", () => {
    expect(buildWeeklyEmissions([], BASE)).toHaveLength(7);
  });

  it("returns 0 kg for every day when no activities exist", () => {
    const result = buildWeeklyEmissions([], BASE);
    expect(result.every((d) => d.kg === 0)).toBe(true);
  });

  it("last entry corresponds to the baseDate", () => {
    const result = buildWeeklyEmissions([], BASE);
    const lastDay = result[result.length - 1];
    expect(lastDay.day).toBe("Sun"); // 2026-06-21 is a Sunday
  });

  it("first entry is 6 days before baseDate", () => {
    const result = buildWeeklyEmissions([], BASE);
    expect(result[0].day).toBe("Mon"); // 2026-06-15 is a Monday
  });

  it("aggregates activities correctly for a given day", () => {
    const activities = [
      { date: "2026-06-21", emissionKg: 3.5 },
      { date: "2026-06-21", emissionKg: 1.5 },
    ];
    const result = buildWeeklyEmissions(activities, BASE);
    expect(result[6].kg).toBe(5.0);
  });

  it("does not include activities outside the 7-day window", () => {
    const activities = [{ date: "2026-06-10", emissionKg: 100 }];
    const result = buildWeeklyEmissions(activities, BASE);
    expect(result.every((d) => d.kg === 0)).toBe(true);
  });

  it("rounds values to 2 decimal places", () => {
    const activities = [{ date: "2026-06-21", emissionKg: 1.2345 }];
    const result = buildWeeklyEmissions(activities, BASE);
    expect(result[6].kg).toBe(1.23);
  });

  it("handles multiple days with different activity totals", () => {
    const activities = [
      { date: "2026-06-21", emissionKg: 2.0 },
      { date: "2026-06-20", emissionKg: 4.0 },
    ];
    const result = buildWeeklyEmissions(activities, BASE);
    expect(result[6].kg).toBe(2.0); // Sunday
    expect(result[5].kg).toBe(4.0); // Saturday
  });
});

// ─── buildMonthlyEmissions ────────────────────────────────────────────────

describe("buildMonthlyEmissions", () => {
  const BASE = new Date("2026-06-21T00:00:00Z");

  it("returns 6 entries by default", () => {
    expect(buildMonthlyEmissions([], 6, BASE)).toHaveLength(6);
  });

  it("returns the requested number of months", () => {
    expect(buildMonthlyEmissions([], 3, BASE)).toHaveLength(3);
    expect(buildMonthlyEmissions([], 12, BASE)).toHaveLength(12);
  });

  it("returns 0 kg for all months when no activities exist", () => {
    const result = buildMonthlyEmissions([], 6, BASE);
    expect(result.every((m) => m.kg === 0)).toBe(true);
  });

  it("last entry is the base month (Jun)", () => {
    const result = buildMonthlyEmissions([], 6, BASE);
    expect(result[5].month).toBe("Jun");
  });

  it("first entry is 5 months before base (Jan)", () => {
    const result = buildMonthlyEmissions([], 6, BASE);
    expect(result[0].month).toBe("Jan");
  });

  it("aggregates activities in the correct month", () => {
    const activities = [
      { date: "2026-06-01", emissionKg: 10 },
      { date: "2026-06-30", emissionKg: 5 },
    ];
    const result = buildMonthlyEmissions(activities, 6, BASE);
    expect(result[5].kg).toBe(15);
  });

  it("ignores activities outside the window", () => {
    const activities = [{ date: "2025-01-01", emissionKg: 999 }];
    const result = buildMonthlyEmissions(activities, 6, BASE);
    expect(result.every((m) => m.kg === 0)).toBe(true);
  });

  it("rounds monthly totals to 2 decimal places", () => {
    const activities = [{ date: "2026-06-15", emissionKg: 1.2345 }];
    const result = buildMonthlyEmissions(activities, 6, BASE);
    expect(result[5].kg).toBe(1.23);
  });

  it("returns month label strings, not numbers", () => {
    const result = buildMonthlyEmissions([], 6, BASE);
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    result.forEach((m) => expect(monthLabels).toContain(m.month));
  });
});

// ─── buildCategoryBreakdown ───────────────────────────────────────────────

describe("buildCategoryBreakdown", () => {
  it("returns empty array for no activities", () => {
    expect(buildCategoryBreakdown([])).toEqual([]);
  });

  it("single category gets 100% percentage", () => {
    const result = buildCategoryBreakdown([
      { category: "transport", emissionKg: 10 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("transport");
    expect(result[0].kg).toBe(10);
    expect(result[0].percentage).toBe(100);
  });

  it("two equal categories each get 50%", () => {
    const result = buildCategoryBreakdown([
      { category: "transport", emissionKg: 5 },
      { category: "food", emissionKg: 5 },
    ]);
    const transport = result.find((c) => c.category === "transport")!;
    const food = result.find((c) => c.category === "food")!;
    expect(transport.percentage).toBe(50);
    expect(food.percentage).toBe(50);
  });

  it("groups multiple activities under the same category", () => {
    const result = buildCategoryBreakdown([
      { category: "transport", emissionKg: 3 },
      { category: "transport", emissionKg: 7 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].kg).toBe(10);
  });

  it("rounds kg and percentage to 2 decimal places", () => {
    const result = buildCategoryBreakdown([
      { category: "a", emissionKg: 1 },
      { category: "b", emissionKg: 2 },
    ]);
    const a = result.find((c) => c.category === "a")!;
    expect(a.percentage).toBe(33); // Math.round(33.33...)
  });

  it("handles three categories with different weights", () => {
    const result = buildCategoryBreakdown([
      { category: "transport", emissionKg: 50 },
      { category: "food", emissionKg: 30 },
      { category: "shopping", emissionKg: 20 },
    ]);
    expect(result).toHaveLength(3);
    const transport = result.find((c) => c.category === "transport")!;
    expect(transport.percentage).toBe(50);
  });

  it("percentages sum close to 100 for typical inputs", () => {
    const result = buildCategoryBreakdown([
      { category: "a", emissionKg: 33.3 },
      { category: "b", emissionKg: 33.3 },
      { category: "c", emissionKg: 33.4 },
    ]);
    const total = result.reduce((sum, c) => sum + c.percentage, 0);
    expect(total).toBeGreaterThanOrEqual(99);
    expect(total).toBeLessThanOrEqual(101);
  });
});
