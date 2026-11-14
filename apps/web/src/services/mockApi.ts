import {
  ProjectInputs,
  EstimateResponse,
  MetaOptions,
  CategoryBreakdownItem,
  MaterialRecommendationItem,
  BudgetStatus,
  CostDriver,
  MaterialCharacteristicItem,
} from '../types/estimate';
import { ESTIMATE_CATEGORIES } from '../domain/estimateCategories';

export const MOCK_MATERIAL_CHARACTERISTICS: MaterialCharacteristicItem[] = [
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    category: 'Masonry Blocks',
    material_name: 'Autoclaved Aerated Concrete (AAC) Blocks',
    characteristic:
      'Dry density 551-650 kg/m³, compressive strength >= 4.0 N/mm² conforming to IS 2185 (Part 3). Thermal conductivity ~0.16 W/m-K.',
    performance_focus: 'Dead-load reduction & thermal insulation',
    verify_on_site_field:
      'Batch test certificate for oven-dry density & compressive strength; check for edge transit chipping < 5%.',
    professional_review_req: true,
    image_url:
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    category: 'Structural Steel',
    material_name: 'Thermo-Mechanically Treated (TMT) Rebars Fe 500D',
    characteristic:
      'High-ductility reinforcing bar conforming to IS 1786 Grade Fe 500D. 0.2% proof stress min 500 N/mm², elongation min 16.0%, TS/YS ratio >= 1.10.',
    performance_focus: 'Seismic ductility & structural flexural capacity',
    verify_on_site_field:
      'Manufacturer BIS embossed stamp every meter, mill test certificate, 180° bend test with mandrel.',
    professional_review_req: true,
    image_url:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa8',
    category: 'Flooring',
    material_name: 'Double Charged Vitrified Tiles (Group BIa)',
    characteristic:
      'Fully vitrified pressed ceramic tile conforming to IS 15622 (Group BIa). Water absorption <= 0.08%, MOR >= 35 N/mm², Mohs scratch hardness >= 6.',
    performance_focus: 'Wear resistance & low moisture absorption',
    verify_on_site_field:
      'Surface flatness diagonal tolerance (< 0.22%), shade variation rating, right-angle orthogonality check.',
    professional_review_req: false,
    image_url:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa9',
    category: 'Doors & Windows',
    material_name: 'Multi-Chambered uPVC Window Profiles',
    characteristic:
      'Unplasticized Polyvinyl Chloride profile systems conforming to IS 16560. Min outer wall thickness 2.2 mm, galvanised steel reinforcement >= 1.2 mm.',
    performance_focus: 'Acoustic attenuation & thermal resistance',
    verify_on_site_field:
      'Internal GI reinforcement verification with magnet, fusion welded corner strength, EPDM gasket sealing continuity.',
    professional_review_req: true,
    image_url:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afaa',
    category: 'Cement & Concrete',
    material_name: 'Portland Pozzolana Cement (PPC - Fly Ash Based)',
    characteristic:
      'Conforming to IS 1489 (Part 1). Fly ash pozzolana content 15-35%. 28-day compressive strength min 33 MPa (typically achieving 43-53 MPa).',
    performance_focus: 'Long-term hydration strength & sulphate resistance',
    verify_on_site_field:
      'Weekly manufacturer test certificate, bag manufacture date (< 90 days from bagging), lump-free consistency.',
    professional_review_req: true,
    image_url:
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afab',
    category: 'Plumbing & Sanitary',
    material_name: 'Chlorinated Polyvinyl Chloride (CPVC) SDR-11 Piping',
    characteristic:
      'Pressure rated hot & cold water piping conforming to IS 15778. Working pressure rating 2.76 MPa at 23°C and 0.69 MPa at 82°C.',
    performance_focus: 'Corrosion resistance & hot-water pressure integrity',
    verify_on_site_field:
      'SDR-11 wall thickness marking, solvent cement date (ASTM F493 standard), hydro-testing at 10 kg/cm² for 24 hours.',
    professional_review_req: true,
    image_url:
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  },
];

