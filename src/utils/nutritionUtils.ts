export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export const calculateCalories = (protein: number, fat: number, carbs: number): number => {
  return (protein * 4) + (fat * 9) + (carbs * 4);
};

export const calculateMacroPercentages = (protein: number, fat: number, carbs: number): {
  protein: number;
  fat: number;
  carbs: number;
} => {
  const total = protein + fat + carbs;
  if (total === 0) return { protein: 0, fat: 0, carbs: 0 };
  
  return {
    protein: (protein / total) * 100,
    fat: (fat / total) * 100,
    carbs: (carbs / total) * 100,
  };
};

export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
};

export const calculateTDEE = (bmr: number, activityLevel: number): number => {
  return bmr * activityLevel;
};

export const getActivityLevelMultiplier = (level: string): number => {
  const multipliers = {
    'SEDENTARY': 1.2,
    'LIGHT': 1.375,
    'MODERATE': 1.55,
    'ACTIVE': 1.725,
    'VERY_ACTIVE': 1.9,
  };
  return multipliers[level as keyof typeof multipliers] || 1.2;
};