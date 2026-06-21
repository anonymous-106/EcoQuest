import { describe, it, expect } from "vitest";
import {
  formatEmission,
  formatPoints,
  formatStreak,
  formatPercent,
  ordinalSuffix,
  clamp,
  impactLabel,
  formatShortDate,
  formatCountdown,
} from "./formatters";

// ─── formatEmission ────────────────────────────────────────────────────────

describe("formatEmission", () => {
  it("formats kg below 1000 in kg by default (auto)", () => {
    expect(formatEmission(12.5)).toBe("12.5 kg");
  });

  it("formats values >= 1000 in tonnes in auto mode", () => {
    expect(formatEmission(1500)).toBe("1.5 t");
  });

  it("forces kg unit regardless of size", () => {
    expect(formatEmission(5000, "kg")).toContain("kg");
  });

  it("forces tonnes unit regardless of size", () => {
    expect(formatEmission(0.5, "t")).toContain("t");
  });

  it("returns '0 kg' for zero input in auto mode", () => {
    expect(formatEmission(0)).toBe("0 kg");
  });

  it("rounds kg to 2 decimal places", () => {
    expect(formatEmission(1.2345)).toBe("1.23 kg");
  });

  it("rounds tonnes to 3 decimal places", () => {
    const result = formatEmission(1234.5678);
    expect(result).toMatch(/1\.235 t/);
  });

  it("exactly 999.99 stays in kg", () => {
    expect(formatEmission(999.99)).toContain("kg");
  });

  it("exactly 1000 switches to tonnes in auto", () => {
    expect(formatEmission(1000)).toContain("t");
  });
});

// ─── formatPoints ──────────────────────────────────────────────────────────

describe("formatPoints", () => {
  it("formats 0 as '0 pts'", () => {
    expect(formatPoints(0)).toBe("0 pts");
  });

  it("formats small numbers without commas", () => {
    expect(formatPoints(42)).toBe("42 pts");
  });

  it("formats thousands with comma separator", () => {
    expect(formatPoints(1234)).toBe("1,234 pts");
  });

  it("formats large numbers correctly", () => {
    expect(formatPoints(1000000)).toBe("1,000,000 pts");
  });

  it("rounds fractional points", () => {
    expect(formatPoints(99.7)).toBe("100 pts");
  });
});

// ─── formatStreak ─────────────────────────────────────────────────────────

describe("formatStreak", () => {
  it("returns '0 days' for zero streak", () => {
    expect(formatStreak(0)).toBe("0 days");
  });

  it("returns '1 day' (singular) for 1", () => {
    expect(formatStreak(1)).toBe("1 day");
  });

  it("returns plural for 2+", () => {
    expect(formatStreak(2)).toBe("2 days");
    expect(formatStreak(30)).toBe("30 days");
    expect(formatStreak(365)).toBe("365 days");
  });

  it("clamps negative values to 0", () => {
    expect(formatStreak(-5)).toBe("0 days");
  });

  it("rounds fractional day counts", () => {
    expect(formatStreak(1.7)).toBe("2 days");
  });
});

// ─── formatPercent ────────────────────────────────────────────────────────

describe("formatPercent", () => {
  it("formats 0 as '0%'", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("formats 100 as '100%'", () => {
    expect(formatPercent(100)).toBe("100%");
  });

  it("rounds to nearest integer", () => {
    expect(formatPercent(42.6)).toBe("43%");
    expect(formatPercent(42.4)).toBe("42%");
  });

  it("handles 50%", () => {
    expect(formatPercent(50)).toBe("50%");
  });
});

// ─── ordinalSuffix ────────────────────────────────────────────────────────

describe("ordinalSuffix", () => {
  it("returns 1st", () => expect(ordinalSuffix(1)).toBe("1st"));
  it("returns 2nd", () => expect(ordinalSuffix(2)).toBe("2nd"));
  it("returns 3rd", () => expect(ordinalSuffix(3)).toBe("3rd"));
  it("returns 4th", () => expect(ordinalSuffix(4)).toBe("4th"));
  it("returns 11th (teen exception)", () => expect(ordinalSuffix(11)).toBe("11th"));
  it("returns 12th (teen exception)", () => expect(ordinalSuffix(12)).toBe("12th"));
  it("returns 13th (teen exception)", () => expect(ordinalSuffix(13)).toBe("13th"));
  it("returns 21st", () => expect(ordinalSuffix(21)).toBe("21st"));
  it("returns 22nd", () => expect(ordinalSuffix(22)).toBe("22nd"));
  it("returns 23rd", () => expect(ordinalSuffix(23)).toBe("23rd"));
  it("returns 100th", () => expect(ordinalSuffix(100)).toBe("100th"));
  it("returns 101st", () => expect(ordinalSuffix(101)).toBe("101st"));
  it("returns 111th (teen exception at 111)", () => expect(ordinalSuffix(111)).toBe("111th"));
});

// ─── clamp ────────────────────────────────────────────────────────────────

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when value is above max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("works with negative ranges", () => {
    expect(clamp(-50, -100, -10)).toBe(-50);
    expect(clamp(-5, -100, -10)).toBe(-10);
  });

  it("works with float boundaries", () => {
    expect(clamp(0.5, 0.0, 1.0)).toBe(0.5);
    expect(clamp(1.5, 0.0, 1.0)).toBe(1.0);
  });
});

// ─── impactLabel ──────────────────────────────────────────────────────────

describe("impactLabel", () => {
  it("returns 'Low Impact' for low", () => {
    expect(impactLabel("low")).toBe("Low Impact");
  });

  it("returns 'Moderate Impact' for moderate", () => {
    expect(impactLabel("moderate")).toBe("Moderate Impact");
  });

  it("returns 'High Impact' for high", () => {
    expect(impactLabel("high")).toBe("High Impact");
  });
});

// ─── formatShortDate ──────────────────────────────────────────────────────

describe("formatShortDate", () => {
  it("formats a mid-year date as 'Mon DD'", () => {
    const result = formatShortDate("2026-06-21");
    expect(result).toMatch(/Jun 21/);
  });

  it("formats a January date", () => {
    const result = formatShortDate("2026-01-01");
    expect(result).toMatch(/Jan 1/);
  });

  it("formats a December date", () => {
    const result = formatShortDate("2026-12-31");
    expect(result).toMatch(/Dec 31/);
  });

  it("handles single-digit day without leading zero in output", () => {
    const result = formatShortDate("2026-03-05");
    expect(result).toMatch(/Mar 5/);
  });
});

// ─── formatCountdown ──────────────────────────────────────────────────────

describe("formatCountdown", () => {
  it("returns null for zero ms", () => {
    expect(formatCountdown(0)).toBeNull();
  });

  it("returns null for negative ms", () => {
    expect(formatCountdown(-1000)).toBeNull();
  });

  it("formats exactly 1 hour as '1h 0m'", () => {
    expect(formatCountdown(3_600_000)).toBe("1h 0m");
  });

  it("formats 1.5 hours as '1h 30m'", () => {
    expect(formatCountdown(5_400_000)).toBe("1h 30m");
  });

  it("formats 24 hours as '24h 0m'", () => {
    expect(formatCountdown(24 * 3_600_000)).toBe("24h 0m");
  });

  it("formats 90 minutes as '1h 30m'", () => {
    expect(formatCountdown(90 * 60_000)).toBe("1h 30m");
  });

  it("formats 45 minutes as '0h 45m'", () => {
    expect(formatCountdown(45 * 60_000)).toBe("0h 45m");
  });
});
