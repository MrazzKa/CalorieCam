/**
 * Unified data model for food analysis pipeline
 */

export interface Nutrients {
  calories: number;  // ккал
  protein: number;   // g
  carbs: number;     // g
  fat: number;       // g
  fiber: number;     // g
  sugars: number;    // g
  satFat: number;    // g
  energyDensity: number; // kcal / 100g
}

export interface AnalyzedItem {
  id?: string;
  name: string;        // normalized, human-readable name
  label?: string;      // original component name from Vision
  portion_g: number;   // фактический вес порции в граммах
  nutrients: Nutrients;
  source: 'fdc' | 'vision_fallback' | 'manual';
  fdcId?: string | number;
  fdcScore?: number;
  dataType?: string;   // USDA dataType (Branded, Foundation, etc.)
}

export interface AnalysisTotals extends Nutrients {
  portion_g: number;
}

export interface HealthScore {
  score: number; // 0–100
  grade?: string; // A, B, C, D, F
  label?: string;
  factors: Record<string, any>;
  feedback?: string[];
}

export interface AnalysisSanityIssue {
  type:
    | 'portion_too_small'
    | 'portion_too_large'
    | 'calories_per_gram_out_of_range'
    | 'macro_kcal_mismatch'
    | 'zero_calories_nonzero_portion'
    | 'suspicious_energy_density';
  level: 'warning' | 'error';
  message: string;
  itemIndex?: number;
  itemName?: string;
}

export interface AnalysisDebug {
  componentsRaw?: any[];  // raw Vision components
  components?: Array<{
    type: 'matched' | 'no_match' | 'low_score' | 'no_overlap' | 'portion_clamped' | 'vision_fallback';
    vision?: any;
    bestMatch?: any;
    score?: number;
    componentName?: string;
    originalPortionG?: number;
    finalPortionG?: number;
  }>;
  sanity?: AnalysisSanityIssue[];
  timestamp: string;
  model?: string;
}

export interface AnalysisData {
  items: AnalyzedItem[];
  total: AnalysisTotals;
  healthScore: HealthScore | null;
  debug?: AnalysisDebug; // опциональный блок для логов
  isSuspicious?: boolean; // флаг сомнительных результатов
}

