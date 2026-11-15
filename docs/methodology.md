# BuildSmart AI Methodology & Honest Limitations

## How estimates are produced

BuildSmart AI produces **preliminary, indicative planning baselines** for residential construction in Pune and surrounding areas. It is **not** an ML-first system. The estimate is built bottom-up the way a quantity surveyor builds one: work items → quantities → sourced unit rates → rules → category totals. Machine learning is a secondary calibration layer for the estimate range, never the source of the headline number.

### 1. Quantities

For each estimate the engine derives quantities for the standard residential work items (foundation excavation, PCC, RCC, steel reinforcement, brickwork, roofing, flooring, plumbing, finishing and electrical mandays) from the built-up area, floors, bedrooms and bathrooms. These quantities use **standard residential engineering heuristics**. They have not yet been reviewed by a civil engineer, so they are labelled as assumptions in the engine's confidence reason, not as measured facts.

### 2. Pricing from sourced rates

Each work item is priced with a **completed item rate** from the `rates` schema, loaded from the **Maharashtra PWD State Schedule of Rates 2022-23 (Civil)** (`SRC-01` in `data/rates`). Each rate carries its `source_id`, page reference and status. Labour rates come from Maharashtra minimum-wage notifications (`SRC-02`/`SRC-03` in `data/rates`).

Pricing applies two rule-based adjustments before category totals:

- **Zone selection** — the location maps to a rates zone (`ZN-PMC`, `ZN-PCMC`, `ZN-CANT`, `ZN-COUNCIL`, `ZN-OTHER`). The zone selects the applicable minimum-wage labour rate; the PWD SSR work-item rates themselves are statewide.
- **Floor lift** — SSR rules R04–R07 (1% for floor 1, 2% for floor 2, 3% for floor 3, 4% for floor 4 and above), blended across the upper floors.

If a required work item, zone or labour rate is missing, the engine **refuses to calculate** and names the missing value. It does not fall back to a guessed rate.

### 3. Quality tiers

The tier modifies finish-related work items (flooring, finishing, plumbing) and the electrical materials allowance:

| Tier | Multiplier |
|---|---|
| Economy | `1.0` |
| Standard | `1.15` |
| Premium | `1.35` |

These multipliers are **code-level planning assumptions**, not sourced market rates. Premium-tier calibration against verified Pune contractor rates remains `TODO(data)`.

### 4. Nine-category breakdown

Every estimate is allocated across the nine agreed categories:

1. Foundation
2. Structure
3. Masonry
4. Roofing
5. Flooring
6. Plumbing
7. Electrical
8. Finishing
9. Labour

The Labour category is the **sum of the labour components** of all priced items, so labour is not counted twice inside the other eight categories. Category amounts are integers distributed with largest-remainder rounding and they sum **exactly** to the P50 total.

### 5. Range and confidence

- The bottom-up P50 total is the headline figure.
- The engine starts the range at `0.90 × P50` to `1.15 × P50`.
- A **secondary ML calibration** (scikit-learn `RandomForestRegressor`) predicts a variance percentage from built-up area, floors, quality tier and zone, clipped to 5–30%. It adjusts **P10/P90 and the budget assessment only**; it never changes P50 or the category amounts. When no model file is present, the variance falls back to a fixed 10% planning assumption.
- The confidence label is a fixed **Medium** with a reason string generated from the inputs. It is a planning statement, not a measured statistical confidence interval.

### 6. Pune market calibration

After the bottom-up calculation, a flat **`2.85x` Pune market multiplier** (`PUNE_MARKET_MULTIPLIER` in `apps/api/app/services/estimation.py`) is applied to every category amount and to P10/P90. P50 is then recomputed as the sum of the calibrated categories so the breakdown and total cannot drift apart.

**This multiplier is a planning assumption.** It has not yet been validated against real Pune projects or contractor quotations, and it is not a sourced row in the rates database. All outputs are therefore **indicative planning baselines**, not market rates or quotations.

## Role of machine learning

There is no public, labelled dataset of Pune house specifications paired with true construction costs. Until such records exist:

- ML is used **only** to calibrate the P10/P90 spread and the budget band, as described above.
- ML does **not** produce the headline cost or the category breakdown.
- No accuracy metric (MAE, RMSE, MAPE, R²) is claimed for the product, because no real-project validation set exists yet. Headline accuracy will be reported only from a script run on real completed projects, and only in a model card.
- Generated or synthetic data may be used to exercise code and invariants, but it can never prove accuracy.
- The shipped calibration model (`apps/api/ml/ml_model.pkl`) is trained on **synthetic estimates** generated from the bottom-up engine (`apps/api/ml/train_model.py`, `synthetic_estimates.csv`). The fit statistics recorded in `apps/api/ml/model_meta.json` describe that generated dataset only and are **not** a real-world accuracy claim.

Real Pune project records, verified contractor per-square-foot rates and the related dataset/model cards remain `TODO(data)`.

## Data provenance

Every rate row records its source document, page and status; the estimate stores the dataset version and engine version used to produce it. The current production baseline is:

- **Base rates:** Maharashtra PWD State Schedule of Rates 2022-23 (Civil), `SRC-01` — PDF file name and SHA-256 are recorded in `data/rates/csv/data_source.csv`.
- **Wage inputs:** Maharashtra minimum-wage notifications (`SRC-02`, `SRC-03`).
- **Price index:** WPI (base 2022-23 = 100, `SRC-04`) is loaded into the `rates` schema as a labelled indicative reference. The current engine does not apply it to estimates.
- **Calibration factors:** the `2.85x` Pune multiplier and the quality-tier multipliers are code-level planning assumptions, not yet sourced rows.

See [`docs/DATA_SOURCES.md`](DATA_SOURCES.md) and [`data/rates/README.md`](../data/rates/README.md) for the full register.

## Limitations & Disclaimer

- BuildSmart AI is **not** a contractor quotation, a verified market rate, or a civil engineering load-design tool.
- The `2.85x` market multiplier, the quality-tier multipliers, the quantity heuristics and the ML variance calibration are all **planning assumptions pending validation** against real Pune projects and contractor quotations.
- Estimates do not use live supplier prices. Actual costs depend on site conditions, design, market prices at the time of purchase and contractor terms.
- Estimates do not include land acquisition, legal or clearance fees, government sanctions, or custom architectural design.
- Always obtain detailed quotations and professional advice before committing to construction.
