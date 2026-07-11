// Pure construction-cost calculation, reproducing the live Duo Tax formula.
// All numeric inputs (rates, points, BCI datasets) live in `rates.ts`.

import {
  ADDON_POINTS,
  ELEVATOR,
  FINISH,
  GST_RATE,
  PROPERTY_BASE,
  PROPERTY_LABEL,
  RANGE,
  STOREY_STEP,
  WALL_POINTS,
  bedroomFactor,
  getBCI,
  storeyOffset,
  type BuildType,
  type FinishLevel,
  type FinishTier,
  type Inclusion,
  type PropertyType,
  type StateCode,
  type WallType,
} from "./rates";

// Re-export what the UI needs from one place (`@/lib/costModel`).
export {
  PROPERTY_BASE,
  WALL_POINTS,
  FINISH,
  BUILD_LABEL,
  PROPERTY_LABEL,
  getBCI,
} from "./rates";
export type {
  PropertyType,
  FinishLevel,
  BuildType,
  StateCode,
  WallType,
  Inclusion,
  FinishTier,
} from "./rates";

export interface CalculatorInput {
  propertyType: PropertyType;
  state: StateCode;
  /** Four-digit year as string, or "pre1987" for before September 1987. */
  year: string;
  buildType: BuildType;
  finish: FinishLevel;
  /** Gross floor area in m². 0 means "not entered yet". */
  area: number;
  wall: WallType;
  bedrooms: number;
  storeys: number;
  inclusions: Inclusion[];
}

export interface CalculatorResult {
  finishLabel: string;
  finishTier: FinishTier;
  bci: number;
  /** Core build cost (options except elevator) after location/year, rounded. */
  coreAfterBci: number;
  elevatorAfterBci: number;
  /** Low / midpoint / high, ex-GST. */
  low: number;
  mid: number;
  high: number;
  /** The figure for the selected finish tier (low/mid/high). */
  selected: number;
  /** Selected figure including 10% GST. */
  gstInclusive: number;
  /** Position of the selected tier within [low, high], 0–1, for the meter. */
  tierPosition: number;
  announce: string;
  descriptor: string;
}

const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});
export const money = (n: number) => AUD.format(Math.round(n));

export function calculate(input: CalculatorInput): CalculatorResult {
  const finish = FINISH[input.finish];
  const bci = getBCI(input.state, input.year);

  const area = Math.max(0, input.area || 0);
  const floors = Math.max(1, Math.min(50, input.storeys || 1));
  const offset = storeyOffset(floors);
  const bedF = bedroomFactor(input.bedrooms);

  const base = PROPERTY_BASE[input.propertyType] || 0;
  const wall = WALL_POINTS[input.wall]?.points || 0;
  const has = (k: Inclusion) => input.inclusions.includes(k);
  const basement = has("basement") ? ADDON_POINTS.basement.points : 0;
  const ducted = has("ducted") ? ADDON_POINTS.ducted.points : 0;

  const baseWithoutElevator =
    (base + wall + basement + ducted) *
    (1 + offset * STOREY_STEP) *
    (1 + bedF) *
    area;
  const elevatorAllowance = has("elevator") ? ELEVATOR.base + offset * ELEVATOR.perStorey : 0;

  const baseCalc = (baseWithoutElevator + elevatorAllowance) * bci;

  const low = Math.round(baseCalc * RANGE.low);
  const mid = Math.round(baseCalc * RANGE.mid);
  const high = Math.round(baseCalc * RANGE.high);

  const selected = finish.tier === "low" ? low : finish.tier === "high" ? high : mid;
  const gstInclusive = Math.round(selected * (1 + GST_RATE));
  const tierPosition = high > low ? (selected - low) / (high - low) : 0;

  const coreAfterBci = Math.round(baseWithoutElevator * bci);
  const elevatorAfterBci = Math.round(elevatorAllowance * bci);

  const yearTxt = input.year === "pre1987" ? "pre-1987" : input.year;
  const areaTxt = area ? area.toLocaleString() : "0";
  const descriptor = `Based on a ${areaTxt} m² ${PROPERTY_LABEL[input.propertyType]}, ${finish.label.toLowerCase()} finish, completed ${yearTxt}.`;
  const announce = area
    ? `Estimated construction cost ${money(selected)} for a ${finish.label.toLowerCase()} finish; range ${money(low)} to ${money(high)}. ${descriptor}`
    : "Enter your floor area above to see your estimate.";

  return {
    finishLabel: finish.label,
    finishTier: finish.tier,
    bci,
    coreAfterBci,
    elevatorAfterBci,
    low,
    mid,
    high,
    selected,
    gstInclusive,
    tierPosition,
    announce,
    descriptor,
  };
}
