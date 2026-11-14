"""Seed script for material characteristics.

Populates the PostgreSQL 'material_characteristics' table with scientifically
accurate, real-world Indian construction materials (IS compliant).
Idempotent via existing record checks.
"""

import asyncio
import logging

from app.db.session import AsyncSessionLocal
from app.services.material_service import seed_material_characteristics

logger = logging.getLogger("seed_materials")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        logger.info("Starting material characteristics seeding...")
        count = await seed_material_characteristics(session)
        logger.info("Done! %d new material characteristics seeded.", count)


if __name__ == "__main__":
    asyncio.run(main())

