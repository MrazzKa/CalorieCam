import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeClosableModal } from './common/SwipeClosableModal';

interface StatisticsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ visible, onClose }) => {
  return (
    <SwipeClosableModal
      visible={visible}
      onClose={onClose}
      swipeDirection="down"
      enableSwipe={true}
      enableBackdropClose={true}
      animationType="fade"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Statistics</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Progress</Text>
            
            <View style={styles.progressCard}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Current Weight</Text>
                <Text style={styles.progressValue}>75.2 kg</Text>
              </View>
              
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Target Weight</Text>
                <Text style={styles.progressValue}>70.0 kg</Text>
              </View>
              
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Remaining</Text>
                <Text style={styles.progressValue}>5.2 kg</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.recordButton}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.recordButtonText}>Record Weight</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calories</Text>
            
            <View style={styles.caloriesCard}>
              <View style={styles.caloriesItem}>
                <Text style={styles.caloriesLabel}>Total</Text>
                <Text style={styles.caloriesValue}>2,450</Text>
              </View>
              
              <View style={styles.caloriesItem}>
                <Text style={styles.caloriesLabel}>Daily Average</Text>
                <Text style={styles.caloriesValue}>2,380</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SwipeClosableModal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 34,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  progressLabel: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498DB',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  caloriesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  caloriesValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
});
