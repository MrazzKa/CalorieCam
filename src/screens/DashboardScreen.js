import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import ApiService from '../services/apiService';
import AiAssistant from '../components/AiAssistant';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../../app/i18n/hooks';
import { HealthScoreCard } from '../components/HealthScoreCard';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { colors, tokens } = useTheme();
  const { t, language } = useI18n();
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
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [feedArticles, setFeedArticles] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [highlightMeal, setHighlightMeal] = useState(null);

  // Определяем функции ПЕРЕД их использованием в хуках
  const loadStats = React.useCallback(async () => {
    try {
      // Используем selectedDate для загрузки статистики по выбранной дате
      const statsData = await ApiService.getStats(selectedDate);
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
  }, [selectedDate]);

  const loadMonthlyStats = React.useCallback(async () => {
    try {
      setMonthlyLoading(true);
      const response = await ApiService.getMonthlyStats();
      setMonthlyStats(response);
    } catch (error) {
      console.error('Error loading monthly stats:', error);
      setMonthlyStats(null);
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  const loadArticles = React.useCallback(async () => {
    try {
      const [featured, feed] = await Promise.all([
        ApiService.getFeaturedArticles(),
        ApiService.getArticlesFeed(1, 5),
      ]);
      setFeaturedArticles(Array.isArray(featured) ? featured.slice(0, 3) : []);
      setFeedArticles(Array.isArray(feed?.articles) ? feed.articles.slice(0, 5) : []);
      
      // Дополнительная проверка на случай, если feed не объект
      if (!feed || typeof feed !== 'object' || !Array.isArray(feed.articles)) {
        console.warn('[DashboardScreen] Invalid feed response:', feed);
        setFeedArticles([]);
      }
    } catch {
      setFeaturedArticles([]);
      setFeedArticles([]);
    }
  }, []);

  const loadRecent = React.useCallback(async () => {
    try {
      // Используем selectedDate для загрузки meals по выбранной дате
      const meals = await ApiService.getMeals(selectedDate);
      const items = Array.isArray(meals) ? meals.slice(0, 5) : [];
      setRecentItems(items);
      const withInsights = items.find(item => item.healthInsights);
      if (withInsights?.healthInsights?.score) {
        setHighlightMeal({
          id: withInsights.id,
          name: withInsights.name || withInsights.dishName || t('analysis.title'),
          healthScore: withInsights.healthInsights,
        });
      } else {
        setHighlightMeal(null);
      }
    } catch {
      setRecentItems([]);
      setHighlightMeal(null);
    }
  }, [t, selectedDate]);

  // Теперь используем функции в хуках ПОСЛЕ их определения
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
      loadMonthlyStats();
      loadArticles();
      loadRecent();
    }, [loadStats, loadMonthlyStats, loadArticles, loadRecent])
  );

  useEffect(() => {
    loadStats();
    loadMonthlyStats();
    loadArticles();
    loadRecent();
  }, [selectedDate, loadStats, loadMonthlyStats, loadArticles, loadRecent]);

  const formatTime = (date) => {
    return date.toLocaleTimeString(language || 'en', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(language || 'en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRangeLabel = (range) => {
    if (!range?.from || !range?.to) {
      return null;
    }
    try {
      const fromDate = new Date(range.from);
      const toDate = new Date(range.to);
      return `${fromDate.toLocaleDateString(language || 'en', {
        month: 'short',
        day: 'numeric',
      })} – ${toDate.toLocaleDateString(language || 'en', {
        month: 'short',
        day: 'numeric',
      })}`;
    } catch {
      return null;
    }
  };

  const getMealTypeLabel = (mealType) => {
    switch (mealType) {
      case 'BREAKFAST':
        return t('dashboard.mealTypes.breakfast');
      case 'DINNER':
        return t('dashboard.mealTypes.dinner');
      case 'LUNCH':
      default:
        return t('dashboard.mealTypes.lunch');
    }
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
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const handleCameraPress = () => {
    console.log('Camera button pressed - navigating to Camera');
    setShowModal(false);
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Camera');
    }
  };

  const handleGalleryPress = () => {
    console.log('Gallery button pressed - navigating to Gallery');
    setShowModal(false);
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Gallery');
    }
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
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.calendarDate}>
            <Text style={styles.calendarDateText}>
              {selectedDate.toLocaleDateString(language || 'en', {
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
              <Text style={styles.caloriesLabel}>{t('dashboard.calories')}</Text>
              <Text style={styles.caloriesGoal}>{t('dashboard.ofGoal', { goal: stats.goal.toLocaleString() })}</Text>
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
            <Text style={styles.statLabel}>{t('dashboard.protein')}</Text>
          </MotiView>
          <MotiView
            from={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 200 }}
            style={styles.statItem}
          >
            <Text style={styles.statNumber}>{stats.totalCarbs}g</Text>
            <Text style={styles.statLabel}>{t('dashboard.carbs')}</Text>
          </MotiView>
          <MotiView
            from={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 250 }}
            style={styles.statItem}
          >
            <Text style={styles.statNumber}>{stats.totalFat}g</Text>
            <Text style={styles.statLabel}>{t('dashboard.fat')}</Text>
          </MotiView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 150 }}
          style={styles.monthlySection}
        >
          <View style={styles.monthlyHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.monthlyStats.title')}</Text>
            {formatRangeLabel(monthlyStats?.range) ? (
              <Text style={styles.sectionSubtle}>{formatRangeLabel(monthlyStats?.range)}</Text>
            ) : null}
          </View>

          {monthlyLoading ? (
            <View style={styles.monthlyEmpty}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.sectionSubtle}>{t('dashboard.monthlyStats.loading')}</Text>
            </View>
          ) : !monthlyStats || (monthlyStats?.topFoods?.length ?? 0) === 0 ? (
            <View style={styles.monthlyEmpty}>
              <Text style={styles.sectionSubtle}>{t('dashboard.monthlyStats.empty')}</Text>
            </View>
          ) : (
            <>
              <View style={styles.topFoodsContainer}>
                <Text style={styles.sectionSubtitle}>{t('dashboard.monthlyStats.topFoods')}</Text>
                {(monthlyStats.topFoods || []).slice(0, 5).map((food, index) => (
                  <View key={`${food.label}-${index}`} style={styles.topFoodRow}>
                    <Text style={styles.topFoodRank}>{index + 1}</Text>
                    <View style={styles.topFoodContent}>
                      <Text numberOfLines={1} style={styles.topFoodLabel}>{food.label}</Text>
                      <Text style={styles.topFoodMeta}>
                        {t('dashboard.monthlyStats.foodMeta', {
                          count: food.count,
                          calories: Math.round(food.totalCalories || 0),
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.mealDistributionContainer}>
                <Text style={styles.sectionSubtitle}>{t('dashboard.monthlyStats.mealDistribution')}</Text>
                {(monthlyStats.mealTypeDistribution || []).map((entry) => (
                  <View key={entry.mealType} style={styles.mealDistributionRow}>
                    <View style={styles.mealDistributionHeader}>
                      <Text style={styles.mealDistributionLabel}>{getMealTypeLabel(entry.mealType)}</Text>
                      <Text style={styles.mealDistributionMeta}>
                        {Math.round(entry.percentage || 0)}%
                      </Text>
                    </View>
                    <View style={styles.mealDistributionBarTrack}>
                      <View
                        style={[
                          styles.mealDistributionBarFill,
                          {
                            width: `${Math.min(100, Math.round(entry.percentage || 0))}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.mealDistributionMetaSmall}>
                      {t('dashboard.monthlyStats.mealMeta', {
                        count: entry.count,
                        calories: Math.round(entry.totalCalories || 0),
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </MotiView>

        {/* Articles Preview */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 150 }}
          style={styles.articlesSection}
        >
          <View style={styles.articlesHeader}>
            <Text style={styles.articlesTitle}>{t('dashboard.articles')}</Text>
            <TouchableOpacity onPress={() => {
              if (navigation && typeof navigation.navigate === 'function') {
                navigation.navigate('Articles');
              }
            }}>
              <Text style={styles.articlesViewAll}>{t('common.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {featuredArticles.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList}>
              {(featuredArticles || []).map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.articleCardSmall}
                  onPress={() => {
                    if (navigation && typeof navigation.navigate === 'function') {
                      navigation.navigate('ArticleDetail', { slug: a.slug });
                    }
                  }}
                >
                  <View style={styles.featuredBadgeSmall}>
                    <Ionicons name="star" size={12} color={colors.inverseText} />
                  </View>
                  <Text numberOfLines={2} style={styles.articleTitleSmall}>{a.title}</Text>
                  {a.excerpt ? (
                    <Text numberOfLines={2} style={styles.articleExcerptSmall}>{a.excerpt}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {(feedArticles || []).map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.articleRow}
              onPress={() => navigation.navigate('ArticleDetail', { slug: a.slug })}
            >
              <View style={styles.articleRowContent}>
                <Text numberOfLines={2} style={styles.articleRowTitle}>{a.title}</Text>
                {a.excerpt ? (
                  <Text numberOfLines={2} style={styles.articleRowExcerpt}>{a.excerpt}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </MotiView>

        {/* AI Assistant Button */}
        {highlightMeal?.healthScore && (
          <View style={styles.highlightSection}>
            <Text style={styles.highlightTitle}>
              {t('dashboard.healthScoreTitle', { meal: highlightMeal.name })}
            </Text>
            <HealthScoreCard healthScore={highlightMeal.healthScore} />
            <Text style={styles.highlightSubtitle}>
              {t('dashboard.healthScoreSubtitle')}
            </Text>
          </View>
        )}

        <View style={styles.aiAssistantContainer}>
          <TouchableOpacity style={styles.aiAssistantButton} onPress={handleAiAssistantPress}>
            <View style={styles.aiAssistantIcon}>
              <Ionicons name="chatbubble" size={24} color={colors.onPrimary || colors.inverseText} />
            </View>
            <View style={styles.aiAssistantContent}>
              <Text style={styles.aiAssistantTitle}>{t('dashboard.aiAssistant')}</Text>
              <Text style={styles.aiAssistantSubtitle}>
                {t('dashboard.aiAssistantSubtitle')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Recent Items */}
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>{t('dashboard.recent')}</Text>
          {recentItems && recentItems.length > 0 ? (
            (recentItems || []).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.articleRow}
                onPress={() => {
                  if (navigation && typeof navigation.navigate === 'function') {
                    navigation.navigate('AnalysisResults', { analysisResult: item, readOnly: true });
                  }
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.articleRowTitle}>{item.name || item.dishName || t('dashboard.mealFallback')}</Text>
                  <Text numberOfLines={1} style={styles.articleRowExcerpt}>
                    {t('dashboard.recentMacroSummary', {
                      calories: item.totalCalories ?? item.calories ?? 0,
                      protein: item.totalProtein ?? item.protein ?? 0,
                      carbs: item.totalCarbs ?? item.carbs ?? 0,
                      fat: item.totalFat ?? item.fat ?? 0,
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.recentEmpty}>
              <Ionicons name="restaurant" size={48} color={colors.textTertiary} />
              <Text style={styles.recentEmptyText}>{t('dashboard.recentEmptyTitle')}</Text>
              <Text style={styles.recentEmptySubtext}>{t('dashboard.recentEmptySubtitle')}</Text>
            </View>
          )}
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
          <Ionicons name="add" size={32} color={colors.onPrimary || colors.inverseText} />
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
                <Text style={styles.modalTitle}>{t('dashboard.addFood.title')}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                {t('dashboard.addFood.subtitle')}
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCameraPress}
                >
                  <View style={styles.modalButtonIcon}>
                    <Ionicons name="camera" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.modalButtonTitle}>{t('dashboard.addFood.camera.title')}</Text>
                  <Text style={styles.modalButtonSubtitle}>
                    {t('dashboard.addFood.camera.description')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleGalleryPress}
                >
                  <View style={styles.modalButtonIcon}>
                    <Ionicons name="images" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.modalButtonTitle}>{t('dashboard.addFood.gallery.title')}</Text>
                  <Text style={styles.modalButtonSubtitle}>
                    {t('dashboard.addFood.gallery.description')}
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

const createStyles = (tokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: tokens.spacing.xl,
      paddingTop: tokens.spacing.xxxl,
      paddingBottom: tokens.spacing.md,
    },
    timeContainer: {
      alignItems: 'flex-start',
      gap: tokens.spacing.xs,
    },
    timeText: {
      fontSize: 32,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    dateText: {
      fontSize: 16,
      color: tokens.colors.textSecondary,
    },
    calendarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing.xl,
      paddingHorizontal: tokens.spacing.xl,
      gap: tokens.spacing.xl,
    },
    calendarButton: {
      padding: tokens.spacing.sm,
    },
    calendarDate: {
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    calendarDateText: {
      fontSize: 24,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    calendarYearText: {
      fontSize: 16,
      color: tokens.colors.textSecondary,
    },
    caloriesContainer: {
      alignItems: 'center',
      paddingVertical: tokens.spacing.xxxl,
    },
    caloriesCircle: {
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: tokens.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: tokens.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 12,
      borderWidth: 3,
      borderColor: tokens.colors.primaryTint,
    },
    caloriesInner: {
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    caloriesNumber: {
      fontSize: 42,
      fontWeight: '800',
      color: tokens.colors.primary,
    },
    caloriesLabel: {
      fontSize: 16,
      color: tokens.colors.textSecondary,
    },
    caloriesGoal: {
      fontSize: 14,
      color: tokens.colors.textTertiary,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: tokens.spacing.xl,
      paddingVertical: tokens.spacing.xl,
      gap: tokens.spacing.md,
    },
    statItem: {
      alignItems: 'center',
      backgroundColor: tokens.colors.card,
      paddingVertical: tokens.spacing.xl,
      paddingHorizontal: tokens.spacing.xl,
      borderRadius: tokens.radii.lg,
      minWidth: 80,
      flex: 1,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    statLabel: {
      fontSize: 14,
      color: tokens.colors.textSecondary,
    },
    articlesSection: {
      paddingHorizontal: tokens.spacing.xl,
      marginBottom: tokens.spacing.xl,
      gap: tokens.spacing.md,
    },
    articlesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    articlesTitle: {
      fontSize: tokens.typography.headingS.fontSize,
      fontWeight: tokens.typography.headingS.fontWeight,
      color: tokens.colors.textPrimary,
    },
    articlesViewAll: {
      color: tokens.colors.primary,
      fontWeight: tokens.typography.bodyStrong.fontWeight,
    },
    featuredList: {
      marginBottom: tokens.spacing.md,
    },
    articleCardSmall: {
      width: 200,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.md,
      marginRight: tokens.spacing.md,
      backgroundColor: tokens.colors.card,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
    },
    featuredBadgeSmall: {
      position: 'absolute',
      top: tokens.spacing.xs,
      right: tokens.spacing.xs,
      paddingHorizontal: tokens.spacing.xs,
      paddingVertical: tokens.spacing.xxs,
      borderRadius: tokens.radii.sm,
      backgroundColor: tokens.colors.primary,
    },
    articleTitleSmall: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: tokens.spacing.xs,
      color: tokens.colors.textPrimary,
    },
    articleExcerptSmall: {
      fontSize: 13,
      color: tokens.colors.textSecondary,
    },
    articleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.md,
      marginBottom: tokens.spacing.sm,
      backgroundColor: tokens.colors.card,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
    },
    articleRowContent: {
      flex: 1,
      gap: tokens.spacing.xs,
      paddingRight: tokens.spacing.sm,
    },
    articleRowTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    articleRowExcerpt: {
      fontSize: 13,
      color: tokens.colors.textSecondary,
    },
    highlightSection: {
      paddingHorizontal: tokens.spacing.xl,
      marginBottom: tokens.spacing.xl,
      gap: tokens.spacing.md,
    },
    highlightTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    highlightSubtitle: {
      fontSize: 13,
      color: tokens.colors.textSecondary,
    },
    aiAssistantContainer: {
      paddingHorizontal: tokens.spacing.xl,
      paddingBottom: tokens.spacing.xl,
    },
    aiAssistantButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: tokens.spacing.lg,
      borderRadius: tokens.radii.lg,
      backgroundColor: tokens.colors.card,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
    },
    aiAssistantIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: tokens.spacing.md,
      backgroundColor: tokens.colors.primary,
    },
    aiAssistantContent: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    aiAssistantTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    aiAssistantSubtitle: {
      fontSize: 14,
      color: tokens.colors.textSecondary,
    },
    recentContainer: {
      paddingHorizontal: tokens.spacing.xl,
      paddingBottom: tokens.spacing.gutter,
      gap: tokens.spacing.md,
    },
    recentTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    recentEmpty: {
      alignItems: 'center',
      paddingVertical: tokens.spacing.gutter,
      borderRadius: tokens.radii.lg,
      backgroundColor: tokens.colors.card,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
      gap: tokens.spacing.md,
    },
    recentEmptyText: {
      fontSize: 18,
      fontWeight: '500',
      color: tokens.colors.textSecondary,
    },
    recentEmptySubtext: {
      fontSize: 14,
      textAlign: 'center',
      color: tokens.colors.textTertiary,
    },
    plusButtonContainer: {
      position: 'absolute',
      bottom: tokens.spacing.xxl,
      alignSelf: 'center',
    },
    plusButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: tokens.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: tokens.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
      borderWidth: 2,
      borderColor: tokens.colors.surface,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: tokens.states.scrim,
      justifyContent: 'flex-end',
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: tokens.colors.card,
      borderTopLeftRadius: tokens.radii.xl,
      borderTopRightRadius: tokens.radii.xl,
      paddingTop: tokens.spacing.xl,
      paddingBottom: tokens.spacing.gutter,
      paddingHorizontal: tokens.spacing.xl,
      shadowColor: tokens.states.cardShadow?.shadowColor || 'rgba(0,0,0,0.2)',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacing.sm,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    modalSubtitle: {
      fontSize: 16,
      color: tokens.colors.textSecondary,
      marginBottom: tokens.spacing.gutter,
    },
    modalButtons: {
      gap: tokens.spacing.lg,
    },
    modalButton: {
      backgroundColor: tokens.colors.surfaceMuted,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.xl,
      alignItems: 'center',
      gap: tokens.spacing.sm,
    },
    modalButtonIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: tokens.colors.primaryTint,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalButtonTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    modalButtonSubtitle: {
      fontSize: 14,
      color: tokens.colors.textSecondary,
      textAlign: 'center',
    },
    monthlySection: {
      paddingHorizontal: tokens.spacing.xl,
      marginBottom: tokens.spacing.xl,
      gap: tokens.spacing.md,
    },
    monthlyHeader: {
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    sectionTitle: {
      fontSize: tokens.typography.headingM.fontSize,
      fontWeight: tokens.typography.headingM.fontWeight,
      color: tokens.colors.textPrimary,
    },
    sectionSubtle: {
      fontSize: 14,
      color: tokens.colors.textSecondary,
    },
    monthlyEmpty: {
      alignItems: 'center',
      paddingVertical: tokens.spacing.gutter,
      borderRadius: tokens.radii.lg,
      backgroundColor: tokens.colors.card,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
      gap: tokens.spacing.md,
    },
    topFoodsContainer: {
      backgroundColor: tokens.colors.surfaceMuted,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.md,
      marginBottom: tokens.spacing.md,
    },
    sectionSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.sm,
    },
    topFoodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.borderMuted,
    },
    topFoodRank: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
      marginRight: tokens.spacing.sm,
    },
    topFoodContent: {
      flex: 1,
    },
    topFoodLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    topFoodMeta: {
      fontSize: 12,
      color: tokens.colors.textSecondary,
    },
    mealDistributionContainer: {
      backgroundColor: tokens.colors.surfaceMuted,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.md,
    },
    mealDistributionRow: {
      marginBottom: tokens.spacing.sm,
    },
    mealDistributionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacing.xs,
    },
    mealDistributionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    mealDistributionMeta: {
      fontSize: 12,
      color: tokens.colors.textSecondary,
    },
    mealDistributionBarTrack: {
      height: 8,
      backgroundColor: tokens.colors.borderMuted,
      borderRadius: 4,
      marginBottom: tokens.spacing.xs,
    },
    mealDistributionBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    mealDistributionMetaSmall: {
      fontSize: 12,
      color: tokens.colors.textSecondary,
    },
  });
