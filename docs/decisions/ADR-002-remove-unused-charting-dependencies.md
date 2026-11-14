# ADR-002: Remove Unused Charting Dependencies in apps/web

- **Status:** Accepted
- **Deciders:** L5 Frontend (Antigravity), human project lead
- **Date:** 2026-11-14

---

## Context and Problem Statement
The Results page was redesigned and ported using `recharts` for responsive SVG cost breakdown visualization (RFC-01 / PR #21). The legacy packages `chart.js` and `react-chartjs-2` remained in `apps/web/package.json` despite zero usage across the codebase, adding unused weight and maintenance overhead.

## Decision Drivers
- Task T47 requirement: Remove legacy/unused charting packages superseded by Recharts.
- Clean dependencies and smaller bundle/node_modules footprint.
- Zero references to `chart.js` or `react-chartjs-2` across `apps/web/src`.

## Considered Options
1. Retain `chart.js` and `react-chartjs-2` for potential future secondary charts.
2. Remove `chart.js` and `react-chartjs-2` from `apps/web/package.json` and prune `package-lock.json`.

## Decision Outcome
Chosen option: **Option 2**, removing `chart.js` and `react-chartjs-2` from dependencies. `recharts` remains the sole charting library for BuildSmart AI.

### Positive Consequences
- Eliminated unused packages from `package.json` and lockfile.
- No dead charting code in the web client.

### Negative Consequences
- None; `recharts` fully covers all cost visualization requirements.
