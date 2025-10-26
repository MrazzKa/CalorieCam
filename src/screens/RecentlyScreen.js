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
import ApiService from '../services/apiService';

export default function RecentlyScreen() {
  const navigation = useNavigation();
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

  const renderRecentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recentItem}
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
          <Text style={styles.itemName}>{item.dishName}</Text>
          <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.itemNutrition}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.calories}</Text>
            <Text style={styles.nutritionLabel}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.protein}g</Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.carbs}g</Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.fat}g</Text>
            <Text style={styles.nutritionLabel}>fat</Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No Recent Items</Text>
      <Text style={styles.emptySubtitle}>
        Start by analyzing your first meal
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.emptyButtonText}>Analyze Food</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recently</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // Show filter options
          }}
        >
          <Ionicons name="options-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {recentItems.length > 0 ? (
        <FlatList
          data={recentItems}
          renderItem={renderRecentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  recentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
