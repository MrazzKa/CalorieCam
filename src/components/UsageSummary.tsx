import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UsageSummaryProps {
  totalAnalyses: number;
  dailyLimit: number;
  remainingAnalyses: number;
  onUpgrade?: () => void;
}

export const UsageSummary: React.FC<UsageSummaryProps> = ({
  totalAnalyses,
  dailyLimit,
  remainingAnalyses,
  onUpgrade,
}) => {
  const usagePercentage = (totalAnalyses / dailyLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = remainingAnalyses <= 0;

  const getStatusColor = () => {
    if (isAtLimit) return '#E74C3C';
    if (isNearLimit) return '#F39C12';
    return '#2ECC71';
  };

  const getStatusText = () => {
    if (isAtLimit) return 'Daily limit reached';
    if (isNearLimit) return 'Approaching daily limit';
    return 'Usage within limits';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Usage</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${usagePercentage}%`,
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {totalAnalyses} / {dailyLimit} analyses
        </Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="analytics" size={20} color="#3498DB" />
          <Text style={styles.detailLabel}>Total Today</Text>
          <Text style={styles.detailValue}>{totalAnalyses}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="time" size={20} color="#F39C12" />
          <Text style={styles.detailLabel}>Remaining</Text>
          <Text style={styles.detailValue}>{remainingAnalyses}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="trending-up" size={20} color="#2ECC71" />
          <Text style={styles.detailLabel}>Limit</Text>
          <Text style={styles.detailValue}>{dailyLimit}</Text>
        </View>
      </View>

      {isNearLimit && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <Ionicons name="star" size={20} color="white" />
          <Text style={styles.upgradeButtonText}>Upgrade for More</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  upgradeButton: {
    backgroundColor: '#3498DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
