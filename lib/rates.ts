/**
 * ============================================================================
 *  CONSTRUCTION COST RATE SCHEDULE  —  Duo Tax's real model
 * ============================================================================
 *
 *  These figures are the ACTUAL rates and Building Cost Index (BCI) datasets
 *  used by the live Duo Tax calculator at
 *  https://duotax.com.au/construction-cost-calculator/, extracted from that
 *  page's own JavaScript so this redesign reproduces its numbers exactly.
 *
 *  All property/wall/option figures are "points" per m²; the result comes out
 *  in AUD after the base is scaled by storeys, bedrooms, floor area and the
 *  state/year BCI. Update any value here without touching the calculation
 *  logic in `costModel.ts`.
 */

export type PropertyType =
  | "house"
  | "granny"
  | "townhouse"
  | "apartment"
  | "office"
  | "warehouse";

export type FinishLevel = "economy" | "standard" | "premium" | "luxury";

export type BuildType =
  | "new"
  | "knockdown"
  | "reno-light"
  | "reno-major"
  | "extension"
  | "secondary";

export type StateCode = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

export type WallType = "brick-veneer" | "double-brick" | "concrete";

export type Inclusion = "basement" | "elevator" | "ducted";

export type FinishTier = "low" | "mid" | "high";

/** GST added on top for the GST-inclusive figure (Australia, 10%). */
export const GST_RATE = 0.1;

/** Base points per m² by property type. */
export const PROPERTY_BASE: Record<PropertyType, number> = {
  house: 1560,
  granny: 1615,
  townhouse: 1665,
  apartment: 1410,
  office: 940,
  warehouse: 590,
};

/** Wall-construction points added to the base. */
export const WALL_POINTS: Record<WallType, { points: number; label: string }> = {
  "brick-veneer": { points: 140, label: "Brick veneer" },
  "double-brick": { points: 180, label: "Double brick" },
  concrete: { points: 220, label: "Reinforced concrete" },
};

/**
 * Optional inclusions. `basement` and `ducted` add points/m² to the base;
 * `elevator` is a separate lump sum (base + per storey-offset).
 */
export const ADDON_POINTS: Record<
  Exclude<Inclusion, "elevator">,
  { points: number; label: string }
> = {
  basement: { points: 105, label: "Basement" },
  ducted: { points: 255, label: "Ducted air-conditioning" },
};

export const ELEVATOR = { base: 100000, perStorey: 9500, label: "Elevator" };

/** Finish level selects a tier within the ±9% band (it doesn't scale the base). */
export const FINISH: Record<
  FinishLevel,
  { label: string; sub: string; tier: FinishTier }
> = {
  economy: { label: "Economy", sub: "Low", tier: "low" },
  standard: { label: "Standard", sub: "Mid", tier: "mid" },
  premium: { label: "Premium", sub: "High", tier: "high" },
  luxury: { label: "Luxury", sub: "High", tier: "high" },
};

/**
 * Build type — retained as an input for parity with the original form, but (as in
 * the live Duo Tax calculator) it does not change the estimate; it is captured for
 * the Initial Cost Report.
 */
export const BUILD_LABEL: Record<BuildType, string> = {
  new: "New build",
  knockdown: "Knock-down & rebuild",
  "reno-light": "Renovation — light (≤30% area)",
  "reno-major": "Renovation — major (>30% area)",
  extension: "Extension / addition",
  secondary: "Granny flat / secondary dwelling",
};

/** Storey premium: +4% per storey above the first, capped at an offset of 10 (8+ storeys). */
export const STOREY_STEP = 0.04;
export function storeyOffset(floors: number): number {
  const n = Math.max(1, Math.floor(floors || 1));
  return n >= 8 ? 10 : Math.max(0, n - 1);
}

/** Bedroom loading, applied as (1 + factor). Clamped to 1–5 bedrooms. */
export function bedroomFactor(bedrooms: number): number {
  const b = Math.max(1, Math.min(5, Number(bedrooms || 0)));
  if (b === 1) return -0.08;
  if (b === 2) return -0.04;
  if (b === 3) return 0;
  if (b === 4) return 0.04;
  return 0.08;
}

/** Indicative range around the point estimate (Low / Mid / High). */
export const RANGE = { low: 0.91, mid: 1.0, high: 1.09 } as const;

export const PROPERTY_LABEL: Record<PropertyType, string> = {
  house: "house",
  granny: "granny flat",
  townhouse: "townhouse",
  apartment: "apartment",
  office: "office",
  warehouse: "warehouse",
};

/**
 * Building Cost Index per state/territory. Index = clamp(year - 1987, 0, 39);
 * position 0 = "before September 1987". Values are Duo Tax's own datasets
 * (BCI = 1.00 around 2017). VIC and TAS share the same series in the source.
 */
