import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import ApiService from '../services/apiService';
import { useTheme } from '../contexts/ThemeContext';
import { PADDING, SPACING, BORDER_RADIUS, SHADOW } from '../utils/designConstants';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDark, colors, themeMode, toggleTheme } = useTheme();
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    height: 170, // cm
    weight: 70, // kg
    age: 25,
    gender: '',
    activityLevel: '',
    goal: '',
    targetWeight: 70,
    dailyCalories: 2000,
  });

  const [settings, setSettings] = useState({
    notifications: true,
    autoSync: true,
    dataSharing: false,
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Use demo profile when API is not available
      setUserProfile({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@caloriecam.com',
        weight: 70,
        height: 170,
        age: 25,
        gender: 'male',
        activityLevel: 'moderately_active',
        goal: 'maintain_weight',
        targetWeight: 70,
        dailyCalories: 2000,
      });
    }
  };

  const handleSettingChange = (setting, value) => {
    if (setting === 'darkMode') {
      // Map value to theme mode: true = 'dark', false = 'light'
      const mode = value ? 'dark' : 'light';
      toggleTheme(mode);
    } else {
      setSettings(prev => ({
        ...prev,
        [setting]: value,
      }));
    }
  };

  // Sync darkMode setting with theme
  useEffect(() => {
    // Update local state based on theme mode
  }, [themeMode]);

  const handleProfileUpdate = async () => {
    if (isEditing) {
      try {
        await ApiService.updateUserProfile(userProfile);
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    }
    setIsEditing(!isEditing);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
          try {
            await ApiService.logout();
            // Clear token and navigate
            ApiService.setToken(null);
            navigation.navigate('Dashboard');
          } catch (error) {
            console.error('Logout error:', error);
            // Still navigate even if logout fails
            navigation.navigate('Dashboard');
          }
        }},
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await ApiService.deleteAccount();
              await ApiService.setToken(null, null);
              Alert.alert('Success', 'Your account has been deleted.');
              navigation.navigate('Onboarding');
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          }
        },
      ]
    );
  };

  const renderProfileSection = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Profile</Text>
        <TouchableOpacity onPress={handleProfileUpdate}>
          <Text style={styles.editButton}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.profileCard, dynamicStyles.profileCard]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#007AFF" />
          </View>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input, !isEditing && styles.inputDisabled, !isEditing && dynamicStyles.inputDisabled]}
                value={userProfile.firstName}
                editable={isEditing}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, firstName: text }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input, !isEditing && styles.inputDisabled, !isEditing && dynamicStyles.inputDisabled]}
                value={userProfile.lastName}
                editable={isEditing}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, lastName: text }))}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input, !isEditing && styles.inputDisabled, !isEditing && dynamicStyles.inputDisabled]}
              value={userProfile.email}
              editable={isEditing}
              keyboardType="email-address"
              onChangeText={(text) => setUserProfile(prev => ({ ...prev, email: text }))}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input, !isEditing && styles.inputDisabled, !isEditing && dynamicStyles.inputDisabled]}
                value={userProfile.height.toString()}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, height: parseInt(text) || 0 }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input, !isEditing && styles.inputDisabled, !isEditing && dynamicStyles.inputDisabled]}
                value={userProfile.weight.toString()}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, weight: parseInt(text) || 0 }))}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input, !isEditing && styles.inputDisabled, !isEditing && dynamicStyles.inputDisabled]}
                value={userProfile.age.toString()}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, age: parseInt(text) || 0 }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Gender</Text>
              <TouchableOpacity
                style={[styles.input, styles.pickerInput, !isEditing && styles.inputDisabled]}
                disabled={!isEditing}
                onPress={() => {
                  Alert.alert(
                    'Select Gender',
                    '',
                    [
                      { text: 'Male', onPress: () => setUserProfile(prev => ({ ...prev, gender: 'male' })) },
                      { text: 'Female', onPress: () => setUserProfile(prev => ({ ...prev, gender: 'female' })) },
                      { text: 'Other', onPress: () => setUserProfile(prev => ({ ...prev, gender: 'other' })) },
                    ]
                  );
                }}
              >
                <Text style={styles.pickerText}>
                  {userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : 'Select Gender'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Activity Level</Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerInput, !isEditing && styles.inputDisabled]}
              disabled={!isEditing}
              onPress={() => {
                Alert.alert(
                  'Select Activity Level',
                  '',
                  [
                    { text: 'Sedentary', onPress: () => setUserProfile(prev => ({ ...prev, activityLevel: 'sedentary' })) },
                    { text: 'Lightly Active', onPress: () => setUserProfile(prev => ({ ...prev, activityLevel: 'lightly_active' })) },
                    { text: 'Moderately Active', onPress: () => setUserProfile(prev => ({ ...prev, activityLevel: 'moderately_active' })) },
                    { text: 'Very Active', onPress: () => setUserProfile(prev => ({ ...prev, activityLevel: 'very_active' })) },
                    { text: 'Extremely Active', onPress: () => setUserProfile(prev => ({ ...prev, activityLevel: 'extremely_active' })) },
                  ]
                );
              }}
            >
              <Text style={styles.pickerText}>
                {userProfile.activityLevel ? userProfile.activityLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Select Activity Level'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Goal</Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerInput, !isEditing && styles.inputDisabled]}
              disabled={!isEditing}
              onPress={() => {
                Alert.alert(
                  'Select Goal',
                  '',
                  [
                    { text: 'Lose Weight', onPress: () => setUserProfile(prev => ({ ...prev, goal: 'lose_weight' })) },
                    { text: 'Maintain Weight', onPress: () => setUserProfile(prev => ({ ...prev, goal: 'maintain_weight' })) },
                    { text: 'Gain Weight', onPress: () => setUserProfile(prev => ({ ...prev, goal: 'gain_weight' })) },
                  ]
                );
              }}
            >
              <Text style={styles.pickerText}>
                {userProfile.goal ? userProfile.goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Select Goal'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Target Weight (kg)</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input, !isEditing && styles.inputDisabled, !isEditing && dynamicStyles.inputDisabled]}
                value={userProfile.targetWeight.toString()}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, targetWeight: parseInt(text) || 0 }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Daily Calories</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input, !isEditing && styles.inputDisabled, !isEditing && dynamicStyles.inputDisabled]}
                value={userProfile.dailyCalories.toString()}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, dailyCalories: parseInt(text) || 0 }))}
              />
            </View>
          </View>
        </View>
      </View>
    </MotiView>
  );

  const renderSettingsSection = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Settings</Text>
      </View>
      
      <View style={[styles.settingsCard, dynamicStyles.settingsCard]}>
        <View style={[styles.settingItem, dynamicStyles.settingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Notifications</Text>
              <Text style={[styles.settingSubtitle, dynamicStyles.settingSubtitle]}>Receive meal reminders</Text>
            </View>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => handleSettingChange('notifications', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingItem, dynamicStyles.settingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={colors.secondary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                {themeMode === 'system' ? 'Следовать системной теме' : isDark ? 'Темная тема' : 'Светлая тема'}
              </Text>
            </View>
          </View>
          <View style={styles.themeControls}>
            <Switch
              value={isDark}
              onValueChange={(value) => handleSettingChange('darkMode', value)}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor="#FFFFFF"
            />
            <TouchableOpacity
              style={styles.systemThemeButton}
              onPress={() => toggleTheme(themeMode === 'system' ? (isDark ? 'dark' : 'light') : 'system')}
            >
              <Ionicons 
                name={themeMode === 'system' ? "phone-portrait" : "phone-portrait-outline"} 
                size={18} 
                color={themeMode === 'system' ? colors.secondary : colors.textTertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.settingItem, dynamicStyles.settingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name="sync" size={24} color={colors.success} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Auto Sync</Text>
              <Text style={[styles.settingSubtitle, dynamicStyles.settingSubtitle]}>Sync data automatically</Text>
            </View>
          </View>
          <Switch
            value={settings.autoSync}
            onValueChange={(value) => handleSettingChange('autoSync', value)}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingItem, dynamicStyles.settingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons name="analytics" size={24} color={colors.warning} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Data Sharing</Text>
              <Text style={[styles.settingSubtitle, dynamicStyles.settingSubtitle]}>Help improve the app</Text>
            </View>
          </View>
          <Switch
            value={settings.dataSharing}
            onValueChange={(value) => handleSettingChange('dataSharing', value)}
            trackColor={{ false: colors.border, true: colors.warning }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );

  const renderAccountSection = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: 100 }}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account</Text>
      </View>
      
      <View style={[styles.settingsCard, dynamicStyles.settingsCard]}>
        <TouchableOpacity
          style={[styles.settingItem, dynamicStyles.settingItem]}
          onPress={() => navigation.navigate('Articles')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Статьи</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, dynamicStyles.settingItem]}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle" size={24} color={colors.textTertiary} />
            <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, dynamicStyles.settingItem]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="document-text" size={24} color={colors.textTertiary} />
            <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, dynamicStyles.settingItem]}
          onPress={() => navigation.navigate('TermsOfService')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="shield-checkmark" size={24} color={colors.textTertiary} />
            <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <View style={styles.settingInfo}>
            <Ionicons name="log-out" size={24} color="#FF3B30" />
            <Text style={[styles.settingTitle, { color: '#FF3B30' }]}>Logout</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
          <View style={styles.settingInfo}>
            <Ionicons name="trash" size={24} color="#FF3B30" />
            <Text style={[styles.settingTitle, { color: '#FF3B30' }]}>Delete Account</Text>
          </View>
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    sectionTitle: { color: colors.text },
    profileCard: { backgroundColor: colors.card, ...SHADOW.sm },
    settingsCard: { backgroundColor: colors.card, ...SHADOW.sm },
    settingTitle: { color: colors.text },
    settingSubtitle: { color: colors.textSecondary },
    input: { 
      backgroundColor: colors.inputBackground, 
      color: colors.input,
      borderColor: colors.border,
    },
    inputDisabled: { backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA' },
    settingItem: { borderBottomColor: colors.border },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileSection()}
        {renderSettingsSection()}
        {renderAccountSection()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  profileCard: {
    marginHorizontal: PADDING.screen,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.screen,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
  },
  pickerInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  settingsCard: {
    marginHorizontal: PADDING.screen,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  themeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  systemThemeButton: {
    padding: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
