import {
  ProjectInputs,
  EstimateResponse,
  MetaOptions,
  CategoryBreakdownItem,
  MaterialRecommendationItem,
  BudgetStatus,
  CostDriver,
} from '../types/estimate';

export const MOCK_META_OPTIONS: MetaOptions = {
  is_mock: true,
  zones: [
    { zone_id: 'pune_central', zone_name: 'Central Pune', description: 'Shivajinagar, Deccan, Camp, Sadashiv Peth (Narrow access, high demand)' },
    { zone_id: 'pune_east', zone_name: 'East Pune', description: 'Kharadi, Hadapsar, Viman Nagar, Wagholi (Standard logistics)' },
    { zone_id: 'pune_west', zone_name: 'West & North-West Pune', description: 'Baner, Wakad, Hinjewadi, Aundh, Bavdhan (High demand IT corridor)' },
    { zone_id: 'pcmc', zone_name: 'Pimpri-Chinchwad (PCMC)', description: 'Nigdi, Bhosari, Rawet, Chinchwad (Industrial logistics access)' },
    { zone_id: 'pune_south_peripheral', zone_name: 'South & Peripheral Pune', description: 'Katraj, Kondhwa, Undri, Ambegaon (Outer ring access)' },
  ],
  quality_tiers: [
    { id: 'economy', name: 'Economy', description: 'Standard standard-grade materials, basic fittings, local PPC cement', indicative_rate_sqft: 1550 },
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
};

const TIER_RATES: Record<string, number> = {
  economy: 1550,
  standard: 1900,
  premium: 2500,
};

export async function fetchMetaOptions(): Promise<MetaOptions> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 150));
  return MOCK_META_OPTIONS;
}

