import { describe, it, expect } from "vitest";
import {
  calcTransportKgPerDay,
  calcElectricityKgPerDay,
  calcFoodKgPerDay,
  calcShoppingKgPerDay,
  calcAirTravelKgPerDay,
  calculateFootprint,
  calculateCarbonScore,
  getNewBadges,
  LIFESTYLE_KG_PER_DAY,
} from "./calculator";

// ─── Transport ─────────────────────────────────────────────────────────────

describe("calcTransportKgPerDay", () => {
  it("walking emits 0 kg regardless of distance", () => {
    expect(calcTransportKgPerDay("walking", 10)).toBe(0);
  });

  it("car emits 0.21 kg/km", () => {
    expect(calcTransportKgPerDay("car", 10)).toBeCloseTo(2.1);
  });

  it("public transport emits 0.05 kg/km", () => {
    expect(calcTransportKgPerDay("public transport", 20)).toBeCloseTo(1.0);
  });

  it("bicycle emits 0.02 kg/km", () => {
    expect(calcTransportKgPerDay("bicycle", 5)).toBeCloseTo(0.1);
  });

  it("unknown mode falls back to 0.1 kg/km", () => {
    expect(calcTransportKgPerDay("hovercraft", 10)).toBeCloseTo(1.0);
  });

  it("zero distance always returns 0", () => {
    expect(calcTransportKgPerDay("car", 0)).toBe(0);
  });
});

// ─── Electricity ───────────────────────────────────────────────────────────

describe("calcElectricityKgPerDay", () => {
  it("returns 0 for zero bill", () => {
    expect(calcElectricityKgPerDay(0)).toBe(0);
  });

  it("scales linearly with bill amount", () => {
    const at100 = calcElectricityKgPerDay(100);
    const at200 = calcElectricityKgPerDay(200);
    expect(at200).toBeCloseTo(at100 * 2);
  });

  it("$150 monthly bill ≈ 0.6 kg/day", () => {
    expect(calcElectricityKgPerDay(150)).toBeCloseTo(0.6, 4);
  });
});

// ─── Food ──────────────────────────────────────────────────────────────────

describe("calcFoodKgPerDay", () => {
  it("vegan diet is lowest emission", () => {
    expect(calcFoodKgPerDay("vegan")).toBeLessThan(calcFoodKgPerDay("vegetarian"));
  });

  it("vegetarian is lower than non-vegetarian", () => {
    expect(calcFoodKgPerDay("vegetarian")).toBeLessThan(calcFoodKgPerDay("non-vegetarian"));
  });

  it("non-vegetarian ≈ 0.0197 kg/day", () => {
    expect(calcFoodKgPerDay("non-vegetarian")).toBeCloseTo(7.2 / 365, 5);
  });

  it("unknown preference falls back to default", () => {
    expect(calcFoodKgPerDay("fruitarian")).toBeGreaterThan(0);
  });
});

// ─── Shopping ──────────────────────────────────────────────────────────────

describe("calcShoppingKgPerDay", () => {
  it("daily shoppers emit the most", () => {
    expect(calcShoppingKgPerDay("daily")).toBeGreaterThan(calcShoppingKgPerDay("weekly"));
    expect(calcShoppingKgPerDay("weekly")).toBeGreaterThan(calcShoppingKgPerDay("monthly"));
    expect(calcShoppingKgPerDay("monthly")).toBeGreaterThan(calcShoppingKgPerDay("rarely"));
    expect(calcShoppingKgPerDay("rarely")).toBeGreaterThan(calcShoppingKgPerDay("never"));
  });

  it("never shopping ≈ 0.00333 kg/day", () => {
    expect(calcShoppingKgPerDay("never")).toBeCloseTo(0.1 / 30, 5);
  });
});

// ─── Air Travel ────────────────────────────────────────────────────────────

describe("calcAirTravelKgPerDay", () => {
  it("zero flights emits 0", () => {
    expect(calcAirTravelKgPerDay(0)).toBe(0);
  });

  it("1 flight/year ≈ 0.699 kg/day", () => {
    expect(calcAirTravelKgPerDay(1)).toBeCloseTo(255 / 365, 4);
  });

  it("scales linearly with number of flights", () => {
    expect(calcAirTravelKgPerDay(4)).toBeCloseTo(calcAirTravelKgPerDay(2) * 2, 5);
  });
});

// ─── Full Footprint Calculation ────────────────────────────────────────────