export const BCI: Record<StateCode, number[]> = {
  ACT: [0, 0.4864, 0.5179, 0.5459, 0.5879, 0.6089, 0.6159, 0.6124, 0.6124, 0.6177, 0.6387, 0.6562, 0.6597, 0.6684, 0.6754, 0.6877, 0.7017, 0.7419, 0.7871, 0.8322, 0.8933, 0.9484, 1.0009, 1.0219, 1.0297, 1.0569, 1.0831, 1.0954, 1.1164, 1.1479, 1.168, 1.1925, 1.2178, 1.2581, 1.2992, 1.3403, 1.4024, 1.4706, 1.5416, 1.6098, 1.6737],
  NSW: [0, 0.4147, 0.4637, 0.5004, 0.5337, 0.5284, 0.5109, 0.5144, 0.5144, 0.5389, 0.5512, 0.5599, 0.5687, 0.5862, 0.6177, 0.6247, 0.6422, 0.6719, 0.7024, 0.7328, 0.7725, 0.8058, 0.8434, 0.8521, 0.8548, 0.867, 0.8854, 0.8985, 0.9169, 0.9545, 1.0, 1.0157, 1.056, 1.1006, 1.1531, 1.1776, 1.2397, 1.3158, 1.3727, 1.4593, 1.5241],
  NT: [0, 0.3815, 0.4129, 0.4427, 0.4707, 0.4969, 0.5039, 0.5074, 0.5144, 0.5214, 0.5442, 0.5582, 0.5669, 0.5739, 0.5949, 0.6124, 0.6282, 0.6544, 0.6985, 0.7426, 0.8058, 0.86, 0.9186, 0.9484, 0.9755, 0.9895, 0.972, 0.965, 0.9746, 0.9904, 0.9974, 1.0184, 1.0464, 1.0761, 0.9858, 1.0386, 1.1401, 1.2102, 1.2724, 1.3598, 1.4307],
  QLD: [0, 0.3535, 0.3867, 0.4322, 0.4637, 0.4584, 0.4444, 0.4497, 0.4567, 0.4777, 0.4532, 0.4584, 0.4584, 0.4602, 0.5092, 0.5074, 0.5162, 0.5774, 0.6765, 0.7755, 0.8618, 0.9116, 0.972, 0.9895, 0.965, 0.9484, 0.9598, 0.9633, 0.9799, 1.007, 1.0752, 1.1102, 1.1391, 1.168, 1.1864, 1.2091, 1.314, 1.4514, 1.5836, 1.7078, 1.839],
  SA: [0, 0.3815, 0.4129, 0.4427, 0.4707, 0.4969, 0.5039, 0.5074, 0.5144, 0.5214, 0.5442, 0.5582, 0.5669, 0.5739, 0.5949, 0.6124, 0.6282, 0.6544, 0.6985, 0.7426, 0.8058, 0.86, 0.9186, 0.9484, 0.9755, 0.9895, 0.972, 0.965, 0.9746, 0.9904, 0.9974, 1.0184, 1.0464, 1.0761, 0.9858, 1.0386, 1.1401, 1.2102, 1.2724, 1.3598, 1.4307],
  TAS: [0, 0.4759, 0.5144, 0.5144, 0.5144, 0.5144, 0.4847, 0.4619, 0.4619, 0.4759, 0.4882, 0.5022, 0.5074, 0.5214, 0.5652, 0.5809, 0.6107, 0.6439, 0.6758, 0.7076, 0.7515, 0.7857, 0.8215, 0.8416, 0.8565, 0.8854, 0.9046, 0.9143, 0.9283, 0.9493, 0.9851, 1.0166, 1.0472, 1.0796, 1.1111, 1.1566, 1.2388, 1.3219, 1.3911, 1.4462, 1.5109],
  VIC: [0, 0.4759, 0.5144, 0.5144, 0.5144, 0.5144, 0.4847, 0.4619, 0.4619, 0.4759, 0.4882, 0.5022, 0.5074, 0.5214, 0.5652, 0.5809, 0.6107, 0.6439, 0.6758, 0.7076, 0.7515, 0.7857, 0.8215, 0.8416, 0.8565, 0.8854, 0.9046, 0.9143, 0.9283, 0.9493, 0.9851, 1.0166, 1.0472, 1.0796, 1.1111, 1.1566, 1.2388, 1.3219, 1.3911, 1.4462, 1.5109],
  WA: [0, 0.3972, 0.4147, 0.4514, 0.4847, 0.4899, 0.4899, 0.4899, 0.4917, 0.4934, 0.5039, 0.5179, 0.5284, 0.5389, 0.5512, 0.5459, 0.5547, 0.5897, 0.65, 0.7104, 0.811, 0.9055, 0.9991, 1.035, 0.993, 0.9851, 1.0061, 1.0175, 1.0271, 1.0455, 1.0359, 1.0324, 1.0306, 1.0289, 1.0341, 1.0656, 1.1304, 1.2066, 1.2758, 1.3474, 1.4174],
};

/** BCI multiplier for a state and completion year ("pre1987" → before Sept 1987). */
export function getBCI(state: StateCode, year: string): number {
  const arr = BCI[state] ?? BCI.NSW;
  let idx: number;
  if (year === "pre1987") idx = 0;
  else {
    const y = parseInt(year, 10);
    idx = Number.isFinite(y) ? Math.max(0, Math.min(39, y - 1987)) : 30;
  }
  const v = arr[idx];
  return Number.isFinite(v) ? v : 1;
}
