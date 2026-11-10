"""Rule-based Material Recommendation Engine (Contract C3).

Recommends primary and alternative material specifications with technical
justifications for the 5 major construction categories based on quality tier:
1. Cement
2. Steel
3. Masonry
4. Flooring
5. Plumbing
"""

from typing import Literal

from app.engine.contracts import MaterialRecommendation

# Recommendations dictionary keyed by category, then tier
MATERIAL_RULES: dict[
    str,
    dict[
        str,
        tuple[
            dict[str, str | float | int],
            dict[str, str | float | int],
            str,
        ],
    ],
] = {
    "Cement": {
        "economy": (
            {
                "name": "PPC (Portland Pozzolana Cement)",
                "grade": "IS 1489 Part 1",
                "spec": "Fly-ash blend for foundation, brickwork and basic plastering",
            },
            {
                "name": "Composite Cement (PCC)",
                "grade": "IS 16415",
                "spec": "Standard residential construction blend",
            },
            (
                "PPC reduces heat of hydration, resists drying shrinkage in Pune summer "
                "conditions, and provides an economical alternative to pure OPC."
            ),
        ),
        "standard": (
            {
                "name": "OPC 43 / PPC Dual Grade",
                "grade": "IS 8112 / IS 1489",
                "spec": "OPC 43 for RCC columns/beams, PPC for masonry and finishing",
            },
            {
                "name": "Portland Slag Cement (PSC)",
                "grade": "IS 455",
                "spec": "High sulfate and chloride resistance for foundations",
            },
            (
                "Dual-grade approach achieves high early compressive strength for RCC frames "
                "while minimizing surface shrinkage cracks in masonry and plaster."
            ),
        ),
        "premium": (
            {
                "name": "OPC 53 High-Strength Micro-Fine",
                "grade": "IS 269:2015",
                "spec": "Rapid strength gain for high-span G+2/G+3 RCC framed structures",
            },
            {
                "name": "Water-Repellent / Hydrophobic PPC",
                "grade": "IS 8043",
                "spec": "Integral waterproofing cement for roof slabs and wet areas",
            },
            (
                "OPC 53 provides superior 28-day compressive strength exceeding 53 MPa, "
                "permitting optimized column sizing and rapid formwork cycling."
            ),
        ),
    },
    "Steel": {
        "economy": (
            {
                "name": "Fe 500 Standard TMT Rebars",
                "grade": "IS 1786:2008",
                "spec": "Primary and secondary reinforcement for standard low-rise homes",
            },
            {
                "name": "Fe 415 Ribbed Steel",
                "grade": "IS 1786:2008",
                "spec": "Secondary reinforcement, lintel ties and stirrups",
            },
            (
                "Fe 500 provides standard yield strength adequate for low-rise residential "
                "structures at an economical price point."
            ),
        ),
        "standard": (
            {
                "name": "Fe 500D High-Ductility TMT",
                "grade": "IS 1786:2008 Grade Fe 500D",
                "spec": "Primary reinforcement for columns, beams and footings (Seismic Zone III)",
            },
            {
                "name": "Fe 500 Standard TMT",
                "grade": "IS 1786:2008",
                "spec": "Secondary slab distribution bars and staircase reinforcement",
            },
            (
                "Fe 500D guarantees minimum 16% uniform elongation, providing critical ductile "
                "energy absorption during seismic tremors in Pune Zone III."
            ),
        ),
        "premium": (
            {
                "name": "Fe 550D Corrosion-Resistant (CRS) Seismic Steel",
                "grade": "IS 1786:2008 Grade Fe 550D CRS",
                "spec": "High yield strength CRS alloyed with Cu/P for enhanced longevity",
            },
            {
                "name": "Fe 500D Fusion-Bonded Epoxy (FBEC) TMT",
                "grade": "IS 13620 / IS 1786",
                "spec": "Anti-corrosion coated rebars for foundation footings and columns",
            },
            (
                "Fe 550D reduces total rebar tonnage by ~10% while CRS metallurgy prevents "
                "foundation corrosion in high groundwater zones."
            ),
        ),
    },
    "Masonry": {
        "economy": (
            {
                "name": "Red Clay Burnt Bricks (Class II)",
                "grade": "IS 1077",
                "spec": "Standard kilned clay bricks with 1:6 cement-sand mortar",
            },
            {
                "name": "Solid Concrete Blocks (Dense)",
                "grade": "IS 2185 Part 1",
                "spec": "Dense cement concrete blocks for foundation and boundary walls",
            },
            (
                "Traditional burnt clay bricks provide proven thermal mass and reliable "
                "compressive strength at minimum material transportation lead."
            ),
        ),
        "standard": (
            {
                "name": "Autoclaved Aerated Concrete (AAC) Blocks",
                "grade": "IS 2185 Part 3 (Grade 1)",
                "spec": "600x200x150mm lightweight blocks with polymer thin-bed adhesive",
            },
            {
                "name": "Class I Machine-Moulded Wire-Cut Bricks",
                "grade": "IS 1077 Class 10",
                "spec": "Burnt bricks for 9-inch exterior and 4.5-inch partition walls",
            },
            (
                "AAC blocks reduce structural dead load by 40%, offer 2.5x higher thermal "
                "insulation for Pune summers, and cut mortar consumption by 60%."
            ),
        ),
        "premium": (
            {
                "name": "High-Precision Tongue-and-Groove AAC Blocks",
                "grade": "IS 2185 Part 3 / ASTM C1693",
                "spec": "Precision interlocking blocks with zero-void jointing and mesh ties",
            },
            {
                "name": "Fly-Ash Hollow Interlocking Blocks",
                "grade": "IS 12894",
                "spec": "Self-insulating acoustic hollow masonry blocks for energy-efficient homes",
            },
            (
                "High-precision interlocking blocks eliminate thick internal plaster, achieve "
                "superior acoustic dampening (42 dB), and optimize room climate control."
            ),
        ),
    },
    "Flooring": {
        "economy": (
            {
                "name": "Ceramic Glazed Floor Tiles",
                "grade": "IS 15622 Group BIIa",
                "spec": "300x300mm or 400x400mm matte finish tiles on 20mm cement bed",
            },
            {
                "name": "Polished Kota Stone / Tandur Stone",
                "grade": "Natural Stone Slabs",
                "spec": "Machine-cut natural stone slabs for living and utility areas",
            },
            (
                "Ceramic tiles provide an affordable, stain-resistant floor surface suitable "
                "for standard residential indoor wear."
            ),
        ),
        "standard": (
            {
                "name": "Double-Charged Vitrified Tiles (GVT)",
                "grade": "IS 15622 Group BIa (Water absorption < 0.05%)",
                "spec": "600x600mm or 800x800mm nano-polished tiles with epoxy joint grout",
            },
            {
                "name": "Full-Body Glazed Vitrified Tiles",
                "grade": "IS 15622 Group BIa",
                "spec": "Heavy-duty matte/satin finish tiles for kitchens and balconies",
            },
            (
                "Double-charged vitrified tiles carry a 3-4mm wear layer resisting heavy foot "
                "traffic while maintaining gloss without periodic re-polishing."
            ),
        ),
        "premium": (
            {
                "name": "Large-Format Glazed Porcelain / Vitrified Slabs",
                "grade": "IS 15622 Group BIa (Rectified)",
                "spec": "1200x600mm or 1200x1800mm continuous-vein slabs with seamless joints",
            },
            {
                "name": "Imported Marble / Composite Quartz Slabs",
                "grade": "Commercial Grade A",
                "spec": "Mirror-polished slabs for living, master bedrooms and formal foyer",
            },
            (
                "Large-format porcelain slabs deliver a seamless monolithic marble aesthetic "
                "with minimal grout lines and superior resistance to scratching and stains."
            ),
        ),
    },
    "Plumbing": {
        "economy": (
            {
                "name": "PVC & UPVC Schedule 40 Piping",
                "grade": "IS 4985 / ASTM D1785",
                "spec": "Rigid UPVC cold water supply lines and PVC drainage lines",
            },
            {
                "name": "GI (Galvanized Iron) Class B Pipes",
                "grade": "IS 1239 Part 1",
                "spec": "External exposed supply risers and rooftop tank connections",
            },
            (
                "UPVC provides reliable, lead-free cold water delivery at the most competitive "
                "material cost."
            ),
        ),
        "standard": (
            {
                "name": "CPVC SDR 11 / SDR 13.5 Concealed Piping",
                "grade": "IS 15778 / ASTM D2846",
                "spec": "Chlorinated Polyvinyl Chloride pipes for hot and cold supply up to 93°C",
            },
            {
                "name": "Composite Multi-Layer PE-AL-PE Piping",
                "grade": "IS 15450",
                "spec": "Flexible continuous plumbing lines for bathrooms and kitchen risers",
            },
            (
                "CPVC withstands solar water heating temperatures up to 93°C without scaling, "
                "corrosion, or chemical degradation."
            ),
        ),
        "premium": (
            {
                "name": "PPR / Multi-Layer Acoustic Plumbing System",
                "grade": "DIN 8077/8078 (PP-R Type 3) & IS 15450",
                "spec": "Heat-fusion welded PP-R pipes with acoustic drainage network",
            },
            {
                "name": "Heavy-Duty CPVC Schedule 80 Piping",
                "grade": "ASTM F441 / IS 15778",
                "spec": "High-pressure concealed distribution with forged brass fittings",
            },
            (
                "Homogeneous heat-fusion welded PPR joints eliminate thread leaks completely, "
                "while acoustic drainage lines isolate water flush noise between floors."
            ),
        ),
    },
}


def get_material_recommendations(
    quality_tier: Literal["economy", "standard", "premium"] | str,
) -> list[MaterialRecommendation]:
    """Generate dynamic material specifications based on the project's quality tier.

    Returns primary and alternative specifications with civil engineering justifications
    for the 5 major construction categories: Cement, Steel, Masonry, Flooring, and Plumbing.
    """
    normalized_tier = str(quality_tier).lower()
    if normalized_tier not in ("economy", "standard", "premium"):
        normalized_tier = "standard"

    recommendations: list[MaterialRecommendation] = []
    categories = ["Cement", "Steel", "Masonry", "Flooring", "Plumbing"]

    for cat in categories:
        tier_rule = MATERIAL_RULES[cat][normalized_tier]
        primary, alternative, reason = tier_rule
        recommendations.append(
            MaterialRecommendation(
                category=cat,
                primary=primary,
                alternative=alternative,
                reason=reason,
            )
        )

    return recommendations
