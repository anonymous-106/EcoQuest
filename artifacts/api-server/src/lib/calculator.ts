// Pure calculation functions — no Express, no DB, fully unit-testable

export const TRANSPORT_EMISSIONS_KG_PER_KM: Record<string, number> = {
  walking: 0,
  bicycle: 0.02,
  car: 0.21,
  motorcycle: 0.11,
  "public transport": 0.05,
};

export const FOOD_EMISSIONS_KG_PER_DAY: Record<string, number> = {
  vegan: 2.5 / 365,
  vegetarian: 3.8 / 365,
  "non-vegetarian": 7.2 / 365,
};

export const SHOPPING_EMISSIONS_KG_PER_DAY: Record<string, number> = {
  never: 0.1 / 30,
  rarely: 0.3 / 30,
  monthly: 0.8 / 30,
  weekly: 2.1 / 30,
  daily: 4.5 / 30,
};

export const LIFESTYLE_KG_PER_DAY = 0.5;

export function calcTransportKgPerDay(mode: string, dailyKm: number): number {
  const rate = TRANSPORT_EMISSIONS_KG_PER_KM[mode] ?? 0.1;
  return rate * dailyKm;
}

export function calcElectricityKgPerDay(monthlyBill: number): number {
  return (monthlyBill * 0.12) / 30;
}

export function calcFoodKgPerDay(preference: string): number {
  return FOOD_EMISSIONS_KG_PER_DAY[preference] ?? 5 / 365;
}

export function calcShoppingKgPerDay(frequency: string): number {
  return SHOPPING_EMISSIONS_KG_PER_DAY[frequency] ?? 0.5 / 30;
}

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
  dailyKg: number;
  monthlyKg: number;
  annualKg: number;
  impactLevel: "low" | "moderate" | "high";
  breakdown: {
    transportation: number;
    electricity: number;
    food: number;
    shopping: number;
    lifestyle: number;
  };
  comparisons: {
    treesNeeded: number;
    carKm: number;
    householdDays: number;
  };
}

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
      lifestyle: Math.round(LIFESTYLE_KG_PER_DAY * 365 * 100) / 100,
    },
    comparisons: {
      treesNeeded: Math.round(annualTons / 0.022),
      carKm: Math.round(annualKg / 0.21),
      householdDays: Math.round(annualKg / (8.9 / 365)),
    },
  };
}

export function calculateCarbonScore(input: Omit<FootprintInput, "airTravelPerYear"> & { airTravelPerYear: number }): number {
  const transportKgPerDay = calcTransportKgPerDay(input.transportation, input.dailyTravelKm);
  const electricityKgPerDay = calcElectricityKgPerDay(input.electricityBill);
  const foodKgPerDay = calcFoodKgPerDay(input.foodPreference);
  const shoppingKgPerDay = calcShoppingKgPerDay(input.shoppingFrequency);
  const airTravelKgPerDay = calcAirTravelKgPerDay(input.airTravelPerYear);
  const total = transportKgPerDay + electricityKgPerDay + foodKgPerDay + shoppingKgPerDay + airTravelKgPerDay;
  return (total * 365) / 1000;
}

export const BADGE_THRESHOLDS = [
  { points: 200, name: "Green Explorer" },
  { points: 500, name: "Tree Saver" },
  { points: 1000, name: "Carbon Ninja" },
  { points: 2000, name: "Sustainability Hero" },
] as const;

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
