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
import ApiService from '../services/apiService';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
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
      setStats(statsData);
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


  const navigateToDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with time */}
        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => navigateToDate(-1)}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.calendarDate}>
            <Text style={styles.calendarDateText}>
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.calendarYearText}>
              {selectedDate.getFullYear()}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => navigateToDate(1)}
          >
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Calories Circle */}
        <View style={styles.caloriesContainer}>
          <View style={styles.caloriesCircle}>
            <View style={styles.caloriesInner}>
              <Text style={styles.caloriesNumber}>{stats.totalCalories}</Text>
              <Text style={styles.caloriesLabel}>calories</Text>
              <Text style={styles.caloriesGoal}>of {stats.goal.toLocaleString()} goal</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalProtein}g</Text>
            <Text style={styles.statLabel}>Protein</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalCarbs}g</Text>
            <Text style={styles.statLabel}>Carbs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalFat}g</Text>
            <Text style={styles.statLabel}>Fat</Text>
          </View>
        </View>


        {/* Recent Items */}
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent</Text>
          <View style={styles.recentEmpty}>
            <Ionicons name="restaurant" size={48} color="#C7C7CC" />
            <Text style={styles.recentEmptyText}>No recent items</Text>
            <Text style={styles.recentEmptySubtext}>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
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
    paddingVertical: 30,
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  recentEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  recentEmptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 16,
  },
  recentEmptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
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
});
