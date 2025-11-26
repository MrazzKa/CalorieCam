import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Switch, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, useReducedMotion } from 'moti';
import ApiService from '../services/apiService';
import { useTheme, useDesignTokens } from '../contexts/ThemeContext';
import { useI18n } from '../../app/i18n/hooks';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { clientLog } from '../utils/clientLog';

// Safe imports with fallbacks
let AppCard;
let PrimaryButton;

try {
  AppCard = require('../components/common/AppCard').default;
} catch (e) {
  console.warn('[ProfileScreen] AppCard not found, using fallback');
  AppCard = ({ children, style, ...props }) => (
    <View style={style}>{children}</View>
  );
}

try {
  PrimaryButton = require('../components/common/PrimaryButton').default;
} catch (e) {
  console.warn('[ProfileScreen] PrimaryButton not found, using fallback');
  PrimaryButton = ({ title, onPress, loading, style, ...props }) => (
    <TouchableOpacity style={style} onPress={onPress} disabled={loading}>
      <Text>{loading ? 'Loading...' : title}</Text>
    </TouchableOpacity>
  );
}

const ProfileScreen = () => {
  const { t, language, changeLanguage, availableLanguages } = useI18n();
  const themeContext = useTheme();
  const authContext = useAuth();
  
  // Safe destructuring with fallbacks
  const tokens = themeContext?.tokens || {};
  const colors = themeContext?.colors || {};
  const isDark = themeContext?.isDark || false;
  const themeMode = themeContext?.themeMode || 'light';
  // Ensure toggleTheme is always a function
  const toggleTheme = useCallback((mode) => {
    if (themeContext?.toggleTheme && typeof themeContext.toggleTheme === 'function') {
      themeContext.toggleTheme(mode);
    }
  }, [themeContext]);
  const signOut = useCallback(async () => {
    if (authContext?.signOut && typeof authContext.signOut === 'function') {
      await authContext.signOut();
    }
  }, [authContext]);
  
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const reduceMotion = useReducedMotion();

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    height: 0,
    weight: 0,
    age: 0,
    dailyCalories: 0,
    preferences: null,
  });
  const [subscription, setSubscription] = useState({
    planId: 'free',
    billingCycle: 'lifetime',
  });
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [pendingPlan, setPendingPlan] = useState('free');
  const deviceTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const [notificationPreferences, setNotificationPreferences] = useState({
    dailyPushEnabled: false,
    dailyPushHour: 8,
    timezone: deviceTimezone,
  });
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const initials = useMemo(() => {
    const parts = [profile.firstName, profile.lastName].filter(Boolean);
    if (parts.length === 0 && profile.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    if (parts.length === 0) {
      return 'ES';
    }
    return parts
      .map((value) => value.trim().charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [profile.firstName, profile.lastName, profile.email]);

  const loadProfile = useCallback(async () => {
    try {
      const result = await ApiService.getUserProfile();
      if (result) {
        const userProfile = result.userProfile || result.profile || {};
        const preferences =
          userProfile.preferences ||
          result.preferences ||
          null;
        const subscriptionPref =
          preferences?.subscription || {};
        setProfile({
          firstName: userProfile.firstName || result.firstName || '',
          lastName: userProfile.lastName || result.lastName || '',
          email: result.email || '',
          height: userProfile.height || result.height || 0,
          weight: userProfile.weight || result.weight || 0,
          age: userProfile.age || result.age || 0,
          dailyCalories: userProfile.dailyCalories || result.dailyCalories || 0,
          preferences,
        });
        setSubscription({
          planId: subscriptionPref.planId || 'free',
          billingCycle:
            subscriptionPref.billingCycle ||
            (subscriptionPref.planId === 'free' ? 'lifetime' : 'monthly'),
        });
        setPendingPlan(subscriptionPref.planId || 'free');
      }
    } catch (error) {
      console.warn('Unable to load profile, using demo data.', error);
      setProfile({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@eatsense.ch',
        height: 170,
        weight: 70,
        age: 28,
        dailyCalories: 2000,
        preferences: null,
      });
      setSubscription({
        planId: 'free',
        billingCycle: 'lifetime',
      });
      setPendingPlan('free');
    }
  }, []);

  const loadNotificationPreferences = useCallback(async () => {
    try {
      setNotificationLoading(true);
      const prefs = await ApiService.getNotificationPreferences();
      if (prefs) {
        setNotificationPreferences({
          dailyPushEnabled: !!prefs.dailyPushEnabled,
          dailyPushHour: typeof prefs.dailyPushHour === 'number' ? prefs.dailyPushHour : 8,
          timezone: prefs.timezone || deviceTimezone,
        });
      }
    } catch (error) {
      console.warn('Unable to load notification preferences', error);
      setNotificationPreferences((prev) => ({ ...prev, timezone: deviceTimezone }));
    } finally {
      setNotificationLoading(false);
    }
  }, [deviceTimezone]);

  useEffect(() => {
    loadProfile();
    loadNotificationPreferences();
  }, [loadProfile, loadNotificationPreferences]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await ApiService.updateUserProfile(profile);
      Alert.alert(t('profile.savedTitle'), t('profile.savedMessage'));
      setEditing(false);
    } catch (error) {
      console.error('Profile update failed', error);
      Alert.alert(t('profile.errorTitle'), t('profile.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const reminderOptions = [6, 8, 12, 18, 20];
  const planOptions = [
    {
      id: 'free',
      name: 'EatSense Free',
      price: '$0 forever',
      billingCycle: 'lifetime',
      description: 'Start tracking meals with essential features.',
      features: ['3 AI analyses per day', 'Calorie tracking', 'Basic statistics'],
      badge: 'Included',
    },
    {
      id: 'pro_monthly',
      name: 'EatSense Pro',
      price: '$9.99 / month',
      billingCycle: 'monthly',
      description: 'Unlock unlimited AI tools with flexible billing.',
      features: [
        'Unlimited AI food analysis',
        'Advanced nutrition insights',
        'Personalized coaching tips',
      ],
      badge: 'Most Popular',
    },
    {
      id: 'pro_annual',
      name: 'EatSense Pro',
      price: '$79.99 / year',
      billingCycle: 'annual',
      description: 'Best value — save 33% vs monthly billing.',
      features: [
        'Everything in Pro Monthly',
        'Exclusive annual webinars',
        'Early access to new features',
      ],
      badge: 'Save 33%',
    },
  ];

  const getPlanDetails = (planId) => {
    const plan = planOptions.find((plan) => plan.id === planId) || planOptions[0];
    // Ensure plan has features array
    if (!plan || !plan.features || !Array.isArray(plan.features)) {
      return {
        ...plan,
        features: plan?.features || [],
      };
    }
    return plan;
  };

  const formatReminderTime = (hour) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return date.toLocaleTimeString(language || 'en', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNotificationToggle = async (value) => {
    try {
      setNotificationSaving(true);
      const updated = await ApiService.updateNotificationPreferences({
        dailyPushEnabled: value,
        timezone: notificationPreferences.timezone || deviceTimezone,
        dailyPushHour: notificationPreferences.dailyPushHour,
      });
      setNotificationPreferences({
        dailyPushEnabled: !!updated.dailyPushEnabled,
        dailyPushHour: typeof updated.dailyPushHour === 'number' ? updated.dailyPushHour : notificationPreferences.dailyPushHour,
        timezone: updated.timezone || notificationPreferences.timezone || deviceTimezone,
      });
    } catch (error) {
      console.error('Failed to update push preferences', error);
      Alert.alert(t('profile.notificationsErrorTitle'), t('profile.notificationsErrorMessage'));
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleNotificationHourChange = async () => {
    const currentIndex = reminderOptions.indexOf(notificationPreferences.dailyPushHour);
    const nextHour = reminderOptions[(currentIndex + 1 + reminderOptions.length) % reminderOptions.length];
    try {
      setNotificationSaving(true);
      const updated = await ApiService.updateNotificationPreferences({
        dailyPushEnabled: notificationPreferences.dailyPushEnabled,
        dailyPushHour: nextHour,
        timezone: notificationPreferences.timezone || deviceTimezone,
      });
      setNotificationPreferences({
        dailyPushEnabled: !!updated.dailyPushEnabled,
        dailyPushHour: typeof updated.dailyPushHour === 'number' ? updated.dailyPushHour : nextHour,
        timezone: updated.timezone || notificationPreferences.timezone || deviceTimezone,
      });
    } catch (error) {
      console.error('Failed to update reminder hour', error);
      Alert.alert(t('profile.notificationsErrorTitle'), t('profile.notificationsErrorMessage'));
    } finally {
      setNotificationSaving(false);
    }
  };

  const handlePlanChange = async (planId) => {
    const selectedPlan = planOptions.find((plan) => plan.id === planId);
    if (!selectedPlan) {
      return;
    }
    try {
      setPlanSaving(true);
      // Wrap plan selection in preferences.subscription (same as OnboardingScreen)
      await ApiService.updateUserProfile({
        preferences: {
          ...(profile.preferences || {}),
          subscription: {
            ...(profile.preferences?.subscription || {}),
            planId: selectedPlan.id,
            billingCycle: selectedPlan.billingCycle,
          },
        },
      });
      setSubscription({
        planId: selectedPlan.id,
        billingCycle: selectedPlan.billingCycle,
      });
      setPendingPlan(selectedPlan.id);
      setPlanModalVisible(false);
      Alert.alert(
        t('profile.planUpdatedTitle') || 'Plan updated',
        t('profile.planUpdatedMessage') ||
          'Your subscription preference has been saved.'
      );
    } catch (error) {
      console.error('Failed to update plan', error);
      Alert.alert(
        t('profile.errorTitle'),
        t('profile.planUpdateError') || 'Unable to update plan right now.'
      );
    } finally {
      setPlanSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccountTitle') || 'Delete Account',
      t('profile.deleteAccountMessage') || 'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: t('profile.deleteAccountCancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('profile.deleteAccountConfirm') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              if (ApiService && typeof ApiService.deleteAccount === 'function') {
                await ApiService.deleteAccount();
              } else {
                await clientLog('Profile:deleteAccountNotAvailable').catch(() => {});
              }
              
              // Clear tokens
              if (ApiService && typeof ApiService.setToken === 'function') {
                await ApiService.setToken(null, null);
              }
              
              // Sign out - safe call
              if (signOut && typeof signOut === 'function') {
                await signOut();
              } else {
                await clientLog('Profile:signOutNotAvailable').catch(() => {});
              }
              
              // Show success message
              Alert.alert(t('profile.deleteAccountSuccess') || 'Account deleted', '', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigation will be handled by App.js when isAuthenticated becomes false
                  },
                },
              ]);
            } catch (error) {
              console.error('[ProfileScreen] Failed to delete account:', error);
              await clientLog('Profile:deleteAccountError', {
                message: error?.message || String(error),
              }).catch(() => {});
              Alert.alert(
                t('profile.errorTitle') || 'Error',
                t('profile.deleteAccountError') || 'Failed to delete account'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const metrics = [
    { label: t('profile.metricWeight'), value: `${profile.weight || '--'} kg`, icon: 'barbell' },
    { label: t('profile.metricHeight'), value: `${profile.height || '--'} cm`, icon: 'body' },
    { label: t('profile.metricAge'), value: `${profile.age || '--'}`, icon: 'calendar' },
    { label: t('profile.metricCalories'), value: `${profile.dailyCalories || '--'} kcal`, icon: 'flame' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <MotiView
          from={reduceMotion ? undefined : { opacity: 0, translateY: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 320 }}
        >
          <AppCard style={styles.heroCard} padding="xl">
            <View style={styles.heroHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroEyebrow}>{t('profile.welcomeBack')}</Text>
                <Text style={styles.heroTitle}>
                  {profile.firstName || t('profile.defaultName')} {profile.lastName}
                </Text>
                <Text style={styles.heroSubtitle}>{profile.email}</Text>
              </View>
            </View>
            <View style={styles.metricsRow}>
              {(metrics || []).map((metric, index) => (
                <MotiView
                  key={metric.label}
                  from={reduceMotion ? undefined : { opacity: 0, translateY: 8 }}
                  animate={reduceMotion ? undefined : { opacity: 1, translateY: 0 }}
                  transition={{
                    type: 'timing',
                    duration: 260,
                    delay: reduceMotion ? 0 : index * 80,
                  }}
                  style={styles.metricWrapper}
                >
                  <View style={styles.metricCard}>
                    <View style={styles.metricIcon}>
                      <Ionicons name={metric.icon} size={18} color={tokens.colors.primary} />
                    </View>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                  </View>
                </MotiView>
              ))}
            </View>
            <PrimaryButton
              title={editing ? t('common.save') : t('profile.editProfile')}
              onPress={editing && typeof handleSave === 'function' ? handleSave : typeof setEditing === 'function' ? () => setEditing(true) : () => {}}
              loading={loading}
              style={styles.heroButton}
            />
          </AppCard>
        </MotiView>

        <AppCard style={styles.planCard}>
          <Text style={styles.sectionTitle}>
            {t('profile.subscriptionTitle') || 'Subscription'}
          </Text>
          <View style={styles.planSummary}>
            <View style={styles.planSummaryText}>
              <Text style={styles.planSummaryName}>
                {getPlanDetails(subscription.planId).name}
              </Text>
              <Text style={styles.planSummaryPrice}>
                {getPlanDetails(subscription.planId).price}
              </Text>
              <Text style={styles.planSummaryDescription}>
                {getPlanDetails(subscription.planId).description}
              </Text>
            </View>
            <PrimaryButton
              title={t('profile.changePlan') || 'Change plan'}
              onPress={() => {
                setPendingPlan(subscription.planId);
                setPlanModalVisible(true);
              }}
              style={styles.planChangeButton}
            />
          </View>
          <View style={styles.planSummaryFeatures}>
            {(getPlanDetails(subscription.planId).features || []).map((feature) => (
              <View key={feature} style={styles.planFeatureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={tokens.colors?.success ?? '#34C759'}
                />
                <Text style={styles.planFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.planMeta}>
            {subscription.billingCycle === 'annual'
              ? t('profile.billingAnnual') || 'Billed annually'
              : subscription.billingCycle === 'monthly'
              ? t('profile.billingMonthly') || 'Billed monthly'
              : t('profile.billingFree') || 'Free forever'}
          </Text>
        </AppCard>

        {editing ? (
          <AppCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>{t('profile.details')}</Text>
            <View style={styles.fieldRow}>
              <ProfileField
                label={t('profile.firstName')}
                value={profile.firstName}
                onChangeText={(text) => setProfile((prev) => ({ ...prev, firstName: text }))}
              />
              <ProfileField
                label={t('profile.lastName')}
                value={profile.lastName}
                onChangeText={(text) => setProfile((prev) => ({ ...prev, lastName: text }))}
              />
            </View>
            <ProfileField
              label={t('profile.email')}
              value={profile.email}
              keyboardType="email-address"
              onChangeText={(text) => setProfile((prev) => ({ ...prev, email: text }))}
            />
            <View style={styles.fieldRow}>
              <ProfileField
                label={t('profile.height')}
                value={profile.height ? String(profile.height) : ''}
                keyboardType="numeric"
                onChangeText={(text) => setProfile((prev) => ({ ...prev, height: parseInt(text, 10) || 0 }))}
              />
              <ProfileField
                label={t('profile.weight')}
                value={profile.weight ? String(profile.weight) : ''}
                keyboardType="numeric"
                onChangeText={(text) => setProfile((prev) => ({ ...prev, weight: parseInt(text, 10) || 0 }))}
              />
            </View>
            <View style={styles.fieldRow}>
              <ProfileField
                label={t('profile.age')}
                value={profile.age ? String(profile.age) : ''}
                keyboardType="numeric"
                onChangeText={(text) => setProfile((prev) => ({ ...prev, age: parseInt(text, 10) || 0 }))}
              />
              <ProfileField
                label={t('profile.dailyCalories')}
                value={profile.dailyCalories ? String(profile.dailyCalories) : ''}
                keyboardType="numeric"
                onChangeText={(text) => setProfile((prev) => ({ ...prev, dailyCalories: parseInt(text, 10) || 0 }))}
              />
            </View>
            <PrimaryButton
              title={t('common.save')}
              onPress={typeof handleSave === 'function' ? handleSave : () => {}}
              loading={loading}
              style={styles.formSaveButton}
            />
          </AppCard>
        ) : null}

        <AppCard style={styles.preferencesCard}>
          <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>{t('profile.language')}</Text>
            <LanguageSelector
              selectedLanguage={language}
              languages={availableLanguages}
              onLanguageChange={changeLanguage}
            />
          </View>
          <View style={[styles.preferenceRow, styles.themeRow]}>
            <View>
              <Text style={styles.preferenceLabel}>{t('profile.theme')}</Text>
              <Text style={styles.preferenceCaption}>
                {themeMode === 'system' ? t('profile.systemTheme') : isDark ? t('profile.darkModeSubtitle') : t('profile.lightMode')}
              </Text>
            </View>
            <View style={styles.themeToggles}>
              <TouchableOpacity
                style={[styles.themeChip, !isDark && styles.themeChipActive]}
                onPress={() => {
                  if (typeof toggleTheme === 'function') {
                    toggleTheme('light');
                  }
                }}
              >
                <Ionicons name="partly-sunny" size={18} color={!isDark ? tokens.colors.onPrimary : tokens.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeChip, isDark && styles.themeChipActive]}
                onPress={() => {
                  if (typeof toggleTheme === 'function') {
                    toggleTheme('dark');
                  }
                }}
              >
                <Ionicons name="moon" size={18} color={isDark ? tokens.colors.onPrimary : tokens.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeChip, themeMode === 'system' && styles.themeChipActive]}
                onPress={() => {
                  if (typeof toggleTheme === 'function') {
                    toggleTheme('system');
                  }
                }}
              >
                <Ionicons name="phone-portrait" size={18} color={themeMode === 'system' ? tokens.colors.onPrimary : tokens.colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.preferenceRow}>
            <View style={styles.notificationCopy}>
              <Text style={styles.preferenceLabel}>{t('profile.notificationsDailyTitle')}</Text>
              <Text style={styles.notificationDescription}>
                {notificationPreferences.dailyPushEnabled
                  ? t('profile.notificationsDailyDescription', {
                      time: formatReminderTime(notificationPreferences.dailyPushHour),
                    })
                  : t('profile.notificationsDailyDisabled')}
              </Text>
              {notificationPreferences.dailyPushEnabled && (
                <TouchableOpacity
                  style={styles.notificationTimeButton}
                  onPress={handleNotificationHourChange}
                  disabled={notificationSaving}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time" size={16} color={tokens.colors.primary} />
                  <Text style={styles.notificationTimeText}>
                    {t('profile.notificationsChangeTime', {
                      time: formatReminderTime(notificationPreferences.dailyPushHour),
                    })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Switch
              value={notificationPreferences.dailyPushEnabled}
              onValueChange={(value) => handleNotificationToggle(value)}
              trackColor={{ false: tokens.colors.borderMuted, true: tokens.colors.primary }}
              thumbColor={tokens.states.primary.on}
              disabled={notificationLoading || notificationSaving}
            />
          </View>
        </AppCard>

        <AppCard style={styles.dangerCard}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>{t('profile.deleteAccount')}</Text>
          <Text style={styles.dangerDescription}>{t('profile.deleteAccountMessage')}</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={typeof handleDeleteAccount === 'function' ? handleDeleteAccount : () => {}}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={18} color={tokens.colors.error} />
            <Text style={styles.dangerButtonText}>{t('profile.deleteAccount')}</Text>
          </TouchableOpacity>
        </AppCard>
      </ScrollView>

      <Modal
        visible={planModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !planSaving && setPlanModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('profile.choosePlan') || 'Choose a plan'}
              </Text>
              <TouchableOpacity
                onPress={() => !planSaving && setPlanModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(planOptions || []).map((plan) => {
                const isSelected = pendingPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.modalPlanCard,
                      isSelected && styles.modalPlanCardSelected,
                    ]}
                    activeOpacity={0.9}
                    onPress={() => !planSaving && setPendingPlan(plan.id)}
                  >
                    <View style={styles.modalPlanHeader}>
                      <View>
                        <Text style={styles.modalPlanName}>{plan.name}</Text>
                        <Text style={styles.modalPlanPrice}>{plan.price}</Text>
                      </View>
                      {plan.badge && (
                        <View style={styles.modalPlanBadge}>
                          <Text style={styles.modalPlanBadgeText}>
                            {plan.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.modalPlanDescription}>
                      {plan.description}
                    </Text>
                    <View style={styles.modalPlanFeatures}>
                      {(plan.features || []).map((feature) => (
                        <View key={feature} style={styles.planFeatureRow}>
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={
                              isSelected ? tokens.states.primary.on : colors.primary
                            }
                          />
                          <Text
                            style={[
                              styles.planFeatureText,
                              isSelected && styles.planFeatureSelectedText,
                            ]}
                          >
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <PrimaryButton
              title={
                planSaving
                  ? t('profile.savingButton') || 'Saving...'
                  : t('profile.applyPlan') || 'Apply plan'
              }
              onPress={() => handlePlanChange(pendingPlan)}
              loading={planSaving}
              style={styles.modalApplyButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ProfileField = ({ label, style, ...rest }) => {
  const tokens = useDesignTokens();
  const styles = useMemo(() => createFieldStyles(tokens), [tokens]);
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...rest} />
    </View>
  );
};

const createStyles = (tokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    container: {
      padding: tokens.spacing.xl,
      gap: tokens.spacing.xl,
    },
    heroCard: {
      gap: tokens.spacing.md,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.lg,
    },
    heroInfo: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    heroEyebrow: {
      fontSize: 13,
      color: tokens.colors.textSubdued,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: tokens.colors.textPrimary,
    },
    heroSubtitle: {
      fontSize: 15,
      color: tokens.colors.textSecondary,
    },
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing.md,
      marginVertical: tokens.spacing.sm,
    },
    metricWrapper: {
      flexGrow: 1,
      minWidth: 140,
    },
    metricCard: {
      borderRadius: tokens.radii.md,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      backgroundColor: tokens.colors.card,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      gap: tokens.spacing.xs,
      ...(tokens.states.cardShadow || tokens.elevations.xs),
    },
    metricIcon: {
      width: 32,
      height: 32,
      borderRadius: tokens.radii.full,
      backgroundColor: tokens.colors.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricValue: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    metricLabel: {
      fontSize: 13,
      color: tokens.colors.textSecondary,
    },
    heroButton: {
      marginTop: tokens.spacing.md,
      alignSelf: 'flex-start',
    },
    planCard: {
      marginTop: tokens.spacing.xl,
      gap: tokens.spacing.lg,
    },
    planSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: tokens.spacing.lg,
    },
    planSummaryText: {
      flex: 1,
    },
    planSummaryName: {
      fontSize: tokens.typography.headingM.fontSize,
      fontWeight: tokens.typography.headingM.fontWeight,
      color: tokens.colors.textPrimary,
    },
    planSummaryPrice: {
      fontSize: tokens.typography.headingL.fontSize,
      fontWeight: tokens.typography.headingL.fontWeight,
      color: tokens.colors.primary,
      marginTop: tokens.spacing.xs,
    },
    planSummaryDescription: {
      color: tokens.colors.textSecondary,
      marginTop: tokens.spacing.xs,
    },
    planSummaryFeatures: {
      gap: tokens.spacing.xs,
    },
    planFeatureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    planFeatureText: {
      color: tokens.colors.textSecondary,
    },
    planFeatureSelectedText: {
      color: tokens.states.primary.on,
    },
    planMeta: {
      color: tokens.colors.textSecondary,
      fontSize: tokens.typography.caption.fontSize,
    },
    planChangeButton: {
      minWidth: 140,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: tokens.spacing.xl,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: tokens.colors.surfacePrimary || tokens.colors.surface,
      borderTopLeftRadius: tokens.radii.xl,
      borderTopRightRadius: tokens.radii.xl,
      maxHeight: '85%',
      padding: tokens.spacing.xl,
      gap: tokens.spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: tokens.typography.headingM.fontSize,
      fontWeight: tokens.typography.headingM.fontWeight,
      color: tokens.colors.textPrimary,
    },
    modalPlanCard: {
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.lg,
      marginBottom: tokens.spacing.md,
      gap: tokens.spacing.sm,
    },
    modalPlanCardSelected: {
      borderColor: tokens.colors.primary,
      backgroundColor: tokens.colors.primaryTint || tokens.colors.surfaceMuted,
    },
    modalPlanHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalPlanName: {
      fontSize: tokens.typography.headingS.fontSize,
      fontWeight: tokens.typography.headingS.fontWeight,
      color: tokens.colors.textPrimary,
    },
    modalPlanPrice: {
      fontSize: tokens.typography.bodyStrong.fontSize,
      color: tokens.colors.primary,
      marginTop: tokens.spacing.xs,
    },
    modalPlanBadge: {
      backgroundColor: tokens.colors.primary,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: tokens.spacing.xs / 2,
      borderRadius: tokens.radii.full,
    },
    modalPlanBadgeText: {
      color: tokens.states.primary.on,
      fontSize: tokens.typography.caption.fontSize,
      fontWeight: '600',
    },
    modalPlanDescription: {
      color: tokens.colors.textSecondary,
    },
    modalPlanFeatures: {
      gap: tokens.spacing.xs,
    },
    modalApplyButton: {
      marginTop: tokens.spacing.sm,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: tokens.radii.full,
      backgroundColor: tokens.colors.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: tokens.typography.headingM.fontSize,
      fontWeight: tokens.typography.headingM.fontWeight,
      color: tokens.colors.primary,
    },
    formCard: {
      gap: tokens.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    fieldRow: {
      flexDirection: 'row',
      gap: tokens.spacing.md,
    },
    formSaveButton: {
      marginTop: tokens.spacing.sm,
    },
    preferencesCard: {
      gap: tokens.spacing.lg,
    },
    preferenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.colors.card,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.lg,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
    },
    notificationCopy: {
      flex: 1,
      marginRight: tokens.spacing.lg,
      gap: tokens.spacing.xs,
    },
    preferenceLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    preferenceCaption: {
      fontSize: 13,
      color: tokens.colors.textSecondary,
      marginTop: 4,
    },
    themeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    themeToggles: {
      flexDirection: 'row',
      gap: tokens.spacing.sm,
    },
    themeChip: {
      width: 40,
      height: 40,
      borderRadius: tokens.radii.pill,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.states.surface.base ?? tokens.colors.surface,
    },
    themeChipActive: {
      backgroundColor: tokens.states.primary.base,
      borderColor: tokens.states.primary.border || tokens.states.primary.base,
    },
    notificationDescription: {
      fontSize: 13,
      color: tokens.colors.textSecondary,
    },
    notificationTimeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    notificationTimeText: {
      fontSize: 13,
      color: tokens.colors.primary,
      fontWeight: '500',
    },
    dangerCard: {
      gap: tokens.spacing.lg,
      borderWidth: 1,
      borderColor: tokens.colors.error + '33',
      backgroundColor: tokens.colors.error + '0A',
    },
    dangerTitle: {
      color: tokens.colors.error,
    },
    dangerDescription: {
      fontSize: tokens.typography.body.fontSize,
      lineHeight: tokens.typography.body.lineHeight,
      color: tokens.colors.textSecondary,
      marginBottom: tokens.spacing.md,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing.sm,
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      borderRadius: tokens.radii.lg,
      borderWidth: 1,
      borderColor: tokens.colors.error,
      backgroundColor: 'transparent',
    },
    dangerButtonText: {
      fontSize: tokens.typography.bodyStrong.fontSize,
      fontWeight: tokens.typography.bodyStrong.fontWeight,
      color: tokens.colors.error,
    },
  });

const createFieldStyles = (tokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    label: {
      fontSize: 13,
      color: tokens.colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      backgroundColor: tokens.colors.inputBackground,
      color: tokens.colors.textPrimary,
      fontSize: 15,
    },
  });

export default ProfileScreen;
