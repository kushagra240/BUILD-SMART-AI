# ADR-001: Adopt the landing-page export as the app-wide design language

- **Status:** Accepted (implemented in lane L5)
- **Deciders:** L5 (OpenCode, DeepSeek V4.1 Flash) on behalf of the human owner
- **Date:** 2026-11-13

---

## Context and Problem Statement

`references/frontend-design.md` §2 described a warm cream/brick editorial language
(Fraunces, Instrument Sans, `paper #F6F1E7`, `brick #B4472B`). That language was
never implemented beyond the first landing draft. The owner then supplied a Figma
Make export of the landing page (`kushagra240/buildui`) and asked for its design
language to be applied consistently across every view of the app.

Two design languages cannot both be "exactly the tokens" that T40 requires, so one
had to be chosen before the UI rollout could be completed.

## Decision Drivers

- The owner supplied a concrete, complete landing frame and asked for it to be
  extrapolated to the rest of the app.
- The export is internally consistent (palette, type scale, card and CTA motifs),
  so the remaining screens can be derived from it without inventing a second system.
- One palette token set is cheaper to maintain than a second parallel one.

## Considered Options

1. Keep the cream/brick editorial language and restyle the landing page back to it.
2. Adopt the export's slate/blue language and apply it to every view.

## Decision Outcome

Chosen option: **2**, because the owner explicitly directed the rollout and the
export is the only design artefact available (no Results/Wizard/Dashboard frames
exist in any commit of the export, so those screens are extrapolated from the
landing page's primitives).

Concretely, tokens now implemented in `apps/web/tailwind.config.js`:
`paper #F2F4F7`, `paper-deep #E8ECF2`, `panel #FBFCFE`, `night #151820`,
`accent #315EFB` (`soft #E8EDFF`), `line #DCE1E8`, `ink #17191F`, `ink-soft #747C88`,
category ramp `foundation #151820`, `structure #315EFB`, `masonry #6685F4`,
`roofing #2455E6`, `flooring #8FA8F5`, `plumbing #8F98A8`, `electrical #B7C2D8`,
`finishing #5C6470`, `labour #AFC4FB`. Typography is Manrope for UI/headlines and
IBM Plex Mono for figures. The legacy names `brick`, `forest`, `clay` and `ochre`
are kept as aliases so untouched screens do not break, and now resolve to the new
palette.

Shared primitives live in `apps/web/src/index.css` (`.app-surface`, `.surface-card`,
`.surface-card-interactive`, `.btn-primary`, `.btn-ghost`, `.field-input`,
`.eyebrow`, `.section-title`, `.focus-ring`) and
`apps/web/src/components/layout/AuthShell.tsx` (the dark accent-lit slab reused by
login and register).

### Positive Consequences

- Every screen shares one card, button, focus and palette vocabulary.
- T40 can be judged against the export that actually exists.

### Negative Consequences

- `references/frontend-design.md` §2 had to be rewritten to match reality; the
  Fraunces/cream guidance is no longer valid.
- The "no blue gradients / no glassmorphism" line in that reference no longer
  describes the accent-lit dark slabs, which are part of the supplied export.
- `chart.js`/`react-chartjs-2` remain installed but unused; the results chart now
  uses `recharts` (RFC-01), so the removal of `chart.js` is a separate cleanup.