export async function calculateEstimateMock(inputs: ProjectInputs): Promise<EstimateResponse> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const baseRate = TIER_RATES[inputs.quality_tier] || 1900;
  const zoneMult = ZONE_MULTIPLIERS[inputs.zone_id] || 1.0;
  const floorFactor = 1 + (inputs.floors - 1) * 0.04;

  const costPerSqFt = Math.round(baseRate * zoneMult * floorFactor);
  const p50Total = Math.round(inputs.built_up_area_sqft * costPerSqFt);

  // Confidence interval: P10 is -10%, P90 is +12%
  const p10Total = Math.round(p50Total * 0.90);
  const p90Total = Math.round(p50Total * 1.12);

  // 9-Category Shares (sums to 100%)
  const shares: { category: string; pct: number }[] = [
    { category: 'Foundation', pct: 11.0 },
    { category: 'Structure', pct: 28.0 },
    { category: 'Masonry', pct: 11.0 },
    { category: 'Roofing', pct: 5.0 },
    { category: 'Flooring', pct: 10.0 },
    { category: 'Plumbing', pct: 7.0 },
    { category: 'Electrical', pct: 7.0 },
    { category: 'Finishing', pct: 10.0 },
    { category: 'Labour', pct: 11.0 },
  ];

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
    p10: Math.round(b.floorAmt * 0.90),
    p90: Math.round(b.floorAmt * 1.12),
  }));

  // Material Recommendations
  const materials: MaterialRecommendationItem[] = [
    {
      category: 'Cement',
      primary: {
        material_id: 'mat_c02',
        category: 'Cement',
        grade_spec: 'OPC 43 (IS 8112)',
        description: 'Ordinary Portland Cement for structural RCC columns & slabs',
        unit: '50kg bag',
        unit_cost_range_inr: 'MOCK ₹370 - ₹400',
        quality_level: inputs.quality_tier,
      },
      alternative: {
        material_id: 'mat_c01',
        category: 'Cement',
        grade_spec: 'PPC (IS 1489)',
        description: 'Portland Pozzolana Cement for masonry and plastering',
        unit: '50kg bag',
        unit_cost_range_inr: 'MOCK ₹340 - ₹370',
        quality_level: 'economy',
      },
      reason: 'OPC 43/53 is recommended for RCC framework; PPC saves 8-10% on wall plastering.',
    },
    {
      category: 'Steel Reinforcement',
      primary: {
        material_id: 'mat_s02',
        category: 'Steel',
        grade_spec: 'Fe 500D (IS 1786)',
        description: 'High Ductility TMT Rebars for seismic zone compliance',
        unit: 'Metric Ton',
        unit_cost_range_inr: 'MOCK ₹56,000 - ₹61,000',
        quality_level: inputs.quality_tier,
      },
      alternative: {
        material_id: 'mat_s01',
        category: 'Steel',
        grade_spec: 'Fe 500 (IS 1786)',
        description: 'Standard Ductility TMT Rebars',
        unit: 'Metric Ton',
        unit_cost_range_inr: 'MOCK ₹52,000 - ₹56,000',
        quality_level: 'economy',
      },
      reason: 'Fe 500D provides superior elongation for earthquake resistance in Pune region.',
    },
    {
      category: 'Masonry Blocks',
      primary: {
        material_id: 'mat_b01',
        category: 'Bricks/Blocks',
        grade_spec: 'AAC Blocks 600x200x150mm',
        description: 'Autoclaved Aerated Concrete thermal lightweight blocks',
        unit: 'Cu. Meter',
        unit_cost_range_inr: 'MOCK ₹3,200 - ₹3,600',
        quality_level: 'standard',
      },
      alternative: {
        material_id: 'mat_b02',
        category: 'Bricks/Blocks',
        grade_spec: 'Red Clay Bricks Class 35',
        description: 'Traditional burnt red clay bricks',
        unit: '1,000 pcs',
        unit_cost_range_inr: 'MOCK ₹7,500 - ₹9,000',
        quality_level: 'economy',
      },
      reason: 'AAC blocks reduce dead load by 40% and accelerate masonry construction speed.',
    },
    {
      category: 'Flooring',
      primary: {
        material_id: 'mat_f01',
        category: 'Flooring',
        grade_spec: 'Vitrified Tiles 600x600mm',
        description: 'Double charged glazed vitrified tiles',
        unit: 'Sq. Ft.',
        unit_cost_range_inr: 'MOCK ₹45 - ₹75',
        quality_level: 'standard',
      },
      alternative: {
        material_id: 'mat_f02',
        category: 'Flooring',
        grade_spec: 'Italian Marble / Large Slab Porcelain',
        description: 'High-end polished natural marble',
        unit: 'Sq. Ft.',
        unit_cost_range_inr: 'MOCK ₹180 - ₹350',
        quality_level: 'premium',
      },
      reason: 'Vitrified tiles offer high stain resistance and low water absorption.',
    },
    {
      category: 'Paint & Finishes',
      primary: {
        material_id: 'mat_p02',
        category: 'Paint',
        grade_spec: 'Premium Acrylic Emulsion',
        description: 'Washable low-VOC interior wall paint',
        unit: 'Litre',
        unit_cost_range_inr: 'MOCK ₹280 - ₹420',
        quality_level: 'standard',
      },
      alternative: {
        material_id: 'mat_p01',
        category: 'Paint',
        grade_spec: 'Tractor Emulsion',
        description: 'Basic acrylic interior wall paint',
        unit: 'Litre',
        unit_cost_range_inr: 'MOCK ₹140 - ₹190',
        quality_level: 'economy',
      },
      reason: 'Premium acrylic emulsion provides smooth finish and 5+ years durability.',
    },
  ];

  // Budget Status calculation
  let budgetStatus: BudgetStatus;
  if (!inputs.budget_inr || inputs.budget_inr <= 0) {
    budgetStatus = {
      status: 'not_provided',
      gap_inr: 0,
      gap_pct: 0,
      message: 'No target budget provided. Showing full market estimate.',
    };
  } else {
    const gap = inputs.budget_inr - p50Total;
    const gapPct = Math.round((gap / p50Total) * 100);

    if (gap >= 0) {
      budgetStatus = {
        status: 'within',
        gap_inr: gap,
        gap_pct: gapPct,
        message: `Your budget of ₹${(inputs.budget_inr / 100000).toFixed(2)} Lakh is fully sufficient for this project specification.`,
      };
    } else if (Math.abs(gapPct) <= 10) {
      budgetStatus = {
        status: 'tight',
        gap_inr: gap,
        gap_pct: gapPct,
        message: `Your budget is tight (~${Math.abs(gapPct)}% below estimated cost). Consider minor tier downgrades in finishing items.`,
      };
    } else {
      budgetStatus = {
        status: 'below_minimum',
        gap_inr: gap,
        gap_pct: gapPct,
        message: `Your budget is ₹${(Math.abs(gap) / 100000).toFixed(2)} Lakh (${Math.abs(gapPct)}%) below the minimum estimated requirement.`,
      };
    }
  }

  const drivers: CostDriver[] = [
    {
      label: 'Built-up Area',
      impact_pct: 65.0,
      description: `${inputs.built_up_area_sqft} sq. ft built-up area across ${inputs.floors} floor(s).`,
    },
    {
      label: `Quality Tier (${inputs.quality_tier.toUpperCase()})`,
      impact_pct: 22.0,
      description: `Selecting ${inputs.quality_tier} quality tier vs Economy changes base cost by ~${inputs.quality_tier === 'premium' ? 60 : 22}%.`,
    },
    {
      label: `Location Zone (${inputs.zone_id.replace('pune_', '').toUpperCase()})`,
      impact_pct: Math.round((zoneMult - 1) * 100),
      description: `Zone labour and transport adjustment (+${Math.round((zoneMult - 1) * 100)}%).`,
    },
  ];

  return {
    id: `est_mock_${Date.now()}`,
    inputs,
    total: {
      p50: p50Total,
      p10: p10Total,
      p90: p90Total,
      cost_per_sqft: costPerSqFt,
      currency: 'INR',
    },
    confidence: {
      label: 'Medium',
      reason: 'MOCK API simulation. Derived rates require calibration against real project holdouts.',
    },
    breakdown,
    materials,
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
