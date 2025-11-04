import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import ApiService from '../services/apiService';
import { useTheme } from '../contexts/ThemeContext';
import { PADDING, SPACING, BORDER_RADIUS, SHADOW } from '../utils/designConstants';

export default function RecentlyScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock data - in real app this would come from database
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentItems();
  }, []);

  const loadRecentItems = async () => {
    try {
      setLoading(true);
      const meals = await ApiService.getMeals();
      setRecentItems(meals);
    } catch (error) {
      console.error('Error loading recent items:', error);
      // Use demo data when API is not available
      setRecentItems([
        {
          id: '1',
          name: 'Mixed Salad',
          totalCalories: 320,
          totalProtein: 15,
          totalCarbs: 25,
          totalFat: 18,
          imageUrl: 'https://via.placeholder.com/100x100/4CAF50/white?text=Salad',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Grilled Chicken',
          totalCalories: 450,
          totalProtein: 35,
          totalCarbs: 5,
          totalFat: 25,
          imageUrl: 'https://via.placeholder.com/100x100/FF9800/white?text=Chicken',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentItems();
    setRefreshing(false);
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderRecentItem = ({ item, index }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: index * 50 }}
    >
      <TouchableOpacity
        style={[styles.recentItem, { backgroundColor: colors.card }]}
        onPress={() => {
          // Navigate to detailed view
          navigation.navigate('AnalysisResults', {
            imageUri: item.imageUri,
            analysisResult: item,
            readOnly: true,
          });
        }}
      >
      <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.dishName}</Text>
          <Text style={[styles.itemDate, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.itemNutrition}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>{item.calories}</Text>
            <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>{item.protein}g</Text>
            <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>{item.carbs}g</Text>
            <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>{item.fat}g</Text>
            <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>fat</Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
    </MotiView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Recent Items</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Start by analyzing your first meal
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.emptyButtonText}>Analyze Food</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recently</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // Show filter options
          }}
        >
          <Ionicons name="options-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {recentItems.length > 0 ? (
        <FlatList
          data={recentItems}
          renderItem={renderRecentItem}
          keyExtractor={(item, index) => item.id || `item-${index}`}
          contentContainerStyle={[styles.listContainer, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING.screen,
    paddingVertical: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  filterButton: {
    padding: 4,
  },
  listContainer: {
    paddingHorizontal: PADDING.screen,
    paddingTop: SPACING.lg,
  },
  recentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.card,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  itemDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  itemNutrition: {
    flexDirection: 'row',
    gap: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
