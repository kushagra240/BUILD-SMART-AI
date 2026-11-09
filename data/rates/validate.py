#!/usr/bin/env python3
"""Validate the rates database CSVs before loading. Exit code 1 if any ERROR.

Usage: python validate.py [csv_dir]
"""

import math
import os
import sys

import pandas as pd

LABOUR_SHARE_THRESHOLD = 0.9
EXPECTED_WPI_MONTHS = 42
DAILY_RATE_TOLERANCE = 0.005

csv_dir = (
    sys.argv[1]
    if len(sys.argv) > 1
    else os.path.join(os.path.dirname(os.path.abspath(__file__)), "csv")
)
res = []


def add(check, sev, n, detail=""):
    res.append({"check": check, "severity": sev, "count": n, "detail": str(detail)[:300]})


def rd(f):
    return pd.read_csv(os.path.join(csv_dir, f))


tables = {f[:-4]: rd(f) for f in os.listdir(csv_dir) if f.endswith(".csv")}
src = set(tables["data_source"].source_id)

# 1 primary keys
pk_checks = [
    ("data_source", "source_id"),
    ("zone", "zone_id"),
    ("labour_rate_ssr", "ssr_sr"),
    ("minimum_wage", "wage_id"),
    ("material_rate_ssr", "material_id"),
    ("work_item_ssr", "work_item_id"),
    ("quantity_norm", "norm_id"),
    ("transport_trip_cost", "row_id"),
    ("rate_rule", "rule_id"),
    ("wpi_item", "wpi_code"),
    ("material_wpi_map", "material_id"),
]
for name, key in pk_checks:
    d = tables[name][key].duplicated().sum()
    add(f"PK unique: {name}.{key}", "ERROR" if d else "OK", d)

for name in ("work_item_ssr",):
    for k in ("ssr_sr", "item_no"):
        d = tables[name][k].duplicated().sum()
        add(f"unique: {name}.{k}", "ERROR" if d else "OK", d)

# 2 foreign keys
fk_checks = (
    "labour_rate_ssr",
    "material_rate_ssr",
    "work_item_ssr",
    "quantity_norm",
    "transport_trip_cost",
    "rate_rule",
    "zone",
    "wpi_item",
    "wpi_series",
    "lead_charge_raw",
)
for name in fk_checks:
    bad = (~tables[name].source_id.isin(src)).sum()
    add(f"FK source_id: {name}", "ERROR" if bad else "OK", bad)

bad = (~tables["material_wpi_map"].material_id.isin(tables["material_rate_ssr"].material_id)).sum()
add("FK map->material", "ERROR" if bad else "OK", bad)

bad = (~tables["material_wpi_map"].wpi_code.isin(tables["wpi_item"].wpi_code)).sum()
add("FK map->wpi_item", "ERROR" if bad else "OK", bad)

bad = (~tables["wpi_series"].wpi_code.isin(tables["wpi_item"].wpi_code)).sum()
add("FK wpi_series->wpi_item", "ERROR" if bad else "OK", bad)

# 3 value sanity
m = tables["material_rate_ssr"]
add("material rate > 0", "ERROR" if (m.rate <= 0).any() else "OK", (m.rate <= 0).sum())

w = tables["work_item_ssr"]
add(
    "labour_rate <= completed_rate",
    "ERROR" if (w.labour_rate > w.completed_rate).any() else "OK",
    (w.labour_rate > w.completed_rate).sum(),
)

n = (w.labour_rate / w.completed_rate > LABOUR_SHARE_THRESHOLD).sum()
add("work items where labour > 90% of rate (read item before use)", "INFO", n)

n = (w.completed_rate == 0).sum()
add("work items with zero rate", "WARN" if n else "OK", n)

# 4 coverage
exp = set(range(720, 1620))
miss = sorted(exp - set(w.ssr_sr))
add(
    "SSR building serial numbers 720-1619 present",
    "WARN" if miss else "OK",
    len(miss),
    f"missing: {miss}",
)
add(
    "work items needing manual review",
    "WARN",
    (w.parse_status == "REVIEW").sum(),
    "see csv/review/work_items_review.csv",
)
add(
    "work items with unknown unit",
    "WARN" if w.unit.isna().any() else "OK",
    w.unit.isna().sum(),
)

