import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface MainDashboardProps {
  onAnalyzePress: () => void;
  onStatsPress: () => void;
  onProfilePress: () => void;
  recentAnalyses: any[];
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onAnalyzePress, onStatsPress, onProfilePress, recentAnalyses }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const dailyStats = {
    caloriesRemaining: 2000,
    caloriesGoal: 2000,
    caloriesConsumed: 0,
    proteins: { current: 0, target: 150 },
    fats: { current: 0, target: 65 },
    carbs: { current: 0, target: 200 },
    burnedCalories: 0
  };

  const getDaysInWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.getDate().toString();
  };

  const formatDay = (date: Date) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[date.getDay() === 0 ? 6 : date.getDay() - 1];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getCalorieProgress = () => {
    if (dailyStats.caloriesGoal === 0) return 0;
    return (dailyStats.caloriesGoal - dailyStats.caloriesRemaining) / dailyStats.caloriesGoal;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.time}>20:27</Text>
          <Text style={styles.appTitle}>CalorieCam</Text>
          <TouchableOpacity style={styles.headerRight} onPress={onProfilePress}>
            <Ionicons name="person-circle-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dateSelector}>
          {getDaysInWeek().map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                selectedDate.toDateString() === date.toDateString() && styles.selectedDateItem,
                isToday(date) && styles.todayDateItem,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text
                style={[
                  styles.dateDay,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateDay,
                  isToday(date) && styles.todayDateDay,
                ]}
              >
                {formatDay(date)}
              </Text>
              <Text
                style={[
                  styles.dateNum,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateNum,
                  isToday(date) && styles.todayDateNum,
                ]}
              >
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <View style={styles.caloriesSection}>
            <View style={styles.calorieCircle}>
              <View style={[
                styles.calorieProgress,
                { transform: [{ rotate: `${getCalorieProgress() * 3.6}deg` }] }
              ]} />
              <View style={styles.calorieContent}>
                <Text style={styles.calorieNumber}>{dailyStats.caloriesRemaining}</Text>
                <Text style={styles.calorieLabel}>Calories Remaining</Text>
                <View style={styles.burnedCalories}>
                  <Ionicons name="flame" size={16} color="#FF6B6B" />
                  <Text style={styles.burnedText}>+{dailyStats.burnedCalories}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.macrosSection}>
            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>Proteins</Text>
                <Text style={styles.macroValue}>
                  {dailyStats.proteins.current}/{dailyStats.proteins.target}g
                </Text>
              </View>
              <View style={styles.macroProgress}>
                <View
                  style={[
                    styles.macroProgressBar,
                    { width: `${(dailyStats.proteins.current / dailyStats.proteins.target) * 100}%`, backgroundColor: '#FF6B6B' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>Fats</Text>
                <Text style={styles.macroValue}>
                  {dailyStats.fats.current}/{dailyStats.fats.target}g
                </Text>
              </View>
              <View style={styles.macroProgress}>
                <View
                  style={[
                    styles.macroProgressBar,
                    { width: `${(dailyStats.fats.current / dailyStats.fats.target) * 100}%`, backgroundColor: '#FFD166' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>
                  {dailyStats.carbs.current}/{dailyStats.carbs.target}g
                </Text>
              </View>
              <View style={styles.macroProgress}>
                <View
                  style={[
                    styles.macroProgressBar,
                    { width: `${(dailyStats.carbs.current / dailyStats.carbs.target) * 100}%`, backgroundColor: '#4ECDC4' },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.statsLink} onPress={onStatsPress}>
          <Text style={styles.statsLinkText}>View your statistics</Text>
          <Ionicons name="chevron-forward" size={16} color="#7F8C8D" />
        </TouchableOpacity>

        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recently</Text>
          
          {recentAnalyses.length > 0 ? (
            recentAnalyses.map((analysis, index) => (
              <View key={analysis.id} style={styles.recentCard}>
                <View style={styles.recentItem}>
                  <View style={styles.recentImage}>
                    <Ionicons name="restaurant" size={24} color="#7F8C8D" />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={styles.recentName}>{analysis.dishName}</Text>
                    <Text style={styles.recentCalories}>{analysis.calories} Calories</Text>
                    <Text style={styles.recentTime}>
                      {analysis.timestamp.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No dishes yet!</Text>
              <Text style={styles.emptySubtitle}>
                Eat something delicious, add it here and check out our Instagram @caloriecam!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={onAnalyzePress}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerRight: {
    padding: 5,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 45,
  },
  selectedDateItem: {
    backgroundColor: '#3498DB',
  },
  todayDateItem: {
    backgroundColor: '#E8F4FD',
  },
  dateDay: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  selectedDateDay: {
    color: 'white',
  },
  todayDateDay: {
    color: '#3498DB',
    fontWeight: '600',
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  selectedDateNum: {
    color: 'white',
  },
  todayDateNum: {
    color: '#3498DB',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  calorieCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 8,
    borderColor: '#E9ECEF',
  },
  calorieProgress: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#3498DB',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  calorieContent: {
    alignItems: 'center',
  },
  calorieNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  calorieLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 8,
  },
  burnedCalories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  burnedText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
  },
  macrosSection: {
    gap: 16,
  },
  macroItem: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  macroValue: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  macroProgress: {
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statsLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  recentSection: {
    marginBottom: 20,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  recentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  recentImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  recentCalories: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  recentTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
