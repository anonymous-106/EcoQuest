/** Pure display-formatting utilities — no side effects, fully unit-testable. */

/**
 * Formats a CO₂ emission value.
 * - "auto": shows kg below 1000, tonnes above.
 * - "kg" / "t": forces the given unit.
 */
export function formatEmission(
  kg: number,
  unit: "kg" | "t" | "auto" = "auto",
): string {
  if (unit === "kg" || (unit === "auto" && kg < 1000)) {
    return `${+(kg.toFixed(2))} kg`;
  }
  const t = kg / 1000;
  return `${+(t.toFixed(3))} t`;
}

/**
 * Formats an integer point score with locale comma separators.
 * e.g. 1234 → "1,234 pts"
 */
export function formatPoints(points: number): string {
  return `${Math.round(points).toLocaleString("en-US")} pts`;
}

/**
 * Formats a streak day count as a pluralised label.
 * e.g. 0 → "0 days", 1 → "1 day", 7 → "7 days"
 */
export function formatStreak(days: number): string {
  const n = Math.max(0, Math.round(days));
  return `${n} ${n === 1 ? "day" : "days"}`;
}

/**
 * Formats a 0–100 value as a percentage string.
 * e.g. 42.6 → "43%"
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Returns the ordinal suffix for a number (1st, 2nd, 3rd, 4th…).
 */
export function ordinalSuffix(n: number): string {
  const abs = Math.abs(Math.floor(n));
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (abs % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/**
 * Clamps `value` to the inclusive range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns a human-readable label for an impact level.
 */
export function impactLabel(level: "low" | "moderate" | "high"): string {
  const labels: Record<string, string> = {
    low: "Low Impact",
    moderate: "Moderate Impact",
    high: "High Impact",
  };
  return labels[level] ?? level;
}

/**
 * Formats a YYYY-MM-DD date string as a short "Mon DD" label.
 * e.g. "2026-06-21" → "Jun 21"
 */
export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Formats a remaining-time duration in milliseconds as "Xh Ym".
 * Returns null if ms ≤ 0.
 */
export function formatCountdown(ms: number): string | null {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}
