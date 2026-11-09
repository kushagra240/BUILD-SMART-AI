"""Read-only rates repository for querying the PostgreSQL 'rates' schema.

Contract C2: All access to 'rates' tables is strictly read-only.
No raw SQL string interpolations; all queries use SQLAlchemy Core constructs.
No hardcoded prices or fallbacks; returns None when a rate is not found.
"""

from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.rates.schemas import (
    DatasetVersionRecord,
    LabourRateRecord,
    MaterialRateRecord,
    QuantityNormRecord,
    RateRuleRecord,
    WorkItemRecord,
    ZoneRecord,
)
from app.rates.tables import (
    dataset_version,
    labour_rate_ssr,
    material_rate_ssr,
    minimum_wage,
    quantity_norm,
    rate_rule,
    work_item_ssr,
    zone as zone_table,
)

_SKILL_ALIASES: dict[str, str] = {
    "skilled": "Skilled",
    "semi-skilled": "Semi-skilled",
    "semi skilled": "Semi-skilled",
    "unskilled": "Unskilled",
    "un skilled": "Unskilled",
}

_REPRESENTATIVE_SSR_SR: dict[str, int] = {
    "Skilled": 3,
    "Semi-skilled": 20,
    "Unskilled": 33,
}


def _infer_skill_class(trade_name: str) -> str:
    """Infer skill class from trade name using SSR classification rules."""
    t_lower = trade_name.lower()
    if "semi" in t_lower:
        return "Semi-skilled"
    if any(k in t_lower for k in ("unskilled", "un skilled", "mazdoor", "helper", "excavator")):
        return "Unskilled"
    return "Skilled"


