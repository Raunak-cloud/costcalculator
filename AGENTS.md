<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` — dev server at localhost:3000
- `npm run build` — production build (runs typecheck + lint)
- `npm run lint` — eslint only
- No test framework configured

## Architecture

Single-page calculator app. Clean three-layer separation:

- `lib/rates.ts` — all dollar figures, multipliers, type definitions (single source of truth for data)
- `lib/costModel.ts` — pure calculation logic, no React imports, framework-agnostic
- `components/ConstructionCostCalculator.tsx` — single client component with all UI + state

`costModel.ts` re-exports types and tables from `rates.ts`, so components import everything from `@/lib/costModel`.

## Key conventions

- Client component (`"use client"`) — the calculator uses `useState`/`useMemo`
- Scoped CSS in `components/construction-cost-calculator.css` (namespace: `.cc`)
- Path alias: `@/*` maps to project root
- To update rates: edit `lib/rates.ts` only — no UI or calculation code changes needed
