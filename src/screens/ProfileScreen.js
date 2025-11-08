import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, useReducedMotion } from 'moti';
import ApiService from '../services/apiService';
import { useTheme, useDesignTokens } from '../contexts/ThemeContext';
import { useI18n } from '../../app/i18n/hooks';
import { LanguageSelector } from '../components/LanguageSelector';
import AppCard from '../components/common/AppCard';
import PrimaryButton from '../components/common/PrimaryButton';

const ProfileScreen = () => {
  const { t, language, changeLanguage, availableLanguages } = useI18n();
  const { tokens, isDark, themeMode, toggleTheme } = useTheme();
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
  });
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
      return 'CC';
    }
    return parts
      .map((value) => value.trim().charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [profile.firstName, profile.lastName, profile.email]);

  useEffect(() => {
    loadProfile();
    loadNotificationPreferences();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await ApiService.getUserProfile();
      if (result) {
        setProfile({
          firstName: result.firstName || '',
          lastName: result.lastName || '',
          email: result.email || '',
          height: result.height || 0,
          weight: result.weight || 0,
          age: result.age || 0,
          dailyCalories: result.dailyCalories || 0,
        });
      }
    } catch (error) {
      console.warn('Unable to load profile, using demo data.', error);
      setProfile({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@caloriecam.com',
        height: 170,
        weight: 70,
        age: 28,
        dailyCalories: 2000,
      });
    }
  };

  const loadNotificationPreferences = async () => {
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
  };

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
              {metrics.map((metric, index) => (
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
              onPress={editing ? handleSave : () => setEditing(true)}
              loading={loading}
              style={styles.heroButton}
            />
          </AppCard>
        </MotiView>

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
              onPress={handleSave}
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
                onPress={() => toggleTheme('light')}
              >
                <Ionicons name="partly-sunny" size={18} color={!isDark ? tokens.colors.onPrimary : tokens.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeChip, isDark && styles.themeChipActive]}
                onPress={() => toggleTheme('dark')}
              >
                <Ionicons name="moon" size={18} color={isDark ? tokens.colors.onPrimary : tokens.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeChip, themeMode === 'system' && styles.themeChipActive]}
                onPress={() => toggleTheme('system')}
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
      </ScrollView>
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