review_path = os.path.join(csv_dir, "review", "material_rows_merged_or_unknown_unit.csv")
add(
    "material rows moved to review (merged two-column lines)",
    "WARN",
    len(pd.read_csv(review_path)),
    "road signage and merged lines; mostly not building-relevant",
)
add(
    "material rows flagged duplicate sr within a section",
    "INFO",
    (m.row_quality != "OK").sum(),
    "source numbering repeats; kept, flagged",
)

q = tables["quantity_norm"]
add(
    "quantity norms fully parsed",
    "INFO",
    q.parse_status.str.startswith("OK").sum(),
    f"{(q.parse_status.str.startswith('REVIEW')).sum()} rows need review",
)

# 5 WPI
s = tables["wpi_series"].copy()
s["month"] = pd.to_datetime(s.month)
g = s.groupby("wpi_code").month.agg(["count", "min", "max"])
add(
    "WPI: 42 months per item",
    "ERROR" if (g["count"] != EXPECTED_WPI_MONTHS).any() else "OK",
    (g["count"] != EXPECTED_WPI_MONTHS).sum(),
)
add(
    "WPI: index values positive",
    "ERROR" if (s.index_value <= 0).any() else "OK",
    (s.index_value <= 0).sum(),
)

# 6 minimum wage arithmetic
mw = tables["minimum_wage"]
b = (mw.total_monthly != mw.basic_monthly + mw.special_allowance_monthly).sum()
add("min wage: total = basic + allowance", "ERROR" if b else "OK", b)

b = (mw.total_monthly != mw.total_monthly_as_printed).sum()
add(
    "min wage: total equals value printed in notification",
    "ERROR" if b else "OK",
    b,
    "confirms hand-read allowance digits",
)

b = (
    (mw.daily_rate - mw.total_monthly.apply(lambda x: math.ceil(x / 26 * 100) / 100)).abs()
    > DAILY_RATE_TOLERANCE
).sum()
add("min wage: daily = ceil(total/26, 2)", "ERROR" if b else "OK", b)

add(
    "min wage allowance verified against the PDF by a human",
    "WARN",
    (~mw.allowance_verified.astype(bool)).sum(),
    "set allowance_verified=true after checking PDF page 3, entry 11",
)


# 7 quantity-norm plausibility (known engineering ranges)
def rng(cat_sub, item_sub, mat, bounds, unit="M3"):
    lo, hi = bounds
    x = q[
        (q.item_unit == unit)
        & (q.category.str.contains(cat_sub, case=False))
        & (q.item.str.contains(item_sub, case=False))
        & (q.material == mat)
        & q.qty.notna()
    ]
    out = x[(x.qty < lo) | (x.qty > hi)]
    detail = (
        out[["sr", "item", "qty"]].head(3).to_dict("records")
        if len(out)
        else f"{len(x)} rows checked"
    )
    add(
        f"norm plausibility: {cat_sub}/{item_sub}/{mat} in [{lo},{hi}]",
        "WARN" if len(out) else "OK",
        len(out),
        detail,
    )
    if len(x) == 0:
        res[-1]["severity"] = "WARN"
        res[-1]["detail"] = "no rows matched: check is vacuous"


rng("Plain Cement", "cement concrete", "Cement", (2, 9))
rng("Brick", "brick", "Bricks", (300, 700))
rng("Plastering", "plaster", "Cement", (0.03, 0.4), unit="M2")


# 8 core rate cross-checks (SSR 'General Rates')
def core(name_sub, bounds, unit):
    lo, hi = bounds
    x = m[(m.section == "General Rates") & m.material.str.contains(name_sub, case=False)]
    bad_rates = x[(x.rate < lo) | (x.rate > hi)]
    detail = x[["material_id", "rate"]].head(2).to_dict("records")
    add(
        f"core rate range: {name_sub} {lo}-{hi} {unit}",
        "WARN" if len(bad_rates) or x.empty else "OK",
        len(bad_rates) if len(x) else "not found",
        detail,
    )


core("^Cement", (4000, 9000), "INR/MT")
core("TMT", (40000, 90000), "INR/MT")
core("Sand - Crushed", (600, 3000), "INR/cu.m")

rep = pd.DataFrame(res)
rep.to_csv(os.path.join(os.path.dirname(csv_dir), "data_quality_report.csv"), index=False)
print(rep.to_string(index=False, max_colwidth=70))

errs = (rep.severity == "ERROR").sum()
warns = (rep.severity == "WARN").sum()
oks = (rep.severity == "OK").sum()
print(f"\n{errs} ERROR, {warns} WARN, {oks} OK")

sys.exit(1 if errs else 0)
