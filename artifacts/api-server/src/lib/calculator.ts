/**
 * Pure carbon footprint calculation functions.
 * No Express, no database — fully unit-testable.
 */

/** CO₂ emission factor in kg per km for each transport mode. */
export const TRANSPORT_EMISSIONS_KG_PER_KM: Record<string, number> = {
  walking: 0,
  bicycle: 0.02,
  car: 0.21,
  motorcycle: 0.11,
  "public transport": 0.05,
};

/** Annual food-emission factor in kg per day, by dietary preference. */
export const FOOD_EMISSIONS_KG_PER_DAY: Record<string, number> = {
  vegan: 2.5 / 365,
  vegetarian: 3.8 / 365,
  "non-vegetarian": 7.2 / 365,
};

/** Shopping-emission factor in kg per day, by frequency. */
export const SHOPPING_EMISSIONS_KG_PER_DAY: Record<string, number> = {
  never: 0.1 / 30,
  rarely: 0.3 / 30,
  monthly: 0.8 / 30,
  weekly: 2.1 / 30,
  daily: 4.5 / 30,
};

/** Fixed lifestyle overhead (misc household, digital, etc.) in kg/day. */
export const LIFESTYLE_KG_PER_DAY = 0.5;

/**
 * Calculates daily transport emissions based on mode and daily distance.
 * Falls back to 0.1 kg/km for unknown modes.
 */
export function calcTransportKgPerDay(mode: string, dailyKm: number): number {
  const rate = TRANSPORT_EMISSIONS_KG_PER_KM[mode] ?? 0.1;
  return rate * dailyKm;
}

/**
 * Estimates daily electricity emissions from a monthly electricity bill (USD).
 * Uses a grid-average emission factor of 0.12 kg/kWh and an average cost of
 * $0.12/kWh, yielding 0.12 kg per dollar per month ÷ 30 days.
 */
export function calcElectricityKgPerDay(monthlyBill: number): number {
  return (monthlyBill * 0.12) / 30;
}

/**
 * Returns daily food emissions for the given dietary preference.
 * Falls back to 5 kg/year if the preference is unrecognised.
 */
export function calcFoodKgPerDay(preference: string): number {
  return FOOD_EMISSIONS_KG_PER_DAY[preference] ?? 5 / 365;
}

/**
 * Returns daily shopping emissions for the given purchase frequency.
 * Falls back to 0.5 kg/month if the frequency is unrecognised.
 */
export function calcShoppingKgPerDay(frequency: string): number {
  return SHOPPING_EMISSIONS_KG_PER_DAY[frequency] ?? 0.5 / 30;
}

/**
 * Distributes the per-flight emission of ~255 kg CO₂ across 365 days.
 */
export function calcAirTravelKgPerDay(flightsPerYear: number): number {
  return (flightsPerYear * 255) / 365;
}

export interface FootprintInput {
  transportation: string;
  dailyTravelKm: number;
  electricityBill: number;
  foodPreference: string;
  shoppingFrequency: string;
  airTravelPerYear: number;
}

export interface FootprintResult {
  /** Rounded to 2 decimal places. */
  dailyKg: number;
  /** Rounded to 2 decimal places. */
  monthlyKg: number;
  /** Rounded to 2 decimal places. */
  annualKg: number;
  impactLevel: "low" | "moderate" | "high";
  breakdown: {
    transportation: number;
    electricity: number;
    food: number;
    shopping: number;
    airTravel: number;
    lifestyle: number;
  };
  comparisons: {
    /** Trees needed to offset annual emissions. */
    treesNeeded: number;
    /** Equivalent car kilometres. */
    carKm: number;
    /** Equivalent days of average household energy use. */
    householdDays: number;
  };
}

/**
 * Computes a full carbon footprint breakdown from lifestyle inputs.
 * Impact levels: low < 4 t/yr · moderate < 10 t/yr · high ≥ 10 t/yr.
 */
export function calculateFootprint(input: FootprintInput): FootprintResult {
  const transportKgPerDay = calcTransportKgPerDay(input.transportation, input.dailyTravelKm);
  const electricityKgPerDay = calcElectricityKgPerDay(input.electricityBill);
  const foodKgPerDay = calcFoodKgPerDay(input.foodPreference);
  const shoppingKgPerDay = calcShoppingKgPerDay(input.shoppingFrequency);
  const airTravelKgPerDay = calcAirTravelKgPerDay(input.airTravelPerYear);

  const totalKgPerDay =
    transportKgPerDay +
    electricityKgPerDay +
    foodKgPerDay +
    shoppingKgPerDay +
    airTravelKgPerDay +
    LIFESTYLE_KG_PER_DAY;

  const monthlyKg = totalKgPerDay * 30;
  const annualKg = totalKgPerDay * 365;
  const annualTons = annualKg / 1000;

  const impactLevel: "low" | "moderate" | "high" =
    annualTons < 4 ? "low" : annualTons < 10 ? "moderate" : "high";

  return {
    dailyKg: Math.round(totalKgPerDay * 100) / 100,
    monthlyKg: Math.round(monthlyKg * 100) / 100,
    annualKg: Math.round(annualKg * 100) / 100,
    impactLevel,
    breakdown: {
      transportation: Math.round(transportKgPerDay * 365 * 100) / 100,
      electricity: Math.round(electricityKgPerDay * 365 * 100) / 100,
      food: Math.round(foodKgPerDay * 365 * 100) / 100,
      shopping: Math.round(shoppingKgPerDay * 365 * 100) / 100,
      airTravel: Math.round(airTravelKgPerDay * 365 * 100) / 100,
      lifestyle: Math.round(LIFESTYLE_KG_PER_DAY * 365 * 100) / 100,
    },
    comparisons: {
      treesNeeded: Math.round(annualTons / 0.022),
      carKm: Math.round(annualKg / 0.21),
      householdDays: Math.round(annualKg / (8.9 / 365)),
    },
  };
}

/**
 * Computes the annual carbon score (in tonnes CO₂e) used for onboarding
 * and profile summaries. Excludes the fixed lifestyle overhead.
 */
export function calculateCarbonScore(input: FootprintInput): number {
  const transportKgPerDay = calcTransportKgPerDay(input.transportation, input.dailyTravelKm);
  const electricityKgPerDay = calcElectricityKgPerDay(input.electricityBill);
  const foodKgPerDay = calcFoodKgPerDay(input.foodPreference);
  const shoppingKgPerDay = calcShoppingKgPerDay(input.shoppingFrequency);
  const airTravelKgPerDay = calcAirTravelKgPerDay(input.airTravelPerYear);
  const total =
    transportKgPerDay + electricityKgPerDay + foodKgPerDay + shoppingKgPerDay + airTravelKgPerDay;
  return (total * 365) / 1000;
}

/** Point thresholds and names for the badge award system. */
export const BADGE_THRESHOLDS = [
  { points: 200, name: "Green Explorer" },
  { points: 500, name: "Tree Saver" },
  { points: 1000, name: "Carbon Ninja" },
  { points: 2000, name: "Sustainability Hero" },
] as const;

/**
 * Returns the names of badges newly earned by crossing from `pointsBefore`
 * to `pointsAfter`, excluding any badges already in `existingBadges`.
 */
export function getNewBadges(
  pointsBefore: number,
  pointsAfter: number,
  existingBadges: string[],
): string[] {
  return BADGE_THRESHOLDS.filter(
    (b) =>
      pointsAfter >= b.points &&
      pointsBefore < b.points &&
      !existingBadges.includes(b.name),
  ).map((b) => b.name);
}
