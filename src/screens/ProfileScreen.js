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
import ApiService from '../services/apiService';

export default function ProfileScreen() {
  const navigation = useNavigation();
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
    darkMode: false,
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
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Handle account deletion
        }},
      ]
    );
  };

  const renderProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity onPress={handleProfileUpdate}>
          <Text style={styles.editButton}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
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
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userProfile.firstName}
                editable={isEditing}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, firstName: text }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userProfile.lastName}
                editable={isEditing}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, lastName: text }))}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
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
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userProfile.height.toString()}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, height: parseInt(text) || 0 }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
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
                style={[styles.input, !isEditing && styles.inputDisabled]}
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
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userProfile.targetWeight.toString()}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, targetWeight: parseInt(text) || 0 }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Daily Calories</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userProfile.dailyCalories.toString()}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, dailyCalories: parseInt(text) || 0 }))}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      <View style={styles.settingsCard}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Receive meal reminders</Text>
            </View>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => handleSettingChange('notifications', value)}
            trackColor={{ false: '#E5E5E7', true: '#007AFF' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={24} color="#5856D6" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingSubtitle}>Use dark theme</Text>
            </View>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={(value) => handleSettingChange('darkMode', value)}
            trackColor={{ false: '#E5E5E7', true: '#5856D6' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="sync" size={24} color="#34C759" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Auto Sync</Text>
              <Text style={styles.settingSubtitle}>Sync data automatically</Text>
            </View>
          </View>
          <Switch
            value={settings.autoSync}
            onValueChange={(value) => handleSettingChange('autoSync', value)}
            trackColor={{ false: '#E5E5E7', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="analytics" size={24} color="#FF9500" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Data Sharing</Text>
              <Text style={styles.settingSubtitle}>Help improve the app</Text>
            </View>
          </View>
          <Switch
            value={settings.dataSharing}
            onValueChange={(value) => handleSettingChange('dataSharing', value)}
            trackColor={{ false: '#E5E5E7', true: '#FF9500' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );

  const renderAccountSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>
      
      <View style={styles.settingsCard}>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle" size={24} color="#8E8E93" />
            <Text style={styles.settingTitle}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="document-text" size={24} color="#8E8E93" />
            <Text style={styles.settingTitle}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="shield-checkmark" size={24} color="#8E8E93" />
            <Text style={styles.settingTitle}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
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
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F8F9FA',
    color: '#8E8E93',
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
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
    color: '#1C1C1E',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
});
