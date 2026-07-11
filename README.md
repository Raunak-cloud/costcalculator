# Construction Cost Calculator — Duo Tax

A redesign of the Duo Tax [Construction Cost Calculator](https://duotax.com.au/construction-cost-calculator/),
rebuilt as a modern, accessible, responsive component to a standard suitable for a major financial
institution. Built with **Next.js (App Router) + TypeScript**.

Users estimate indicative construction costs from property type, floor area, finish level and other
factors, and see a transparent, live line-item breakdown of how the estimate is reached.

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (typechecks + lints)
```

Requires Node 18.18+ (developed on Node 20+).

---

## How the brief is met

| Requirement                                         | Where                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modern, professional, financial-institution quality | Two-pane layout, sticky live result, restrained navy/gold system, dark mode                                                                                                               |
| **All original calculation fields retained**        | Property type, completion year, state, build type, finish level, floor area, bedrooms, storeys, wall type, and the three inclusions (basement, elevator, ducted A/C)                      |
| **CTA / button**                                    | "Order Initial Cost Report" → `duotax.com.au/initial-cost-report/`                                                                                                                        |
| **"How your estimate is calculated" section**       | Shows an "Enter your details above…" prompt until a floor area is entered, then a plain-language breakdown — _Your inputs_, _What affects your estimate_, and _Totals_ (ex-GST + 10% GST) |
| Desktop + mobile responsive                         | Two columns → single column at 880px; controls reflow at 560px                                                                                                                            |

---

## Project structure

```
app/
  layout.tsx        Root layout + document metadata
  page.tsx          Hosts the calculator
  globals.css       Minimal reset
components/
  ConstructionCostCalculator.tsx   Client component (UI, state, SVG illustrations)
  construction-cost-calculator.css Scoped styles (all rules namespaced under .cc)
lib/
  rates.ts          ← ALL dollar figures & multipliers live here (single source of truth)
  costModel.ts      Pure calculation logic (framework-agnostic, testable)
```

**Separation of concerns** is deliberate: the numbers (`rates.ts`), the maths
(`costModel.ts`) and the view (`components/`) are independent. `costModel.ts` imports no React
and can be unit-tested in isolation.

---

## Calculation methodology

This uses **Duo Tax's own formula and datasets**, extracted from the live calculator's page
JavaScript so the redesign reproduces its figures exactly. Base, wall and option values are
"points" per m²; the result comes out in AUD:

```
core points/m² = property base (house 1560, granny 1615, townhouse 1665,
                                 apartment 1410, office 940, warehouse 590)
               + wall (brick veneer 140 / double brick 180 / concrete 220)
               + basement 105 + ducted 255   (per m², if selected)

base (ex-lift) = core points/m²
               × (1 + 0.04 per storey above the first)        (capped at 8+ storeys)
               × (1 + bedroom factor:  1→−8% … 3→0% … 5+→+8%)
               × floor area

+ elevator     = 100,000 + 9,500 × storey-offset              (lump sum, if selected)

baseCalc       = (base + elevator) × BCI(state, year)         (per-state Building Cost Index)

Low  = baseCalc × 0.91     Mid = baseCalc × 1.00     High = baseCalc × 1.09
Finish tier: economy → Low · standard → Mid · premium/luxury → High
GST-inclusive = selected × 1.10
```

Verified against the live site: NSW, 2025 → BCI **1.373**, core **$5,358,669**, Low **$4,876,389**,
High **$5,840,950** — matching to the dollar.

Two faithful quirks carried over from the source model: **build type is captured but does not
change the estimate** (it feeds the Initial Cost Report), and **premium and luxury map to the same
High tier**.

The "How your estimate is calculated" section starts with an **empty prompt** and, once a floor
area is entered, lists the inputs used, how the core figure was reached, plain-language notes on
what drives the figure, and the ex-GST / GST-inclusive totals — so the estimate is never a black box.

### About the rate figures

The values in [`lib/rates.ts`](lib/rates.ts) — base points, wall/option loadings and the full
per-state **BCI datasets** — are Duo Tax's actual figures. They are isolated in that one file, so if
Duo Tax revises a rate or adds a year to the index, it's a one-line data change with no impact on the
calculation logic or UI.

---

## Accessibility (WCAG 2.1 AA)

Treated as a hard requirement, as a financial institution would:

- **Colour contrast** — every text/background pairing measured to ≥ 4.5:1 (normal text) in both
  light and dark themes; muted tokens were darkened/lightened accordingly.
- **No colour-only cues** — the selected finish is shown by an accent ring + raised card, not colour
  alone; checkboxes show a tick, not just a fill.
- **Keyboard** — all controls operable and focus-visible with a clear outline.
- **Screen readers** — the estimate is announced through a single polite live region
  (`role="status"`) as a plain sentence ("Estimated construction cost $X for a standard finish;
  range $Y to $Z…") rather than re-reading the whole card; the finish radiogroup is properly
  labelled; decorative SVGs are `aria-hidden`.
- **Motion** — all transitions disabled under `prefers-reduced-motion`.

---

## Design & technical decisions

- **Next.js App Router + TypeScript** — server-rendered, statically optimised, fully typed.
- **Scoped plain CSS over a utility framework** — the design leans on CSS custom-property tokens
  (enabling the light/dark theming) and structural selectors; a namespaced stylesheet keeps it
  self-contained and easy to embed.
- **System font stack, no font CDN** — no external network dependency or layout shift. (A licensed
  brand typeface can be dropped in via `@font-face` for production.)
- **Data-driven SVG illustration** — the blueprint banner shows a line-art illustration that changes
  with the selected property type; it reflects state rather than being fixed decoration. All inline
  SVG, so it themes automatically and needs no image assets.
- **Theming** — `prefers-color-scheme` with `data-theme` overrides, so it can be forced light/dark
  by a host site.

---