export async function fetchMaterialCharacteristics(
  category?: string
): Promise<MaterialCharacteristicItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (category) {
    const filter = category.toLowerCase();
    return MOCK_MATERIAL_CHARACTERISTICS.filter((m) =>
      m.category.toLowerCase().includes(filter)
    );
  }
  return MOCK_MATERIAL_CHARACTERISTICS;
}

export const MOCK_META_OPTIONS: MetaOptions = {
  is_mock: true,
  zones: [
    { id: 'pune_central', name: 'Central Pune', description: 'Shivajinagar, Deccan, Camp, Sadashiv Peth (Narrow access, high demand)' },
    { id: 'pune_east', name: 'East Pune', description: 'Kharadi, Hadapsar, Viman Nagar, Wagholi (Standard logistics)' },
    { id: 'pune_west', name: 'West & North-West Pune', description: 'Baner, Wakad, Hinjewadi, Aundh, Bavdhan (High demand IT corridor)' },
    { id: 'pcmc', name: 'Pimpri-Chinchwad (PCMC)', description: 'Nigdi, Bhosari, Rawet, Chinchwad (Industrial logistics access)' },
    { id: 'pune_south_peripheral', name: 'South & Peripheral Pune', description: 'Katraj, Kondhwa, Undri, Ambegaon (Outer ring access)' },
  ],
  quality_tiers: [
    { id: 'economy', name: 'Economy', description: 'Entry-level materials, basic fittings, local PPC cement', indicative_rate_sqft: 1550 },
    { id: 'standard', name: 'Standard (Recommended)', description: 'Branded OPC 43/53 cement, Fe 500D TMT steel, vitrified tiles', indicative_rate_sqft: 1900 },
    { id: 'premium', name: 'Premium / Luxury', description: 'High-strength Fe 550D steel, Italian marble/large slab, premium acrylic paint', indicative_rate_sqft: 2500 },
  ],
  construction_types: [
    { id: 'rcc_framed', name: 'RCC Framed Structure', description: 'Reinforced concrete columns, beams, and slabs (Standard for multi-floor)' },
    { id: 'load_bearing', name: 'Load Bearing Masonry', description: 'Brick walls carrying structural load (Suitable for G+0 or G+1 single house)' },
  ],
  ranges: {
    area_sqft: { min: 300, max: 10000 },
    floors: { min: 1, max: 4 },
    bedrooms: { min: 1, max: 10 },
    bathrooms: { min: 1, max: 10 },
  },
};

const ZONE_MULTIPLIERS: Record<string, number> = {
  pune_central: 1.08,
  pune_east: 1.00,
  pune_west: 1.05,
  pcmc: 0.98,
  pune_south_peripheral: 0.95,
  'ZN-PMC': 1.05,
  'ZN-PCMC': 0.98,
  'ZN-CANT': 1.02,
  'ZN-COUNCIL': 0.95,
  'ZN-OTHER': 0.90,
};

const TIER_RATE_MISSING = 'MOCK_META_OPTIONS has no indicative rate for quality tier';

/** The mock quality rates live only in `MOCK_META_OPTIONS`. */
function mockRateForQualityTier(tier: string): number {
  const option = MOCK_META_OPTIONS.quality_tiers.find((item) => item.id === tier);
  if (option?.indicative_rate_sqft === undefined) {
    throw new Error(`${TIER_RATE_MISSING} "${tier}"`);
  }
  return option.indicative_rate_sqft;
}

export async function fetchMetaOptions(): Promise<MetaOptions> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 150));
  return MOCK_META_OPTIONS;
}

