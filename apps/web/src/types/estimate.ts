/**
 * Estimate types are bound to the generated OpenAPI contract (`api.generated.ts`).
 * Do not redeclare response shapes here: the backend v1 shape is the single source
 * of truth, and this file only re-exports it plus UI-only option shapes.
 */
import type { components } from './api.generated';

type Schemas = components['schemas'];

export type QualityTier = Schemas['EstimateCreate']['quality_tier'];
export type ConstructionType = Schemas['EstimateCreate']['construction_type'];

export type ProjectInputs = Schemas['EstimateCreate'];
export type TotalEstimate = Schemas['TotalEstimate'];
export type ConfidenceInfo = Schemas['ConfidenceEstimate'];
export type CategoryBreakdownItem = Schemas['BreakdownCategoryItem'];
export type MaterialRecommendationItem = Schemas['MaterialRecommendationItem'];
export type BudgetStatus = Schemas['BudgetAssessment'];
export type CostDriver = Schemas['CostDriverItem'];
export type EstimateResponse = Schemas['EstimateResponse'];

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
