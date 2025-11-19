export interface AnalysisRequest {
  imageUri: string;
  userId?: string;
  metadata?: {
    timestamp: Date;
    location?: string;
    deviceInfo?: string;
  };
}

export interface AnalysisResult {
  id: string;
  items: AnalysisItem[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

export interface AnalysisItem {
  label: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  gramsMean?: number;
  confidence: number;
  ingredients?: string[];
}

export const analyzeFoodImage = async (request: AnalysisRequest): Promise<AnalysisResult> => {
  // Mock implementation
  console.log('Analyzing food image for user', request.userId, 'from', request.imageUri);
  return {
    id: Math.random().toString(36).substr(2, 9),
    items: [
      {
        label: 'Grilled Chicken Breast',
        kcal: 165,
        protein: 31,
        fat: 3.6,
        carbs: 0,
        gramsMean: 100,
        confidence: 0.95,
        ingredients: ['chicken breast', 'olive oil', 'salt', 'pepper'],
      },
    ],
    totalCalories: 165,
    totalProtein: 31,
    totalFat: 3.6,
    totalCarbs: 0,
    confidence: 0.95,
    processingTime: 2500,
    timestamp: new Date(),
  };
};
