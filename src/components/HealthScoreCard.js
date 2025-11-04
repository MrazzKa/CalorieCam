import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../i18n/hooks';
import { PADDING, SPACING, BORDER_RADIUS, SHADOW } from '../utils/designConstants';

export const HealthScoreCard = ({ healthScore }) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!healthScore) {
    return null;
  }

  const { score, grade, factors, feedback } = healthScore;

  const getGradeColor = () => {
    switch (grade) {
      case 'A': return colors.success;
      case 'B': return '#34C759';
      case 'C': return colors.warning;
      case 'D': return '#FF9500';
      case 'F': return colors.error;
      default: return colors.textTertiary;
    }
  };

  const getGradeIcon = () => {
    switch (grade) {
      case 'A': return 'checkmark-circle';
      case 'B': return 'checkmark-circle-outline';
      case 'C': return 'information-circle-outline';
      case 'D': return 'warning-outline';
      case 'F': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const gradeColor = getGradeColor();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="heart" size={24} color={gradeColor} />
          <Text style={[styles.title, { color: colors.text }]}>{t('healthScore.title')}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: gradeColor + '20' }]}>
          <Ionicons name={getGradeIcon()} size={20} color={gradeColor} />
          <Text style={[styles.scoreText, { color: gradeColor }]}>{score}</Text>
          <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
        </View>
      </View>

      {/* Score Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.inputBackground }]}>
          <MotiView
            from={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ type: 'spring', damping: 15, delay: 200 }}
            style={[styles.progressFill, { backgroundColor: gradeColor }]}
          />
        </View>
      </View>

      {/* Factors */}
      <View style={styles.factorsContainer}>
            <Text style={[styles.factorsTitle, { color: colors.textSecondary }]}>{t('healthScore.qualityFactors')}</Text>
        <View style={styles.factorsGrid}>
          <View style={styles.factorItem}>
            <Text style={[styles.factorLabel, { color: colors.textTertiary }]}>{t('healthScore.macroBalance')}</Text>
            <View style={[styles.factorBar, { backgroundColor: colors.inputBackground }]}>
              <View style={[styles.factorFill, { width: `${factors.macroBalance}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.factorValue, { color: colors.textSecondary }]}>
              {Math.round(factors.macroBalance)}%
            </Text>
          </View>
          
          <View style={styles.factorItem}>
            <Text style={[styles.factorLabel, { color: colors.textTertiary }]}>{t('healthScore.proteinQuality')}</Text>
            <View style={[styles.factorBar, { backgroundColor: colors.inputBackground }]}>
              <View style={[styles.factorFill, { width: `${factors.proteinQuality}%`, backgroundColor: colors.success }]} />
            </View>
            <Text style={[styles.factorValue, { color: colors.textSecondary }]}>
              {Math.round(factors.proteinQuality)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Feedback */}
      {feedback && feedback.length > 0 && (
        <View style={styles.feedbackContainer}>
            <Text style={[styles.feedbackTitle, { color: colors.textSecondary }]}>{t('healthScore.feedback')}</Text>
          {feedback.map((item, index) => (
            <View key={index} style={styles.feedbackItem}>
              <Ionicons 
                name={score >= 70 ? "checkmark-circle" : "information-circle"} 
                size={16} 
                color={score >= 70 ? colors.success : colors.warning} 
                style={styles.feedbackIcon}
              />
              <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    marginHorizontal: PADDING.screen,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
  },
  gradeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  factorsContainer: {
    marginBottom: SPACING.md,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  factorsGrid: {
    gap: SPACING.sm,
  },
  factorItem: {
    gap: 4,
  },
  factorLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  factorBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  factorFill: {
    height: '100%',
    borderRadius: 2,
  },
  factorValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  feedbackContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  feedbackIcon: {
    marginTop: 2,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

