"use client";

import { useMemo, useRef, useState } from "react";
import {
  calculate,
  money,
  FINISH,
  type BuildType,
  type CalculatorInput,
  type FinishLevel,
  type Inclusion,
  type PropertyType,
  type StateCode,
  type WallType,
} from "@/lib/costModel";
import "./construction-cost-calculator.css";

const CTA_URL = "https://duotax.com.au/initial-cost-report/";

const PROPERTY_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "house", label: "House" },
  { value: "granny", label: "Granny Flat" },
  { value: "townhouse", label: "Townhouse" },
  { value: "apartment", label: "Apartment" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
];

const STATE_OPTIONS: { value: StateCode; label: string }[] = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "Northern Territory" },
];

const BUILD_OPTIONS: { value: BuildType; label: string }[] = [
  { value: "new", label: "New build" },
  { value: "knockdown", label: "Knock-down & rebuild" },
  { value: "reno-light", label: "Renovation — light (≤30% area)" },
  { value: "reno-major", label: "Renovation — major (>30% area)" },
  { value: "extension", label: "Extension / addition" },
  { value: "secondary", label: "Granny flat / secondary dwelling" },
];

const WALL_OPTIONS: { value: WallType; label: string }[] = [
  { value: "brick-veneer", label: "Brick veneer" },
  { value: "double-brick", label: "Double brick" },
  { value: "concrete", label: "Concrete" },
];

const INCLUSION_OPTIONS: { value: Inclusion; label: string; sub: string }[] = [
  { value: "basement", label: "Basement", sub: "Excavation & retention" },
  { value: "elevator", label: "Elevator", sub: "Passenger lift" },
  { value: "ducted", label: "Ducted air-conditioning", sub: "Zoned climate control" },
];

const FINISH_ORDER: FinishLevel[] = ["economy", "standard", "premium", "luxury"];

const YEARS: string[] = (() => {
  const list: string[] = [];
  for (let y = 2026; y >= 1988; y--) list.push(String(y));
  list.push("pre1987");
  return list;
})();