export async function calculateEstimateMock(
  inputs: ProjectInputs,
  projectId = 'mock-project'
): Promise<EstimateResponse> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const baseRate = mockRateForQualityTier(inputs.quality_tier);
  const zoneMult = ZONE_MULTIPLIERS[inputs.zone_id] || 1.0;
  const floorFactor = 1 + (inputs.floors - 1) * 0.04;

  const p50Total = Math.round(
    inputs.built_up_area_sqft * Math.round(baseRate * zoneMult * floorFactor)
  );

  // Confidence interval: P10 is -10%, P90 is +12%
  const p10Total = Math.round(p50Total * 0.90);
  const p90Total = Math.round(p50Total * 1.12);

  // The nine canonical categories, with the mock allocation summing to 100%.
  const shares = ESTIMATE_CATEGORIES.map((category) => ({
    category: category.value,
    pct: category.sharePct,
  }));

  // Calculate breakdown amounts ensuring exact sum to p50Total using largest remainder
  const rawBreakdowns = shares.map((s) => {
    const rawAmt = (p50Total * s.pct) / 100;
    const floorAmt = Math.floor(rawAmt);
    const remainder = rawAmt - floorAmt;
    return { category: s.category, pct: s.pct, floorAmt, remainder };
  });

  const currentSum = rawBreakdowns.reduce((acc, curr) => acc + curr.floorAmt, 0);
  const diff = p50Total - currentSum;

  rawBreakdowns.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < diff; i++) {
    rawBreakdowns[i].floorAmt += 1;
  }

  // Restore original category order
  const categoryOrder = shares.map((s) => s.category);
  rawBreakdowns.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

  const breakdown: CategoryBreakdownItem[] = rawBreakdowns.map((b) => ({
    category: b.category,
    amount: b.floorAmt,
    share_pct: b.pct,
  }));

  // Material Recommendations
  const materials: MaterialRecommendationItem[] = [
    {
      category: 'Cement',
      primary: {
        material_id: 'mat_c02',
        name: 'OPC 43 (IS 8112)',
        category: 'Cement',
        grade_spec: 'OPC 43 (IS 8112)',
        description: 'Ordinary Portland Cement for structural RCC columns & slabs',
        unit: '50kg bag',
        unit_cost_range_inr: '₹400 (mock)',
        quality_level: inputs.quality_tier,
      },
      alternative: {
        material_id: 'mat_c01',
        name: 'PPC (IS 1489)',
        category: 'Cement',
        grade_spec: 'PPC (IS 1489)',
        description: 'Portland Pozzolana Cement for masonry and plastering',
        unit: '50kg bag',
        unit_cost_range_inr: '₹350 (mock)',
        quality_level: 'economy',
      },
      reason: 'OPC 43 is suited to RCC framework; PPC is commonly used for masonry and plastering.',
      image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'Steel Reinforcement',
      primary: {
        material_id: 'mat_s02',
        name: 'Fe 500D (IS 1786)',
        category: 'Steel',
        grade_spec: 'Fe 500D (IS 1786)',
        description: 'High ductility TMT rebars for seismic zone compliance',
        unit: 'Metric Ton',
        unit_cost_range_inr: '₹60,000 (mock)',
        quality_level: inputs.quality_tier,
      },
      alternative: {
        material_id: 'mat_s01',
        name: 'Fe 500 (IS 1786)',
        category: 'Steel',
        grade_spec: 'Fe 500 (IS 1786)',
        description: 'Standard ductility TMT rebars',
        unit: 'Metric Ton',
        unit_cost_range_inr: '₹55,000 (mock)',
        quality_level: 'economy',
      },
      reason: 'Fe 500D provides superior elongation for earthquake resistance in Pune region.',
      image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'Masonry Blocks',
      primary: {
        material_id: 'mat_b01',
        name: 'AAC Blocks 600x200x150mm',
        category: 'Bricks/Blocks',
        grade_spec: 'AAC Blocks 600x200x150mm',
        description: 'Autoclaved Aerated Concrete thermal lightweight blocks',
        unit: 'Cu. Meter',
        unit_cost_range_inr: '₹3,500 (mock)',
        quality_level: 'standard',
      },
      alternative: {
        material_id: 'mat_b02',
        name: 'Red Clay Bricks Class 35',
        category: 'Bricks/Blocks',
        grade_spec: 'Red Clay Bricks Class 35',
        description: 'Traditional burnt red clay bricks',
        unit: '1,000 pcs',
        unit_cost_range_inr: '₹8,000 (mock)',
        quality_level: 'economy',
      },
      reason: 'AAC blocks reduce dead load and speed up masonry compared with clay brick.',
      image_url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'Flooring',
      primary: {
        material_id: 'mat_f01',
        name: 'Vitrified Tiles 600x600mm',
        category: 'Flooring',
        grade_spec: 'Vitrified Tiles 600x600mm',
        description: 'Double charged glazed vitrified tiles',
        unit: 'Sq. Ft.',
        unit_cost_range_inr: '₹50 (mock)',
        quality_level: 'standard',
      },
      alternative: {
        material_id: 'mat_f02',
        name: 'Italian Marble',
        category: 'Flooring',
        grade_spec: 'Italian Marble / Large Slab Porcelain',
        description: 'High-end polished natural marble',
        unit: 'Sq. Ft.',
        unit_cost_range_inr: '₹200 (mock)',
        quality_level: 'premium',
      },
      reason: 'Vitrified tiles offer high stain resistance and low water absorption.',
      image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'Paint & Finishes',
      primary: {
        material_id: 'mat_p02',
        name: 'Premium Acrylic Emulsion',
        category: 'Paint',
        grade_spec: 'Premium Acrylic Emulsion',
        description: 'Washable low-VOC interior wall paint',
        unit: 'Litre',
        unit_cost_range_inr: '₹300 (mock)',
        quality_level: 'standard',
      },
      alternative: {
        material_id: 'mat_p01',
        name: 'Economy Acrylic Emulsion',
        category: 'Paint',
        grade_spec: 'Economy Acrylic Emulsion',
        description: 'Basic acrylic interior wall paint',
        unit: 'Litre',
        unit_cost_range_inr: '₹150 (mock)',
        quality_level: 'economy',
      },
      reason: 'Premium acrylic emulsion provides a washable, low-VOC interior finish.',
      image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Budget Status calculation
  let budgetStatus: BudgetStatus;
  if (!inputs.budget_inr || inputs.budget_inr <= 0) {
    budgetStatus = {
      status: 'not_provided',
      gap_inr: 0,
    };
  } else {
    const gap = inputs.budget_inr - p50Total;
    const gapPct = Math.round((gap / p50Total) * 100);

    if (gap >= 0) {
      budgetStatus = {
        status: 'within',
        gap_inr: gap,
      };
    } else if (Math.abs(gapPct) <= 10) {
      budgetStatus = {
        status: 'tight',
        gap_inr: gap,
      };
    } else {
      budgetStatus = {
        status: 'below_minimum',
        gap_inr: gap,
      };
    }
  }

  const drivers: CostDriver[] = [
    {
      label: 'Built-up Area',
      impact_pct: 65.0,
    },
    {
      label: `Quality Tier (${inputs.quality_tier.toUpperCase()})`,
      impact_pct: 22.0,
    },
    {
      label: `Location Zone (${inputs.zone_id.replace('pune_', '').toUpperCase()})`,
      impact_pct: Math.round((zoneMult - 1) * 100),
    },
  ];

  return {
    id: `est_mock_${Date.now()}`,
    project_id: projectId,
    inputs,
    total: {
      p50: p50Total,
      p10: p10Total,
      p90: p90Total,
      currency: 'INR',
    },
    confidence: {
      label: 'Medium',
      reason: 'MOCK API simulation. Derived rates require calibration against real project holdouts.',
    },
    breakdown,
    materials,
    material_characteristics: MOCK_MATERIAL_CHARACTERISTICS,
    budget: budgetStatus,
    drivers,
    model: {
      version: 'v0.1.0-mock',
      data_version: 'v2026.09-mock',
    },
    disclaimer:
      'PRELIMINARY ESTIMATE (MOCK DATA): This estimate is generated for planning purposes only and does not constitute a formal engineering quote or binding contract.',
    is_mock: true,
    created_at: new Date().toISOString(),
  };
}
