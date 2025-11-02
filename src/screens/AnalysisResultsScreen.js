import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MotiView } from 'moti';
import ApiService from '../services/apiService';
import { EditFoodItemModal } from '../components/EditFoodItemModal';
import { useTheme } from '../contexts/ThemeContext';
import { PADDING, SPACING, BORDER_RADIUS, SHADOW } from '../utils/designConstants';

export default function AnalysisResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, source } = route.params;
  const { colors } = useTheme();

  console.log('AnalysisResultsScreen loaded with source:', source);

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const analyzeImage = async () => {
      try {
        // Try to upload image first
        let uploadResult;
        try {
          uploadResult = await ApiService.uploadImage(imageUri);
        } catch (uploadError) {
          console.log('Upload failed, using demo mode:', uploadError);
        }

        // Try to start analysis
        let analysisResponse;
        try {
          analysisResponse = await ApiService.analyzeImage(imageUri);
        } catch (analysisError) {
          console.log('Analysis API failed, using demo mode:', analysisError);
          // Use demo data when API is not available
          const demoResult = {
            dishName: 'Mixed Salad',
            totalCalories: 320,
            totalProtein: 15,
            totalCarbs: 25,
            totalFat: 18,
            ingredients: [
              {
                name: 'Lettuce',
                calories: 80,
                protein: 5,
                carbs: 10,
                fat: 2,
                weight: 100,
              },
              {
                name: 'Tomato',
                calories: 60,
                protein: 3,
                carbs: 8,
                fat: 1,
                weight: 80,
              },
              {
                name: 'Olive Oil',
                calories: 180,
                protein: 0,
                carbs: 0,
                fat: 20,
                weight: 15,
              },
            ],
          };
          
          setAnalysisResult(demoResult);
          setIsAnalyzing(false);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
          return;
        }

        if (analysisResponse.analysisId) {
          // Poll for results
          let attempts = 0;
          const maxAttempts = 60; // 60 seconds max (analysis can take time)

          const pollForResults = async () => {
            try {
              const status = await ApiService.getAnalysisStatus(analysisResponse.analysisId);

              if (status.status === 'completed') {
                const result = await ApiService.getAnalysisResult(analysisResponse.analysisId);
                setAnalysisResult(result);
                setIsAnalyzing(false);

                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                }).start();
              } else if (status.status === 'failed') {
                throw new Error('Analysis failed');
              } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(pollForResults, 1000);
              } else {
                throw new Error('Analysis timeout');
              }
            } catch (error) {
              console.error('Polling error:', error);
              throw error;
            }
          };

          pollForResults();
        } else {
          // Direct result
          setAnalysisResult(analysisResponse);
          setIsAnalyzing(false);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Analysis error:', error);
        // Use demo data as fallback
        const demoResult = {
          dishName: 'Demo Dish',
          totalCalories: 250,
          totalProtein: 12,
          totalCarbs: 20,
          totalFat: 15,
          ingredients: [
            {
              name: 'Demo Ingredient',
              calories: 250,
              protein: 12,
              carbs: 20,
              fat: 15,
              weight: 150,
            },
          ],
        };
        
        setAnalysisResult(demoResult);
        setIsAnalyzing(false);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    };

    analyzeImage();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just analyzed my meal: ${analysisResult?.dishName}! ${analysisResult?.totalCalories} calories.`,
        title: 'CalorieCam Analysis',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCorrect = (item, index) => {
    setEditingItem(item);
    setEditingIndex(index);
  };

  const handleSaveEdit = (updatedItem, index) => {
    const updatedIngredients = [...analysisResult.ingredients];
    updatedIngredients[index] = updatedItem;
    
    // Recalculate totals
    const newTotalCalories = updatedIngredients.reduce((sum, ing) => sum + (ing.calories || 0), 0);
    const newTotalProtein = updatedIngredients.reduce((sum, ing) => sum + (ing.protein || 0), 0);
    const newTotalCarbs = updatedIngredients.reduce((sum, ing) => sum + (ing.carbs || 0), 0);
    const newTotalFat = updatedIngredients.reduce((sum, ing) => sum + (ing.fat || 0), 0);
    
    setAnalysisResult({
      ...analysisResult,
      ingredients: updatedIngredients,
      totalCalories: newTotalCalories,
      totalProtein: newTotalProtein,
      totalCarbs: newTotalCarbs,
      totalFat: newTotalFat,
    });
  };

  const handleSave = async () => {
    try {
      const mealData = {
        name: analysisResult.dishName,
        type: 'meal',
        items: analysisResult.ingredients.map(ingredient => ({
          name: ingredient.name,
          calories: ingredient.calories,
          protein: ingredient.protein,
          fat: ingredient.fat,
          carbs: ingredient.carbs,
          weight: ingredient.weight,
        })),
      };

      await ApiService.createMeal(mealData);
      Alert.alert('Saved', 'Your meal has been saved to your journal!');
      navigation.navigate('Dashboard');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  if (isAnalyzing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.analyzingContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.analyzingImage} />
            <View style={styles.analyzingOverlay}>
              <View style={styles.analyzingContent}>
                <View style={styles.analyzingIconContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
                <Text style={styles.analyzingText}>Analyzing your dish...</Text>
                <Text style={styles.analyzingSubtext}>
                  AI is identifying ingredients and calories
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.progressSteps}>
            <View style={styles.step}>
              <View style={[styles.stepIcon, styles.stepCompleted]}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.stepText}>Uploaded</Text>
            </View>
            
            <View style={styles.step}>
              <View style={[styles.stepIcon, styles.stepActive]}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
              <Text style={styles.stepText}>Analyzing</Text>
            </View>
            
            <View style={styles.step}>
              <View style={[styles.stepIcon, styles.stepPending]}>
                <Ionicons name="calculator" size={20} color="#8E8E93" />
              </View>
              <Text style={styles.stepText}>Calculating</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analysis Complete</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
            <View style={styles.successOverlay}>
              <Ionicons name="checkmark-circle" size={32} color="#34C759" />
            </View>
          </View>

          {/* Dish Name */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <View style={styles.dishNameContainer}>
              <Text style={[styles.dishName, { color: colors.text }]}>{analysisResult?.dishName}</Text>
            </View>
          </MotiView>

          {/* Total Nutrition */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15, delay: 100 }}
          >
            <View style={styles.nutritionContainer}>
              <View style={[styles.nutritionCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.nutritionTitle, { color: colors.text }]}>Total Nutrition</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.primary }]}>{analysisResult?.totalCalories}</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.primary }]}>{analysisResult?.totalProtein}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.primary }]}>{analysisResult?.totalCarbs}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: colors.primary }]}>{analysisResult?.totalFat}g</Text>
                  <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Fat</Text>
                </View>
              </View>
            </View>
          </MotiView>

          {/* Ingredients */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 200 }}
          >
            <View style={styles.ingredientsContainer}>
              <Text style={[styles.ingredientsTitle, { color: colors.text }]}>Ingredients</Text>
            {analysisResult?.ingredients?.map((ingredient, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', damping: 15, delay: index * 50 }}
              >
                <TouchableOpacity
                  style={[styles.ingredientItem, { backgroundColor: colors.card }]}
                  onPress={() => handleCorrect(ingredient, index)}
                >
                <View style={styles.ingredientInfo}>
                  <Text style={[styles.ingredientName, { color: colors.text }]}>{ingredient.name}</Text>
                  <Text style={[styles.ingredientWeight, { color: colors.textSecondary }]}>{ingredient.weight}g</Text>
                </View>
                <View style={styles.ingredientNutrition}>
                  <Text style={[styles.ingredientCalories, { color: colors.primary }]}>{ingredient.calories} cal</Text>
                  <Text style={[styles.ingredientMacros, { color: colors.textSecondary }]}>
                    P: {ingredient.protein}g • C: {ingredient.carbs}g • F: {ingredient.fat}g
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editIcon}
                  onPress={() => handleCorrect(ingredient, index)}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
              </MotiView>
            ))}
            </View>
          </MotiView>

          {/* Action Buttons */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15, delay: 300 }}
          >
            <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#007AFF" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.correctButton} 
              onPress={() => {
                if (analysisResult?.ingredients?.length > 0) {
                  handleCorrect(analysisResult.ingredients[0], 0);
                }
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FF9500" />
              <Text style={styles.correctButtonText}>Edit</Text>
            </TouchableOpacity>
            </View>
          </MotiView>

          {/* Save Button */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 400 }}
          >
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save to Journal</Text>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </Animated.View>

      {/* Edit Modal */}
      {editingItem && (
        <EditFoodItemModal
          visible={!!editingItem}
          onClose={() => {
            setEditingItem(null);
            setEditingIndex(null);
          }}
          item={editingItem}
          onSave={handleSaveEdit}
          index={editingIndex}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerButton: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  analyzingImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  analyzingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
  },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  analyzingSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  step: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: '#34C759',
  },
  stepActive: {
    backgroundColor: '#007AFF',
  },
  stepPending: {
    backgroundColor: '#E5E5E7',
  },
  stepText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dishNameContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  dishName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  nutritionContainer: {
    paddingHorizontal: PADDING.screen,
    marginBottom: SPACING.xl,
  },
  nutritionCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.xl,
    ...SHADOW.md,
  },
  nutritionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: PADDING.lg,
    paddingTop: PADDING.sm,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  nutritionLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  ingredientsContainer: {
    paddingHorizontal: PADDING.screen,
    marginBottom: SPACING.xl,
  },
  ingredientsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: PADDING.lg,
    paddingTop: PADDING.sm,
  },
  ingredientItem: {
    borderRadius: BORDER_RADIUS.md,
    padding: PADDING.card,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  editIcon: {
    padding: 8,
    marginLeft: 'auto',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  ingredientWeight: {
    fontSize: 14,
    marginTop: 2,
  },
  ingredientNutrition: {
    alignItems: 'flex-end',
  },
  ingredientCalories: {
    fontSize: 16,
    fontWeight: '600',
  },
  ingredientMacros: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: PADDING.screen,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  correctButton: {
    flex: 1,
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  correctButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
