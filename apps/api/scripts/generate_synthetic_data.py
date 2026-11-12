"""Generate synthetic construction estimation data for ML calibration.

Loops through permutations of building parameters (built-up area, floors, quality tier,
location zone), runs them through the bottom-up deterministic estimation engine (T12),
computes civil engineering variance targets, and exports the dataset to CSV/DataFrame.
"""

from __future__ import annotations

import argparse
import asyncio
from decimal import Decimal
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import numpy as np
import pandas as pd
from app.engine.calculator import calculate_estimate
from app.engine.contracts import EstimationInput
from app.rates.schemas import (
    LabourRateRecord,
    WorkItemRecord,
    ZoneRecord,
)

TIER_ENCODING: dict[str, int] = {
    "economy": 0,
    "standard": 1,
    "premium": 2,
}

ZONE_ENCODING: dict[str, int] = {
    "ZN-PMC": 0,
    "ZN-PCMC": 1,
    "ZN-CANT": 2,
    "ZN-COUNCIL": 3,
    "ZN-OTHER": 4,
}


def _make_work_item(
    item_no: str,
    desc: str,
    completed: Decimal,
    labour: Decimal,
    unit: str = "cum",
) -> WorkItemRecord:
    return WorkItemRecord(
        work_item_id=f"WI-{item_no}",
        ssr_sr=int(item_no.replace(".", "")),
        item_no=item_no,
        ref_no=None,
        description=desc,
        unit=unit,
        completed_rate=completed,
        labour_rate=labour,
        ssr_page=100,
        pdf_page=105,
        parse_status="OK",
        chapter_no=int(item_no.split(".", maxsplit=1)[0]),
        chapter_name="Civil Works",
        source_id="SRC-01",
        basis="SSR 2022-23",
    )


def _get_rates_environment() -> dict[str, WorkItemRecord]:
    return {
        "21.01": _make_work_item("21.01", "Excavation", Decimal("239.00"), Decimal("239.00")),
        "24.01": _make_work_item("24.01", "PCC bed", Decimal("5830.00"), Decimal("1616.00")),
        "25.11": _make_work_item("25.11", "RCC M-20", Decimal("7104.00"), Decimal("2110.00")),
        "26.34": _make_work_item(
            "26.34", "Steel reinforcement", Decimal("94136.00"), Decimal("11880.00"), "MT"
        ),
        "27.01": _make_work_item(
            "27.01", "Brickwork", Decimal("7755.00"), Decimal("1588.00")
        ),
        "38.01": _make_work_item(
            "38.01", "Roofing", Decimal("1183.00"), Decimal("148.00"), "sqm"
        ),
        "33.01": _make_work_item(
            "33.01", "Flooring", Decimal("731.00"), Decimal("291.00"), "sqm"
        ),
        "41.01": _make_work_item(
            "41.01", "Plumbing", Decimal("1317.00"), Decimal("126.00"), "Rm"
        ),
        "32.01": _make_work_item(
            "32.01", "Plastering", Decimal("203.00"), Decimal("166.00"), "sqm"
        ),
    }


def _calculate_target_variance(
    built_up_area: float,
    floors: int,
    quality_tier: str,
    zone_id: str,
    rng: np.random.Generator,
) -> float:
    """Calculate expected cost variance percentage based on site and structural factors."""
    base_variance = 0.10
    area_effect = 0.02 * (built_up_area / 4000.0)
    floor_effect = 0.012 * (floors - 1)

    tier_effects = {"economy": -0.02, "standard": 0.0, "premium": 0.025}
    tier_effect = tier_effects.get(quality_tier, 0.0)

    zone_effects = {
        "ZN-PMC": 0.005,
        "ZN-PCMC": 0.0,
        "ZN-CANT": 0.02,
        "ZN-COUNCIL": 0.015,
        "ZN-OTHER": 0.025,
    }
    zone_effect = zone_effects.get(zone_id, 0.0)

    noise = float(rng.normal(0.0, 0.006))
    raw_variance = base_variance + area_effect + floor_effect + tier_effect + zone_effect + noise
    return float(np.clip(raw_variance, 0.06, 0.25))


