# BuildSmart AI Methodology & Honest Limitations

## How Estimates are Produced
BuildSmart AI produces **preliminary, indicative residential construction cost estimates** for Pune and surrounding areas using a combination of supervised machine learning models and deterministic rate engines.

### 1. Cost Prediction Engine
- **Input Features:** Built-up area (sq ft), floors, bedrooms, bathrooms, location zone, quality tier (economy / standard / premium), and construction type.
- **Model Pipeline:** Trained on data transformed into log-scale to account for multiplicative cost scaling across floors and quality tiers.
- **Quantile Ranges (P10 / P50 / P90):** The median estimate (P50) is presented as the primary headline figure. P10 (10th percentile low) and P90 (90th percentile high) represent the 80% confidence interval based on observed market variance.

### 2. Nine-Category Cost Breakdown
The P50 total is allocated across 9 standard structural categories:
1. Foundation
2. Structure
3. Masonry
4. Roofing
5. Flooring
6. Plumbing
7. Electrical
8. Finishing
9. Site Labour

All 9 category amounts are rounded as exact integers that sum **precisely** to the total median estimate.

### 3. Data Composition & Provenance
Every model version details the ratio of **Real Contractor Records** versus **Published Rate Derived** data. Headline accuracy metrics (MAE, RMSE, MAPE, R²) are strictly evaluated and reported on held-out real project records.

---

## Limitations & Disclaimer
- BuildSmart AI is **not** a contractor quotation or civil engineering load design tool.
- Estimates do not include land acquisition, legal clearance fees, government sanctions, or custom architectural designs.
