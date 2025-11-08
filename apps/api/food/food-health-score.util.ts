export interface HealthScoreInput {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: Array<{
    label: string;
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>;
}

export type HealthScoreFeedbackAction = 'celebrate' | 'increase' | 'reduce' | 'monitor';

export interface HealthScoreFeedback {
  key: string;
  label: string;
  action: HealthScoreFeedbackAction;
  message: string;
}

export interface HealthScoreResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    macroBalance: number; // 0-100
    calorieDensity: number; // 0-100
    proteinQuality: number; // 0-100
    processingLevel: number; // 0-100 (lower processing = higher score)
  };
  feedback: HealthScoreFeedback[];
}

/**
 * Calculate Health Score based on nutritional composition
 * Score ranges from 0-100, with grades A (90-100), B (70-89), C (50-69), D (30-49), F (0-29)
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const { calories, protein, carbs, fat, items } = input;
  
  // Calculate macro ratios
  const totalMacros = protein + carbs + fat;
  const proteinRatio = totalMacros > 0 ? (protein / totalMacros) * 100 : 0;
  const carbsRatio = totalMacros > 0 ? (carbs / totalMacros) * 100 : 0;
  const fatRatio = totalMacros > 0 ? (fat / totalMacros) * 100 : 0;

  // Factor 1: Macro Balance (ideal: 30% protein, 40% carbs, 30% fat)
  const idealProtein = 30;
  const idealCarbs = 40;
  const idealFat = 30;
  
  const macroBalanceScore = 100 - (
    Math.abs(proteinRatio - idealProtein) +
    Math.abs(carbsRatio - idealCarbs) +
    Math.abs(fatRatio - idealFat)
  ) / 3;

  // Factor 2: Calorie Density (lower is generally better for health)
  // Assuming a reasonable portion is 400-600 calories
  const calorieScore = calories > 0 
    ? Math.max(0, 100 - Math.abs(calories - 500) / 5)
    : 50;

  // Factor 3: Protein Quality (higher protein % is generally better)
  const proteinQualityScore = Math.min(100, proteinRatio * 2);

  // Factor 4: Processing Level (detect processed foods by keywords)
  const processedKeywords = [
    'fried', 'deep fried', 'processed', 'canned', 'packaged', 'fast food',
    'soda', 'sweetened', 'sugar', 'syrup', 'artificial', 'preserved'
  ];
  
  let processingScore = 100;
  const foodNames = items.map(item => (item.label || '').toLowerCase()).join(' ');
  
  for (const keyword of processedKeywords) {
    if (foodNames.includes(keyword)) {
      processingScore -= 15; // Penalize for processed foods
    }
  }
  
  // Bonus for whole foods
  const wholeFoodKeywords = ['fresh', 'raw', 'steamed', 'grilled', 'baked', 'boiled', 'organic'];
  for (const keyword of wholeFoodKeywords) {
    if (foodNames.includes(keyword)) {
      processingScore = Math.min(100, processingScore + 5);
    }
  }

  // Calculate weighted overall score
  const factors = {
    macroBalance: Math.max(0, Math.min(100, macroBalanceScore)),
    calorieDensity: Math.max(0, Math.min(100, calorieScore)),
    proteinQuality: Math.max(0, Math.min(100, proteinQualityScore)),
    processingLevel: Math.max(0, Math.min(100, processingScore)),
  };

  // Weighted average (macro balance is most important)
  const score = Math.round(
    factors.macroBalance * 0.35 +
    factors.calorieDensity * 0.25 +
    factors.proteinQuality * 0.25 +
    factors.processingLevel * 0.15
  );

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 30) grade = 'D';
  else grade = 'F';

  // Generate feedback
  const feedback: HealthScoreFeedback[] = [];
  
  if (factors.macroBalance < 50) {
    feedback.push({
      key: 'macroBalance',
      label: 'Macro balance',
      action: 'increase',
      message: 'Macronutrient balance could be improved',
    });
  }
  
  if (factors.calorieDensity < 50) {
    if (calories > 700) {
      feedback.push({
        key: 'calorieDensity',
        label: 'Calorie density',
        action: 'reduce',
        message: 'High calorie content - consider portion size',
      });
    } else if (calories < 300) {
      feedback.push({
        key: 'calorieDensity',
        label: 'Calorie density',
        action: 'monitor',
        message: 'Low calorie content - may need additional nutrients',
      });
    }
  }
  
  if (factors.proteinQuality < 50) {
    feedback.push({
      key: 'proteinQuality',
      label: 'Protein quality',
      action: 'increase',
      message: 'Consider adding more protein sources',
    });
  }
  
  if (factors.processingLevel < 50) {
    feedback.push({
      key: 'processingLevel',
      label: 'Processing level',
      action: 'reduce',
      message: 'Contains processed ingredients - whole foods are better',
    });
  }
  
  if (score >= 80) {
    feedback.push({
      key: 'overall',
      label: 'Overall balance',
      action: 'celebrate',
      message: 'Great nutritional balance!',
    });
  } else if (score >= 60) {
    feedback.push({
      key: 'overall',
      label: 'Overall balance',
      action: 'monitor',
      message: 'Good nutritional profile with room for improvement',
    });
  } else {
    feedback.push({
      key: 'overall',
      label: 'Overall balance',
      action: 'reduce',
      message: 'Consider healthier alternatives',
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    grade,
    factors,
    feedback,
  };
}

