export type QualityTier = 'economy' | 'standard' | 'premium';
export type ConstructionType = 'rcc_framed' | 'load_bearing';

export interface ProjectInputs {
  built_up_area_sqft: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  zone_id: string;
  quality_tier: QualityTier;
  construction_type: ConstructionType;
  plot_area_sqft?: number | null;
  budget_inr?: number | null;
}

export interface TotalEstimate {
  p50: number;
  p10: number;
  p90: number;
  cost_per_sqft: number;
  currency: 'INR';
}

export interface ConfidenceInfo {
  label: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  share_pct: number;
  p10: number;
  p90: number;
}

export interface MaterialSpec {
  material_id: string;
  category: string;
  grade_spec: string;
  description: string;
  unit: string;
  unit_cost_range_inr: string;
  quality_level: string;
}

export interface MaterialRecommendationItem {
  category: string;
  primary: MaterialSpec;
  alternative: MaterialSpec;
  reason: string;
}

export interface BudgetStatus {
  status: 'within' | 'tight' | 'below_minimum' | 'not_provided';
  gap_inr: number;
  gap_pct: number;
  message: string;
}

export interface CostDriver {
  label: string;
  impact_pct: number;
  description: string;
}

export interface EstimateResponse {
  id: string;
  inputs: ProjectInputs;
  total: TotalEstimate;
  confidence: ConfidenceInfo;
  breakdown: CategoryBreakdownItem[];
  materials: MaterialRecommendationItem[];
  budget: BudgetStatus;
  drivers: CostDriver[];
  model: {
    version: string;
    data_version: string;
  };
  disclaimer: string;
  is_mock: boolean;
  created_at: string;
}

export interface LocationZone {
  zone_id: string;
  zone_name: string;
  description: string;
}

export interface QualityTierOption {
  id: QualityTier;
  name: string;
  description: string;
  indicative_rate_sqft: number;
}

export interface ConstructionTypeOption {
  id: ConstructionType;
  name: string;
  description: string;
}

export interface MetaOptions {
  zones: LocationZone[];
  quality_tiers: QualityTierOption[];
  construction_types: ConstructionTypeOption[];
  ranges: {
    area_sqft: { min: number; max: number };
    floors: { min: number; max: number };
    bedrooms: { min: number; max: number };
    bathrooms: { min: number; max: number };
  };
  is_mock: boolean;
}