class RatesRepository:
    """Read-only repository executing parameterized SELECT queries against 'rates'."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_work_item(self, code: str) -> WorkItemRecord | None:
        """Query work item by work_item_id (e.g. 'WI-0001') or item_no (e.g. '21.01').

        Returns work item with completed rate and labour component, or None if not found.
        """
        clean_code = code.strip()
        if not clean_code:
            return None

        stmt = (
            sa.select(work_item_ssr)
            .where(
                sa.or_(
                    work_item_ssr.c.work_item_id == clean_code,
                    work_item_ssr.c.item_no == clean_code,
                )
            )
            .limit(1)
        )
        result = await self.session.execute(stmt)
        row = result.mappings().first()
        if row is None:
            return None
        return WorkItemRecord.model_validate(dict(row))

    async def get_material_rate(self, material_id: str) -> MaterialRateRecord | None:
        """Query material rate by material_id (e.g. 'MAT-0001') or exact material name.

        Returns sourced unit rate, or None if not found.
        """
        clean_id = material_id.strip()
        if not clean_id:
            return None

        stmt = (
            sa.select(material_rate_ssr)
            .where(
                sa.or_(
                    material_rate_ssr.c.material_id == clean_id,
                    material_rate_ssr.c.material == clean_id,
                )
            )
            .limit(1)
        )
        result = await self.session.execute(stmt)
        row = result.mappings().first()
        if row is None:
            return None
        return MaterialRateRecord.model_validate(dict(row))

    async def get_labour_rate(
        self,
        trade: str,
        zone_id: str | None = None,
    ) -> LabourRateRecord | None:
        """Query labour rate returning daily wage.

        If zone_id is provided, resolves the zone's minimum wage for the trade's skill class.
        Otherwise returns the SSR 2022-23 statewide daily wage.
        Returns None if trade or rate is not found.
        """
        clean_trade = trade.strip()
        if not clean_trade:
            return None

        matched_trade: str | None = None
        ssr_rate: Decimal | None = None
        source_id = "SRC-01"
        unit = "day"
        skill_class: str | None = None

        if clean_trade.lower() in _SKILL_ALIASES:
            skill_class = _SKILL_ALIASES[clean_trade.lower()]
            rep_sr = _REPRESENTATIVE_SSR_SR.get(skill_class, 3)
            rep_stmt = (
                sa.select(labour_rate_ssr).where(labour_rate_ssr.c.ssr_sr == rep_sr).limit(1)
            )
            rep_res = await self.session.execute(rep_stmt)
            rep_row = rep_res.mappings().first()
            if rep_row is not None:
                matched_trade = clean_trade
                ssr_rate = Decimal(str(rep_row["rate_2022_23"]))
                unit = str(rep_row["unit_norm"])
                source_id = str(rep_row["source_id"])
        else:
            stmt = (
                sa.select(labour_rate_ssr)
                .where(
                    sa.or_(
                        labour_rate_ssr.c.trade == clean_trade,
                        labour_rate_ssr.c.trade.ilike(f"%{clean_trade}%"),
                    )
                )
                .limit(1)
            )
            result = await self.session.execute(stmt)
            row = result.mappings().first()
            if row is not None:
                matched_trade = str(row["trade"])
                ssr_rate = Decimal(str(row["rate_2022_23"]))
                unit = str(row["unit_norm"])
                source_id = str(row["source_id"])
                skill_class = _infer_skill_class(matched_trade)

        if matched_trade is None and skill_class is None:
            return None

        min_wage_zone: str | None = None
        min_wage_rate: Decimal | None = None

        if zone_id:
            clean_zone = zone_id.strip()
            if clean_zone in ("I", "II", "III"):
                min_wage_zone = clean_zone
            else:
                z_stmt = (
                    sa.select(zone_table.c.min_wage_zone)
                    .where(zone_table.c.zone_id == clean_zone)
                    .limit(1)
                )
                z_res = await self.session.execute(z_stmt)
                z_val = z_res.scalar_one_or_none()
                if z_val:
                    min_wage_zone = str(z_val)

            if min_wage_zone and skill_class:
                mw_stmt = (
                    sa.select(minimum_wage.c.daily_rate, minimum_wage.c.basic_source_id)
                    .where(
                        sa.and_(
                            minimum_wage.c.zone == min_wage_zone,
                            minimum_wage.c.skill_class == skill_class,
                        )
                    )
                    .limit(1)
                )
                mw_res = await self.session.execute(mw_stmt)
                mw_row = mw_res.mappings().first()
                if mw_row is not None:
                    min_wage_rate = Decimal(str(mw_row["daily_rate"]))
                    source_id = str(mw_row["basic_source_id"])

        if min_wage_rate is not None:
            daily_rate = min_wage_rate
        elif ssr_rate is not None:
            daily_rate = ssr_rate
        else:
            return None

        return LabourRateRecord(
            trade=matched_trade or clean_trade,
            daily_rate=daily_rate,
            unit=unit,
            ssr_rate=ssr_rate,
            min_wage_rate=min_wage_rate,
            zone_id=zone_id,
            min_wage_zone=min_wage_zone,
            skill_class=skill_class,
            source_id=source_id,
        )

    async def get_quantity_norms(self, item_id: str) -> list[QuantityNormRecord]:
        """Query quantity norms by norm_id (e.g. 'QN-0001') or matching item description.

        Returns material consumption norms, or empty list if none found.
        """
        clean_id = item_id.strip()
        if not clean_id:
            return []

        stmt = (
            sa.select(quantity_norm)
            .where(
                sa.or_(
                    quantity_norm.c.norm_id == clean_id,
                    quantity_norm.c.item == clean_id,
                    quantity_norm.c.item.ilike(f"%{clean_id}%"),
                )
            )
            .order_by(quantity_norm.c.sr.nulls_last(), quantity_norm.c.norm_id)
        )
        result = await self.session.execute(stmt)
        rows = result.mappings().all()
        return [QuantityNormRecord.model_validate(dict(r)) for r in rows]

    async def get_rate_rule(self, rule_id: str) -> RateRuleRecord | None:
        """Query pricing rate rule by rule_id (e.g. 'RR-FL-01')."""
        clean_id = rule_id.strip()
        if not clean_id:
            return None

        stmt = sa.select(rate_rule).where(rate_rule.c.rule_id == clean_id).limit(1)
        result = await self.session.execute(stmt)
        row = result.mappings().first()
        if row is None:
            return None
        return RateRuleRecord.model_validate(dict(row))

    async def get_zone(self, zone_id: str) -> ZoneRecord | None:
        """Query zone details by zone_id (e.g. 'ZN-PMC')."""
        clean_id = zone_id.strip()
        if not clean_id:
            return None

        stmt = sa.select(zone_table).where(zone_table.c.zone_id == clean_id).limit(1)
        result = await self.session.execute(stmt)
        row = result.mappings().first()
        if row is None:
            return None
        return ZoneRecord.model_validate(dict(row))

    async def get_all_zones(self) -> list[ZoneRecord]:
        """Query all zones ordered by zone_id."""
        stmt = sa.select(zone_table).order_by(zone_table.c.zone_id)
        result = await self.session.execute(stmt)
        rows = result.mappings().all()
        return [ZoneRecord.model_validate(dict(r)) for r in rows]

    async def get_active_dataset_version(self) -> DatasetVersionRecord | None:
        """Query currently active dataset version."""
        stmt = sa.select(dataset_version).where(dataset_version.c.is_active.is_(True)).limit(1)
        result = await self.session.execute(stmt)
        row = result.mappings().first()
        if row is None:
            return None
        return DatasetVersionRecord.model_validate(dict(row))


# Top-level helper functions for direct module-level calling
async def get_work_item(session: AsyncSession, code: str) -> WorkItemRecord | None:
    return await RatesRepository(session).get_work_item(code)


async def get_material_rate(session: AsyncSession, material_id: str) -> MaterialRateRecord | None:
    return await RatesRepository(session).get_material_rate(material_id)


async def get_labour_rate(
    session: AsyncSession,
    trade: str,
    zone_id: str | None = None,
) -> LabourRateRecord | None:
    return await RatesRepository(session).get_labour_rate(trade, zone_id)


async def get_quantity_norms(session: AsyncSession, item_id: str) -> list[QuantityNormRecord]:
    return await RatesRepository(session).get_quantity_norms(item_id)


async def get_rate_rule(session: AsyncSession, rule_id: str) -> RateRuleRecord | None:
    return await RatesRepository(session).get_rate_rule(rule_id)


async def get_zone(session: AsyncSession, zone_id: str) -> ZoneRecord | None:
    return await RatesRepository(session).get_zone(zone_id)


async def get_all_zones(session: AsyncSession) -> list[ZoneRecord]:
    return await RatesRepository(session).get_all_zones()


async def get_active_dataset_version(session: AsyncSession) -> DatasetVersionRecord | None:
    return await RatesRepository(session).get_active_dataset_version()