const glyphProps = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PROPERTY_GLYPHS: Record<PropertyType, React.ReactNode> = {
  house: (
    <svg {...glyphProps}>
      <path d="M8 30 32 12 56 30" />
      <path d="M14 27v25h36V27" />
      <path d="M27 52V40h10v12" />
      <rect x="18" y="33" width="8" height="7" rx="1" />
      <rect x="40" y="33" width="6" height="7" rx="1" />
    </svg>
  ),
  granny: (
    <svg {...glyphProps}>
      <path d="M10 32 32 18 54 32" />
      <path d="M16 30v20h32V30" />
      <path d="M28 50V40h8v10" />
      <rect x="19" y="35" width="6" height="6" rx="1" />
      <rect x="39" y="35" width="6" height="6" rx="1" />
    </svg>
  ),
  townhouse: (
    <svg {...glyphProps}>
      <path d="M9 30 20 20 31 30" />
      <path d="M33 30 44 20 55 30" />
      <path d="M13 29v23h38V29" />
      <path d="M32 30v22" />
      <path d="M19 52v-8h6v8" />
      <path d="M39 52v-8h6v8" />
    </svg>
  ),
  apartment: (
    <svg {...glyphProps}>
      <path d="M18 8h28v48H18z" />
      <path d="M18 18h28M18 28h28M18 38h28M18 48h28" />
      <path d="M27 8v48M37 8v48" />
      <path d="M28 56v-6h8v6" />
    </svg>
  ),
  office: (
    <svg {...glyphProps}>
      <path d="M10 16h44v40H10z" />
      <path d="M10 26h44M10 36h44M10 46h44" />
      <path d="M22 16v40M32 16v40M42 16v40" />
      <path d="M28 56v-7h8v7" />
    </svg>
  ),
  warehouse: (
    <svg {...glyphProps}>
      <path d="M6 28 18 16h28l12 12" />
      <path d="M10 28v24h44V28" />
      <path d="M26 52V34h18v18" />
      <path d="M26 40h18M26 46h18" />
    </svg>
  ),
};

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function ConstructionCostCalculator() {
  const areaInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState<CalculatorInput>({
    propertyType: "house",
    state: "NSW",
    year: "2026",
    buildType: "new",
    finish: "standard",
    area: 0,
    wall: "brick-veneer",
    bedrooms: 3,
    storeys: 1,
    inclusions: [],
  });

  const set = <K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const step = (key: "area" | "bedrooms" | "storeys", delta: number, min: number, max: number) =>
    setInput((prev) => ({ ...prev, [key]: Math.max(min, Math.min(max, prev[key] + delta)) }));

  const toggleInclusion = (value: Inclusion) =>
    setInput((prev) => ({
      ...prev,
      inclusions: prev.inclusions.includes(value)
        ? prev.inclusions.filter((i) => i !== value)
        : [...prev.inclusions, value],
    }));

  const result = useMemo(() => calculate(input), [input]);
  const hasEstimate = input.area > 0;

  const propertyLabel = PROPERTY_OPTIONS.find((o) => o.value === input.propertyType)?.label ?? "";
  const stateLabel = STATE_OPTIONS.find((o) => o.value === input.state)?.label ?? input.state;
  const wallLabel = WALL_OPTIONS.find((o) => o.value === input.wall)?.label ?? "";
  const buildLabelVal = BUILD_OPTIONS.find((o) => o.value === input.buildType)?.label ?? "";
  const yearLabel = input.year === "pre1987" ? "before Sept 1987" : input.year;
  const optionsChosen = INCLUSION_OPTIONS.map(
    (o) => `${o.label} ${input.inclusions.includes(o.value) ? "Yes" : "No"}`
  ).join(" · ");

  return (
    <div className="cc">
      <div className="cc-wrap">
        {/* ===== HEADER ===== */}
        <header className="cc-head">
          <div className="cc-brand">
            <span className="cc-logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V8l7-5 7 5v13" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </span>
            <span className="cc-brand-txt">
              <h1>Construction Cost Calculator</h1>
            </span>
          </div>
        </header>

        <p className="cc-intro">
          Estimate indicative construction costs by property type, floor area and finish level. Adjust the
          options below and your estimate updates instantly.
        </p>

        <div className="cc-layout">
          {/* ===== INPUTS ===== */}
          <form className="cc-form" aria-label="Construction details">
            {/* Property type — icon cards */}
            <fieldset className="cc-sec" aria-label="Property type">
              <div className="cc-cards" role="radiogroup" aria-label="Property type">
                {PROPERTY_OPTIONS.map((o) => {
                  const active = input.propertyType === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`cc-card${active ? " is-active" : ""}`}
                      onClick={() => set("propertyType", o.value)}
                    >
                      <span className="cc-card-ico" aria-hidden="true">{PROPERTY_GLYPHS[o.value]}</span>
                      <span className="cc-card-lbl">{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Location & build — selects */}
            <fieldset className="cc-sec" aria-label="Location and build">
              <div className="cc-grid3">
                <div className="cc-field">
                  <label htmlFor="state">State / territory</label>
                  <div className="cc-select">
                    <select id="state" value={input.state} onChange={(e) => set("state", e.target.value as StateCode)}>
                      {STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="cc-field">
                  <label htmlFor="year">Completion year</label>
                  <div className="cc-select">
                    <select id="year" value={input.year} onChange={(e) => set("year", e.target.value)}>
                      {YEARS.map((y) => <option key={y} value={y}>{y === "pre1987" ? "Before September 1987" : y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="cc-field">
                  <label htmlFor="btype">Build type</label>
                  <div className="cc-select">
                    <select id="btype" value={input.buildType} onChange={(e) => set("buildType", e.target.value as BuildType)}>
                      {BUILD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Size & structure */}
            <fieldset className="cc-sec" aria-label="Size and structure">

              <div className="cc-grid3">
                <div className="cc-field">
                  <label htmlFor="area">Floor area</label>
                  <div className="cc-stepper cc-stepper-area">
                    <button type="button" aria-label="Less floor area" onClick={() => step("area", -1, 0, 20000)}>−</button>
                    <div className="cc-stepper-value" onClick={() => areaInputRef.current?.focus()}>
                      <input
                        ref={areaInputRef}
                        id="area"
                        type="number"
                        min={0}
                        max={20000}
                        inputMode="numeric"
                        aria-label="Floor area"
                        value={input.area}
                        onChange={(e) => set("area", e.target.value === "" ? 0 : Math.max(0, Math.min(20000, Number(e.target.value))))}
                      />
                      <span className="cc-stepper-unit">m²</span>
                    </div>
                    <button type="button" aria-label="More floor area" onClick={() => step("area", 1, 0, 20000)}>+</button>
                  </div>
                </div>
                <div className="cc-field">
                  <label htmlFor="bedrooms">Bedrooms</label>
                  <div className="cc-stepper">
                    <button type="button" aria-label="Fewer bedrooms" onClick={() => step("bedrooms", -1, 0, 20)}>−</button>
                    <input
                      id="bedrooms"
                      type="number"
                      min={0}
                      max={20}
                      inputMode="numeric"
                      aria-label="Bedrooms"
                      value={input.bedrooms}
                      onChange={(e) => set("bedrooms", e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                    />
                    <button type="button" aria-label="More bedrooms" onClick={() => step("bedrooms", 1, 0, 20)}>+</button>
                  </div>
                </div>
                <div className="cc-field">
                  <label htmlFor="storeys">Storeys</label>
                  <div className="cc-stepper">
                    <button type="button" aria-label="Fewer storeys" onClick={() => step("storeys", -1, 1, 80)}>−</button>
                    <input
                      id="storeys"
                      type="number"
                      min={1}
                      max={80}
                      inputMode="numeric"
                      aria-label="Storeys"
                      value={input.storeys}
                      onChange={(e) => set("storeys", e.target.value === "" ? 1 : Math.max(1, Number(e.target.value)))}
                    />
                    <button type="button" aria-label="More storeys" onClick={() => step("storeys", 1, 1, 80)}>+</button>
                  </div>
                </div>
              </div>

              <div className="cc-field">
                <label>Wall type</label>
                <div className="cc-seg" role="radiogroup" aria-label="Wall type">
                  {WALL_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={input.wall === o.value}
                      className={`cc-seg-btn${input.wall === o.value ? " is-active" : ""}`}
                      onClick={() => set("wall", o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>

            {/* Finish */}
            <fieldset className="cc-sec" aria-label="Finish level">
              <div className="cc-seg cc-seg-tall" role="radiogroup" aria-label="Finish level">
                {FINISH_ORDER.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={input.finish === key}
                    className={`cc-seg-btn${input.finish === key ? " is-active" : ""}`}
                    onClick={() => set("finish", key)}
                  >
                    <span className="t">{FINISH[key].label}</span>
                    <span className="s">{FINISH[key].sub}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Inclusions — toggles */}
            <fieldset className="cc-sec" aria-label="Inclusions">
              <div className="cc-toggles">
                {INCLUSION_OPTIONS.map((o) => (
                  <label key={o.value} className="cc-toggle">
                    <span className="cc-toggle-txt">
                      <span className="t">{o.label}</span>
                      <span className="s">{o.sub}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={input.inclusions.includes(o.value)}
                      onChange={() => toggleInclusion(o.value)}
                    />
                    <span className="cc-switch" aria-hidden="true" />
                  </label>
                ))}
              </div>
            </fieldset>
          </form>

          {/* ===== BREAKDOWN ===== */}
          <section className="cc-explain" aria-label="How your estimate is calculated">
            <h2>How your estimate is calculated</h2>

            {!hasEstimate ? (
              <p className="cc-lede">Enter your details above to see a step-by-step calculation breakdown.</p>
            ) : (
              <div className="cc-breakdown">
                <div className="cc-blk">
                  <h3>Your inputs</h3>
                  <p className="cc-recap">
                    Type: <strong>{propertyLabel}</strong> · Bedrooms: <strong>{input.bedrooms}</strong> ·
                    Storeys: <strong>{input.storeys}</strong> · Area: <strong>{input.area.toLocaleString()} m²</strong>
                    <br />
                    Wall: <strong>{wallLabel}</strong> · Spec: <strong>{result.finishLabel}</strong> ·
                    Build: <strong>{buildLabelVal}</strong>
                    <br />
                    Location &amp; year: <strong>{stateLabel}, {yearLabel}</strong> (index {result.bci.toFixed(3)})
                    <br />
                    Options chosen: <strong>{optionsChosen}</strong>
                  </p>
                </div>

                <div className="cc-blk">
                  <h3>How we calculated it</h3>
                  <div className="cc-steps">
                    <p>1) Core build cost based on your type, walls, size, bedrooms and storeys.</p>
                    <p>
                      Estimated core (incl. options except elevator) after location/year ={" "}
                      <strong>{money(result.coreAfterBci)}</strong>
                    </p>
                    {result.elevatorAfterBci > 0 ? (
                      <p>
                        2) Elevator allowance after location/year ={" "}
                        <strong>{money(result.elevatorAfterBci)}</strong>
                      </p>
                    ) : null}
                    <p>3) Finish level shown as Low / Selected finish / High.</p>
                  </div>
                </div>

                <div className="cc-blk">
                  <h3>What affects your estimate</h3>
                  <ul className="cc-list">
                    <li>Property type sets a base allowance.</li>
                    <li>Wall type adds to the base (brick veneer / double brick / concrete).</li>
                    <li>Options add to the base: as selected.</li>
                    <li>Storeys and bedrooms apply small multipliers.</li>
                    <li>Floor area scales the whole result.</li>
                    <li>Location &amp; year index ({result.bci.toFixed(3)}) adjusts for local build costs.</li>
                  </ul>
                </div>

                <div className="cc-blk cc-totals">
                  <h3>Totals <span>(ex-GST)</span></h3>
                  <div className="cc-trow"><span>Low (×0.91)</span><span>{money(result.low)}</span></div>
                  <div className="cc-trow is-selected"><span>{result.finishLabel} finish (selected)</span><span>{money(result.selected)}</span></div>
                  <div className="cc-trow"><span>High (×1.09)</span><span>{money(result.high)}</span></div>
                  <p className="cc-gst">Including 10% GST: <strong>{money(result.gstInclusive)}</strong></p>
                </div>
              </div>
            )}
          </section>

          {/* ===== RESULTS ===== */}
          <div className="cc-side">
            <aside className="cc-result" aria-label="Construction cost results">
              <p className="sr-only" role="status" aria-live="polite">{result.announce}</p>
              <div className="cc-result-inner">
                <div className="cc-result-head">
                  <h2>Results</h2>
                  <span aria-hidden="true" />
                </div>

                {!hasEstimate && (
                  <p className="cc-result-empty">Enter the floor area to calculate an indicative range.</p>
                )}

                <div className="cc-result-feature">
                  <span>{hasEstimate ? `${result.finishLabel} finish (selected)` : "Finish (selected)"}</span>
                  <strong>{hasEstimate ? money(result.selected) : "$0"}</strong>
                </div>

                <div className="cc-result-rows">
                  <div className="cc-result-row">
                    <span>Low estimate</span>
                    <strong>{hasEstimate ? money(result.low) : "—"}</strong>
                  </div>
                  <div className="cc-result-row">
                    <span>High estimate</span>
                    <strong>{hasEstimate ? money(result.high) : "—"}</strong>
                  </div>
                </div>

                {hasEstimate && (
                  <p className="cc-result-note">{result.descriptor}</p>
                )}

                <div className="cc-report">
                  <h3>Detailed cost report</h3>
                  <p>Request a reviewed Initial Cost Report with itemised assumptions and supporting detail.</p>
                  <a className="cc-cta" href={CTA_URL} target="_top" rel="noopener">
                    Order Initial Cost Report <Arrow />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
