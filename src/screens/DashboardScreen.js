import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import ApiService from '../services/apiService';
import AiAssistant from '../components/AiAssistant';
import { useTheme } from '../contexts/ThemeContext';
import { PADDING, SPACING, BORDER_RADIUS, SHADOW } from '../utils/designConstants';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plusScale] = useState(new Animated.Value(1));
  const [stats, setStats] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    goal: 2000,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [selectedDate])
  );

  const loadStats = async () => {
    try {
      const statsData = await ApiService.getStats('day');
      // Map API (/stats/dashboard) shape to UI state
      if (statsData && statsData.today && statsData.goals) {
        setStats({
          totalCalories: statsData.today.calories || 0,
          totalProtein: statsData.today.protein || 0,
          totalCarbs: statsData.today.carbs || 0,
          totalFat: statsData.today.fat || 0,
          goal: (statsData.goals && statsData.goals.calories) || 2000,
        });
      } else {
        setStats({
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          goal: 2000,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use fallback data when API is not available
      setStats({
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        goal: 2000,
      });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePlusPress = () => {
    Animated.sequence([
      Animated.timing(plusScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(plusScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show modal with options
    setShowModal(true);
  };

  const [showModal, setShowModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  const handleCameraPress = () => {
    console.log('Camera button pressed - navigating to Camera');
    setShowModal(false);
    navigation.navigate('Camera');
  };

  const handleGalleryPress = () => {
    console.log('Gallery button pressed - navigating to Gallery');
    setShowModal(false);
    navigation.navigate('Gallery');
  };

  const handleAiAssistantPress = () => {
    setShowAiAssistant(true);
  };


  const navigateToDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with time */}
        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(currentTime)}</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(currentTime)}</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => navigateToDate(-1)}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.calendarDate}>
            <Text style={[styles.calendarDateText, { color: colors.text }]}>
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.calendarYearText, { color: colors.textSecondary }]}>
              {selectedDate.getFullYear()}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => navigateToDate(1)}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Calories Circle */}
        <MotiView
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.caloriesContainer}
        >
          <View style={styles.caloriesCircle}>
            <View style={styles.caloriesInner}>
              <Text style={styles.caloriesNumber}>{stats.totalCalories}</Text>
              <Text style={styles.caloriesLabel}>calories</Text>
              <Text style={styles.caloriesGoal}>of {stats.goal.toLocaleString()} goal</Text>
            </View>
          </View>
        </MotiView>

        {/* Quick Stats */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 100 }}
          style={styles.statsContainer}
        >
          <MotiView
            from={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 150 }}
            style={styles.statItem}
          >
            <Text style={styles.statNumber}>{stats.totalProtein}g</Text>
            <Text style={styles.statLabel}>Protein</Text>
          </MotiView>
          <MotiView
            from={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 200 }}
            style={styles.statItem}
          >
            <Text style={styles.statNumber}>{stats.totalCarbs}g</Text>
            <Text style={styles.statLabel}>Carbs</Text>
          </MotiView>
          <MotiView
            from={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 250 }}
            style={styles.statItem}
          >
            <Text style={styles.statNumber}>{stats.totalFat}g</Text>
            <Text style={styles.statLabel}>Fat</Text>
          </MotiView>
        </MotiView>


        {/* AI Assistant Button */}
        <View style={styles.aiAssistantContainer}>
          <TouchableOpacity
            style={[styles.aiAssistantButton, { backgroundColor: colors.card }]}
            onPress={handleAiAssistantPress}
          >
            <View style={[styles.aiAssistantIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.aiAssistantContent}>
              <Text style={[styles.aiAssistantTitle, { color: colors.text }]}>AI Assistant</Text>
              <Text style={[styles.aiAssistantSubtitle, { color: colors.textSecondary }]}>
                Get personalized nutrition advice
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Recent Items */}
        <View style={styles.recentContainer}>
          <Text style={[styles.recentTitle, { color: colors.text }]}>Recent</Text>
          <View style={[styles.recentEmpty, { backgroundColor: colors.card }]}>
            <Ionicons name="restaurant" size={48} color={colors.textTertiary} />
            <Text style={[styles.recentEmptyText, { color: colors.textSecondary }]}>No recent items</Text>
            <Text style={[styles.recentEmptySubtext, { color: colors.textTertiary }]}>
              Start by taking a photo of your meal
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Plus Button */}
      <Animated.View
        style={[
          styles.plusButtonContainer,
          { transform: [{ scale: plusScale }] },
        ]}
      >
        <TouchableOpacity
          style={styles.plusButton}
          onPress={handlePlusPress}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Modal for Add Options */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Food</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                Choose how you want to add your meal
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCameraPress}
                >
                  <View style={styles.modalButtonIcon}>
                    <Ionicons name="camera" size={32} color="#007AFF" />
                  </View>
                  <Text style={styles.modalButtonTitle}>Take Photo</Text>
                  <Text style={styles.modalButtonSubtitle}>
                    Capture your meal with the camera
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleGalleryPress}
                >
                  <View style={styles.modalButtonIcon}>
                    <Ionicons name="images" size={32} color="#007AFF" />
                  </View>
                  <Text style={styles.modalButtonTitle}>Choose from Gallery</Text>
                  <Text style={styles.modalButtonSubtitle}>
                    Select a photo from your gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* AI Assistant Modal */}
      <AiAssistant
        visible={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.xl,
    paddingBottom: PADDING.md,
  },
  timeContainer: {
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  calendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING.xl,
    paddingHorizontal: PADDING.screen,
  },
  calendarButton: {
    padding: 10,
  },
  calendarDate: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  calendarDateText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  calendarYearText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 2,
  },
  caloriesContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  caloriesCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#E3F2FD',
  },
  caloriesInner: {
    alignItems: 'center',
  },
  caloriesNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#007AFF',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  caloriesGoal: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.xl,
    gap: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: PADDING.xl,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 80,
    flex: 1,
    ...SHADOW.sm,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  recentContainer: {
    paddingHorizontal: PADDING.screen,
    paddingBottom: 100,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  recentEmpty: {
    alignItems: 'center',
    paddingVertical: PADDING.huge,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOW.sm,
  },
  recentEmptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  recentEmptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  plusButtonContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  plusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
  },
  modalButtons: {
    gap: 16,
  },
  modalButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  modalButtonSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  aiAssistantContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  aiAssistantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aiAssistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiAssistantContent: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  aiAssistantSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