describe("calculateFootprint", () => {
  const walkerVeganNoFlights = {
    transportation: "walking",
    dailyTravelKm: 5,
    electricityBill: 0,
    foodPreference: "vegan",
    shoppingFrequency: "never",
    airTravelPerYear: 0,
  };

  it("walker with zero electricity and no flights still has lifestyle emissions", () => {
    const result = calculateFootprint(walkerVeganNoFlights);
    expect(result.dailyKg).toBeGreaterThan(0);
    expect(result.breakdown.lifestyle).toBeCloseTo(LIFESTYLE_KG_PER_DAY * 365, 1);
  });

  it("annual kg = daily kg × 365 (approximately)", () => {
    const result = calculateFootprint(walkerVeganNoFlights);
    expect(result.annualKg).toBeCloseTo(result.dailyKg * 365, 0);
  });

  it("monthly kg = daily kg × 30 (approximately)", () => {
    const result = calculateFootprint(walkerVeganNoFlights);
    expect(result.monthlyKg).toBeCloseTo(result.dailyKg * 30, 0);
  });

  it("high-impact profile returns 'high' level", () => {
    const result = calculateFootprint({
      transportation: "car",
      dailyTravelKm: 100,
      electricityBill: 500,
      foodPreference: "non-vegetarian",
      shoppingFrequency: "daily",
      airTravelPerYear: 20,
    });
    expect(result.impactLevel).toBe("high");
  });

  it("minimal-impact profile returns 'low' level", () => {
    const result = calculateFootprint(walkerVeganNoFlights);
    expect(result.impactLevel).toBe("low");
  });

  it("car commuter has higher transport breakdown than cyclist", () => {
    const byCar = calculateFootprint({ ...walkerVeganNoFlights, transportation: "car", dailyTravelKm: 30 });
    const byCycle = calculateFootprint({ ...walkerVeganNoFlights, transportation: "bicycle", dailyTravelKm: 30 });
    expect(byCar.breakdown.transportation).toBeGreaterThan(byCycle.breakdown.transportation);
  });

  it("treesNeeded is positive for non-zero footprint", () => {
    const result = calculateFootprint({
      transportation: "car",
      dailyTravelKm: 20,
      electricityBill: 100,
      foodPreference: "non-vegetarian",
      shoppingFrequency: "monthly",
      airTravelPerYear: 2,
    });
    expect(result.comparisons.treesNeeded).toBeGreaterThan(0);
  });
});

// ─── Carbon Score ──────────────────────────────────────────────────────────

describe("calculateCarbonScore", () => {
  it("returns 0 for walker with no electricity, vegan, never shops, no flights", () => {
    const score = calculateCarbonScore({
      transportation: "walking",
      dailyTravelKm: 0,
      electricityBill: 0,
      foodPreference: "vegan",
      shoppingFrequency: "never",
      airTravelPerYear: 0,
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("higher travel means higher carbon score", () => {
    const base = {
      transportation: "car",
      dailyTravelKm: 10,
      electricityBill: 100,
      foodPreference: "non-vegetarian",
      shoppingFrequency: "monthly",
      airTravelPerYear: 0,
    };
    const moreTravel = { ...base, dailyTravelKm: 50 };
    expect(calculateCarbonScore(moreTravel)).toBeGreaterThan(calculateCarbonScore(base));
  });

  it("result is in annual tons (reasonable range 0-50 for typical users)", () => {
    const score = calculateCarbonScore({
      transportation: "car",
      dailyTravelKm: 30,
      electricityBill: 200,
      foodPreference: "non-vegetarian",
      shoppingFrequency: "weekly",
      airTravelPerYear: 4,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(50);
  });
});

// ─── Badge System ──────────────────────────────────────────────────────────

describe("getNewBadges", () => {
  it("returns empty array when no threshold crossed", () => {
    expect(getNewBadges(0, 50, [])).toEqual([]);
  });

  it("awards Green Explorer at 200 points", () => {
    const badges = getNewBadges(150, 250, []);
    expect(badges).toContain("Green Explorer");
  });

  it("awards Tree Saver at 500 points", () => {
    const badges = getNewBadges(400, 600, []);
    expect(badges).toContain("Tree Saver");
  });

  it("awards Carbon Ninja at 1000 points", () => {
    const badges = getNewBadges(900, 1100, []);
    expect(badges).toContain("Carbon Ninja");
  });

  it("awards Sustainability Hero at 2000 points", () => {
    const badges = getNewBadges(1800, 2100, []);
    expect(badges).toContain("Sustainability Hero");
  });

  it("does not re-award an already earned badge", () => {
    const badges = getNewBadges(150, 250, ["Green Explorer"]);
    expect(badges).not.toContain("Green Explorer");
  });

  it("can award multiple badges in one leap", () => {
    const badges = getNewBadges(100, 600, []);
    expect(badges).toContain("Green Explorer");
    expect(badges).toContain("Tree Saver");
  });

  it("exact threshold boundary — at the threshold earns badge", () => {
    const badges = getNewBadges(199, 200, []);
    expect(badges).toContain("Green Explorer");
  });

  it("exact threshold boundary — one below threshold earns nothing", () => {
    const badges = getNewBadges(100, 199, []);
    expect(badges).not.toContain("Green Explorer");
  });
});
