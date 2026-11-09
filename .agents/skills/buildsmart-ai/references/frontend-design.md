# Frontend and design

Contents: 1 stack, 2 design language, 3 pages and routes, 4 behaviour rules, 5 mock mode, 6 accessibility, 7 known gaps, 8 testing.

## 1. Stack (apps/web)

React 18, TypeScript (strict), Vite 6, React Router 6, Tailwind CSS v3 (stay on v3, decision D-06), Zod for forms in login and register. `chart.js` and `react-chartjs-2`, `@tanstack/react-query` and `react-hook-form` are installed but were **not used** at last review: either use them as planned or remove them in a separate PR. The API client is a typed `fetch` wrapper in `src/services/apiClient.ts` with the access token in memory. API types are generated (`src/types/api.generated.ts`, never hand-edited).

## 2. Design language (from the owner's Figma; Figma MCP is not available on the free plan, so work from screenshots plus these tokens)

Feel: warm, trustworthy, grounded, like an architect's notebook on cream paper. Editorial, asymmetric layouts, generous whitespace. **Not** generic AI styling.

Never use: purple or blue gradients, glassmorphism, neon glows, blurred blobs, 3D orbs, emoji as icons, sparkle or robot imagery, "AI-powered" badges, uniform pill cards, centred-everything layouts, lorem ipsum, hype words (revolutionary, seamless, unlock, leverage).

Colour tokens (define as Tailwind theme colours and CSS variables; use exactly):
`paper #F6F1E7` (background), `paper-deep #EBE2D0` (panels), `ink #1F2421` (text), `ink-soft #5A615C`, `brick #B4472B` (primary accent), `forest #1F4D45` (secondary), `ochre #D9A441` (fills only, never text on paper), `clay #E8DCC7`, `success #3F7D4E`, `warning #C98B2B`, `error #A32D2D`. Hairline borders: ink at 14 percent opacity.
Chart colours for the 9 categories: Foundation `#6B4F3A`, Structure `#1F4D45`, Masonry `#B4472B`, Roofing `#8A6FA0`, Flooring `#D9A441`, Plumbing `#4F86A6`, Electrical `#9BB05A`, Finishing `#D88C9A`, Labour `#3A3F3C`. Always label directly or add patterns; never rely on colour alone.
Fonts (Google Fonts with fallbacks, `font-display: swap`): **Fraunces** for headlines and big numbers, **Instrument Sans** for UI and body, **IBM Plex Mono** (tabular numerals) for figures and IDs. Not Inter, not Roboto.
Shape and motion: radii 6 to 10 px mixed with some sharp corners; focus ring 2 px forest with 2 px offset; restrained motion.
Motifs, used sparingly: dimension lines with end ticks and small mono labels, single-stroke line drawings of houses (landing, empty states, 404), a very faint survey grid on the hero only.
Copy: plain, warm, specific. Currency in Indian format (`Intl.NumberFormat('en-IN')`, rupee sign, lakh/crore shorthand with exact value in tables). Square feet are the primary unit.

## 3. Pages and routes (target)

`/` landing; `/login`, `/register`; `/app` dashboard (recent projects); `/app/new` **4-step wizard** (Basics -> Location and quality -> Budget (optional) -> Review); `/app/estimates/:id` results; `/app/projects`, `/app/projects/:id` (history, compare two estimates, rename, delete); `/app/profile`; `/methodology`; `/materials`; `/privacy`; `*` 404.
Results page must show: headline estimate in Fraunces with range and confidence label; metric cards (cost per sq ft, confidence, budget status); 9-category doughnut with a table toggle; breakdown table (mono figures); materials per category (primary, alternative, one-line reason); budget verdict; drivers; Download PDF and Save; footer with engine and dataset version; the disclaimer; and the MOCK/DEV badge whenever `is_mock` is true.

## 4. Behaviour rules

- The UI computes **nothing** about cost. It collects input, calls the API, displays the result. No client-side rate tables, no fake multipliers.
- Zone, tier, ranges and options come from `/meta/options`. Do not hard-code them. (Known bug: wizard hard-codes zone `pune_west`, bedrooms 3.)
- The whole app must read category names from one shared list that matches the API.
- Every async view has loading, empty and error states with retry.
- Auth: in-memory access token, silent refresh (single-flight), route guards for `/app/*`, real logout that calls the API and clears state. No hard-coded user.
- Never show a bare single number: always range and confidence. Never present mock numbers without the badge.
- Do not claim accuracy anywhere in copy. Say "calculated from published rates; validation in progress" while that is true.

## 5. Mock mode

`VITE_USE_MOCK=true` makes the app run entirely on the typed mock layer with no backend (needed for demos and for parallel work). Mock data must be obviously fake round placeholders, visibly badged, and structurally identical to the OpenAPI response so swapping to the real API changes nothing. Mock handlers live in `src/mocks/` (or `src/services/mockApi.ts`); keep one set only.

## 6. Accessibility and performance

Target WCAG 2.1 AA: keyboard navigation, visible focus, semantic landmarks, `aria-live` for results, contrast 4.5:1, touch targets 44 px, responsive at 360, 768, 1280. Charts need a data-table alternative. **jsdom axe tests cannot check colour contrast** (canvas is not implemented), so never claim AA from them; verify in a real browser with axe and Lighthouse (targets 90 or more) before claiming anything.

## 7. Known gaps at last review (verify)

Wizard has 2 form steps, not 4; zone and rooms hard-coded; walling/flooring choices collected but not sent; the indicative total preview uses different rates from the results page; results read from router state and silently regenerate a default estimate if absent; "Save project" toggles local state only; "Download PDF" opens a static print page; saved projects and project detail are hard-coded and ignore the URL id; navbar shows a fake user and logout does not call the API; no route guards; no materials shown on results; Chart.js not rendered (a CSS bar is used); three different category name sets and three rate tables across the UI, mock API and methodology page; no profile page; Figma restyle status unknown.

## 8. Testing

`apps/web`: `npm run lint` (max warnings 0), `npm run typecheck`, `npm test -- --run` (Vitest and Testing Library), `npm run build`. Add a render test per screen, tests for the wizard validation, the results mapping, the auth interceptor and route guards. Playwright e2e (register, login, estimate, results, PDF, delete) belongs to lane L6. Do not weaken lint to pass.
