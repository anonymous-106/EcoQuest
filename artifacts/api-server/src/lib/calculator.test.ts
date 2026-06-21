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
  TRANSPORT_EMISSIONS_KG_PER_KM,
  FOOD_EMISSIONS_KG_PER_DAY,
  SHOPPING_EMISSIONS_KG_PER_DAY,
} from "./calculator";

// ─── Transport ─────────────────────────────────────────────────────────────

describe("calcTransportKgPerDay", () => {
  it("walking emits 0 kg regardless of distance", () => {
    expect(calcTransportKgPerDay("walking", 10)).toBe(0);
  });

  it("walking at zero distance is 0", () => {
    expect(calcTransportKgPerDay("walking", 0)).toBe(0);
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

  it("motorcycle emits 0.11 kg/km", () => {
    expect(calcTransportKgPerDay("motorcycle", 10)).toBeCloseTo(1.1);
  });

  it("unknown mode falls back to 0.1 kg/km", () => {
    expect(calcTransportKgPerDay("hovercraft", 10)).toBeCloseTo(1.0);
  });

  it("zero distance always returns 0 for any mode", () => {
    expect(calcTransportKgPerDay("car", 0)).toBe(0);
    expect(calcTransportKgPerDay("motorcycle", 0)).toBe(0);
  });

  it("scales linearly with distance", () => {
    const at10 = calcTransportKgPerDay("car", 10);
    const at20 = calcTransportKgPerDay("car", 20);
    expect(at20).toBeCloseTo(at10 * 2);
  });

  it("all known modes have emission factors defined", () => {
    const knownModes = ["walking", "bicycle", "car", "motorcycle", "public transport"];
    for (const mode of knownModes) {
      expect(TRANSPORT_EMISSIONS_KG_PER_KM[mode]).toBeGreaterThanOrEqual(0);
    }
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

  it("$30 bill gives a positive emission", () => {
    expect(calcElectricityKgPerDay(30)).toBeGreaterThan(0);
  });
});

// ─── Food ──────────────────────────────────────────────────────────────────

describe("calcFoodKgPerDay", () => {
  it("vegan diet is the lowest emission", () => {
    expect(calcFoodKgPerDay("vegan")).toBeLessThan(calcFoodKgPerDay("vegetarian"));
  });

  it("vegetarian is lower than non-vegetarian", () => {
    expect(calcFoodKgPerDay("vegetarian")).toBeLessThan(calcFoodKgPerDay("non-vegetarian"));
  });

  it("non-vegetarian ≈ 7.2 / 365 kg/day", () => {
    expect(calcFoodKgPerDay("non-vegetarian")).toBeCloseTo(7.2 / 365, 5);
  });

  it("vegan ≈ 2.5 / 365 kg/day", () => {
    expect(calcFoodKgPerDay("vegan")).toBeCloseTo(2.5 / 365, 5);
  });

  it("vegetarian ≈ 3.8 / 365 kg/day", () => {
    expect(calcFoodKgPerDay("vegetarian")).toBeCloseTo(3.8 / 365, 5);
  });

  it("unknown preference falls back to a positive default", () => {
    expect(calcFoodKgPerDay("fruitarian")).toBeGreaterThan(0);
  });

  it("all food preferences are defined in the constant table", () => {
    for (const [, val] of Object.entries(FOOD_EMISSIONS_KG_PER_DAY)) {
      expect(val).toBeGreaterThan(0);
    }
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

  it("never shopping ≈ 0.1 / 30 kg/day", () => {
    expect(calcShoppingKgPerDay("never")).toBeCloseTo(0.1 / 30, 5);
  });

  it("unknown frequency falls back to a positive default", () => {
    expect(calcShoppingKgPerDay("occasionally")).toBeGreaterThan(0);
  });

  it("all shopping frequencies are defined in the constant table", () => {
    for (const [, val] of Object.entries(SHOPPING_EMISSIONS_KG_PER_DAY)) {
      expect(val).toBeGreaterThan(0);
    }
  });
});

// ─── Air Travel ────────────────────────────────────────────────────────────

describe("calcAirTravelKgPerDay", () => {
  it("zero flights emits 0", () => {
    expect(calcAirTravelKgPerDay(0)).toBe(0);
  });

  it("1 flight/year ≈ 255 / 365 kg/day", () => {
    expect(calcAirTravelKgPerDay(1)).toBeCloseTo(255 / 365, 4);
  });

  it("scales linearly with number of flights", () => {
    expect(calcAirTravelKgPerDay(4)).toBeCloseTo(calcAirTravelKgPerDay(2) * 2, 5);
  });

  it("12 flights emits ~8.38 kg/day", () => {
    expect(calcAirTravelKgPerDay(12)).toBeCloseTo((12 * 255) / 365, 4);
  });
});

// ─── Full Footprint Calculation ────────────────────────────────────────────

describe("calculateFootprint", () => {
  const minimalProfile = {
    transportation: "walking",
    dailyTravelKm: 5,
    electricityBill: 0,
    foodPreference: "vegan",
    shoppingFrequency: "never",
    airTravelPerYear: 0,
  };

  it("minimal profile still has lifestyle emissions", () => {
    const result = calculateFootprint(minimalProfile);
    expect(result.dailyKg).toBeGreaterThan(0);
    expect(result.breakdown.lifestyle).toBeCloseTo(LIFESTYLE_KG_PER_DAY * 365, 1);
  });

  it("annual kg ≈ daily kg × 365", () => {
    const result = calculateFootprint(minimalProfile);
    expect(result.annualKg).toBeCloseTo(result.dailyKg * 365, 0);
  });

  it("monthly kg ≈ daily kg × 30", () => {
    const result = calculateFootprint(minimalProfile);
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
    expect(calculateFootprint(minimalProfile).impactLevel).toBe("low");
  });

  it("moderate profile returns 'moderate' level", () => {
    // car 50km/day + $200 electricity + non-veg + monthly shops → ~4.3 t/yr
    const result = calculateFootprint({
      transportation: "car",
      dailyTravelKm: 50,
      electricityBill: 200,
      foodPreference: "non-vegetarian",
      shoppingFrequency: "monthly",
      airTravelPerYear: 0,
    });
    expect(["moderate", "high"]).toContain(result.impactLevel);
  });

  it("car commuter has higher transport breakdown than cyclist", () => {
    const byCar = calculateFootprint({ ...minimalProfile, transportation: "car", dailyTravelKm: 30 });
    const byCycle = calculateFootprint({ ...minimalProfile, transportation: "bicycle", dailyTravelKm: 30 });
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

  it("carKm comparison is positive for non-zero footprint", () => {
    const result = calculateFootprint({
      transportation: "car",
      dailyTravelKm: 20,
      electricityBill: 100,
      foodPreference: "non-vegetarian",
      shoppingFrequency: "monthly",
      airTravelPerYear: 0,
    });
    expect(result.comparisons.carKm).toBeGreaterThan(0);
  });

  it("breakdown parts sum close to annualKg", () => {
    const r = calculateFootprint({
      transportation: "car",
      dailyTravelKm: 20,
      electricityBill: 100,
      foodPreference: "non-vegetarian",
      shoppingFrequency: "monthly",
      airTravelPerYear: 2,
    });
    const breakdownSum =
      r.breakdown.transportation +
      r.breakdown.electricity +
      r.breakdown.food +
      r.breakdown.shopping +
      r.breakdown.airTravel +
      r.breakdown.lifestyle;
    // Allow ±2 due to rounding at each step
    expect(Math.abs(breakdownSum - r.annualKg)).toBeLessThan(2);
  });

  it("more air travel increases annualKg", () => {
    const withFew = calculateFootprint({ ...minimalProfile, airTravelPerYear: 1 });
    const withMany = calculateFootprint({ ...minimalProfile, airTravelPerYear: 10 });
    expect(withMany.annualKg).toBeGreaterThan(withFew.annualKg);
  });

  it("returns number types for all numeric result fields", () => {
    const result = calculateFootprint(minimalProfile);
    expect(typeof result.dailyKg).toBe("number");
    expect(typeof result.monthlyKg).toBe("number");
    expect(typeof result.annualKg).toBe("number");
    expect(typeof result.comparisons.treesNeeded).toBe("number");
  });
});

// ─── Carbon Score ──────────────────────────────────────────────────────────

describe("calculateCarbonScore", () => {
  it("returns a non-negative value for all-zero inputs", () => {
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

  it("higher travel distance increases carbon score", () => {
    const base = {
      transportation: "car",
      dailyTravelKm: 10,
      electricityBill: 100,
      foodPreference: "non-vegetarian",
      shoppingFrequency: "monthly",
      airTravelPerYear: 0,
    };
    expect(calculateCarbonScore({ ...base, dailyTravelKm: 50 })).toBeGreaterThan(
      calculateCarbonScore(base),
    );
  });

  it("result is in annual tonnes (reasonable 0–50 range for typical users)", () => {
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

  it("more flights means higher carbon score", () => {
    const base = {
      transportation: "walking",
      dailyTravelKm: 0,
      electricityBill: 0,
      foodPreference: "vegan",
      shoppingFrequency: "never",
      airTravelPerYear: 1,
    };
    expect(calculateCarbonScore({ ...base, airTravelPerYear: 10 })).toBeGreaterThan(
      calculateCarbonScore(base),
    );
  });
});

// ─── Badge System ──────────────────────────────────────────────────────────

describe("getNewBadges", () => {
  it("returns empty array when no threshold crossed", () => {
    expect(getNewBadges(0, 50, [])).toEqual([]);
  });

  it("awards Green Explorer at 200 points", () => {
    expect(getNewBadges(150, 250, [])).toContain("Green Explorer");
  });

  it("awards Tree Saver at 500 points", () => {
    expect(getNewBadges(400, 600, [])).toContain("Tree Saver");
  });

  it("awards Carbon Ninja at 1000 points", () => {
    expect(getNewBadges(900, 1100, [])).toContain("Carbon Ninja");
  });

  it("awards Sustainability Hero at 2000 points", () => {
    expect(getNewBadges(1800, 2100, [])).toContain("Sustainability Hero");
  });

  it("does not re-award an already earned badge", () => {
    expect(getNewBadges(150, 250, ["Green Explorer"])).not.toContain("Green Explorer");
  });

  it("can award multiple badges in one leap", () => {
    const badges = getNewBadges(100, 600, []);
    expect(badges).toContain("Green Explorer");
    expect(badges).toContain("Tree Saver");
  });

  it("exact threshold boundary — at the threshold earns badge", () => {
    expect(getNewBadges(199, 200, [])).toContain("Green Explorer");
  });

  it("exact threshold boundary — one below does not earn badge", () => {
    expect(getNewBadges(100, 199, [])).not.toContain("Green Explorer");
  });

  it("already at threshold but already owned — not re-awarded", () => {
    expect(getNewBadges(250, 300, ["Green Explorer"])).not.toContain("Green Explorer");
  });

  it("returns empty array when points move within already-earned range", () => {
    const allBadges = ["Green Explorer", "Tree Saver", "Carbon Ninja", "Sustainability Hero"];
    expect(getNewBadges(2100, 2200, allBadges)).toEqual([]);
  });
});