async def generate_synthetic_dataset(
    num_samples: int = 3000,
    random_seed: int = 42,
) -> pd.DataFrame:
    """Generate synthetic project input permutations.

    Calculates baseline costs and target variance for each project.
    """
    rng = np.random.default_rng(random_seed)
    items = _get_rates_environment()
    session = AsyncMock()

    zones = list(ZONE_ENCODING.keys())
    tiers = list(TIER_ENCODING.keys())
    floor_choices = [1, 2, 3, 4]
    floor_weights = [0.35, 0.40, 0.20, 0.05]
    tier_weights = [0.35, 0.50, 0.15]

    records: list[dict[str, Any]] = []

    dummy_labour = LabourRateRecord(
        trade="Electrician",
        daily_rate=Decimal("963.77"),
        unit="day",
        source_id="SRC-02",
    )

    with (
        patch(
            "app.engine.calculator.get_zone",
            new=AsyncMock(
                side_effect=lambda _, zid: ZoneRecord(
                    zone_id=zid,
                    name=zid,
                    min_wage_zone="I" if zid in ("ZN-PMC", "ZN-PCMC") else "II",
                    source_id="SRC-02",
                    status="READ",
                )
            ),
        ),
        patch(
            "app.engine.calculator.get_work_item",
            new=AsyncMock(side_effect=lambda _, code: items.get(code)),
        ),
        patch("app.engine.calculator.get_labour_rate", new=AsyncMock(return_value=dummy_labour)),
        patch("app.engine.calculator.get_active_dataset_version", new=AsyncMock(return_value=None)),
    ):
        for _ in range(num_samples):
            built_up_area = float(np.round(rng.uniform(600.0, 4500.0), 1))
            floors = int(rng.choice(floor_choices, p=floor_weights))
            quality_tier = str(rng.choice(tiers, p=tier_weights))
            zone_id = str(rng.choice(zones))

            bedrooms = max(1, min(6, int(built_up_area / 500.0)))
            bathrooms = max(1, min(5, int(bedrooms * 0.75)))
            plot_area = built_up_area * float(rng.uniform(1.2, 2.0))

            inp = EstimationInput(
                built_up_area_sqft=built_up_area,
                floors=floors,
                bedrooms=bedrooms,
                bathrooms=bathrooms,
                zone_id=zone_id,
                quality_tier=quality_tier,  # type: ignore[arg-type]
                construction_type="rcc_framed",
                plot_area_sqft=plot_area,
            )

            res = await calculate_estimate(session, inp)
            variance_pct = _calculate_target_variance(
                built_up_area, floors, quality_tier, zone_id, rng
            )

            records.append({
                "built_up_area": built_up_area,
                "floors": floors,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "quality_tier": quality_tier,
                "zone_id": zone_id,
                "quality_tier_encoded": TIER_ENCODING[quality_tier],
                "zone_id_encoded": ZONE_ENCODING[zone_id],
                "baseline_cost_p50": res.total.p50,
                "cost_p10": res.total.p10,
                "cost_p90": res.total.p90,
                "variance_pct": round(variance_pct, 4),
            })

    df = pd.DataFrame(records)
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic data for ML calibration.")
    parser.add_argument("--samples", type=int, default=3000, help="Number of samples to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument(
        "--output",
        type=str,
        default="apps/api/ml/synthetic_estimates.csv",
        help="Output CSV path",
    )
    args = parser.parse_args()

    out_path = Path(args.output).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating {args.samples} synthetic estimates using T12 engine...")
    df = asyncio.run(generate_synthetic_dataset(num_samples=args.samples, random_seed=args.seed))
    df.to_csv(out_path, index=False)
    print(f"Successfully generated {len(df)} records and saved to {out_path}")


if __name__ == "__main__":
    main()
