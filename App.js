import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { ping } from './src/lib/ping';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import RecentlyScreen from './src/screens/RecentlyScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CameraScreen from './src/screens/CameraScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import AnalysisResultsScreen from './src/screens/AnalysisResultsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Global function for testing API connection
export const testAPIConnection = async () => {
  try {
    const result = await ping();
    if (result.ok) {
      Alert.alert(
        'API Connected',
        `Server is running!\n\nStatus: ${result.status}\nURL: ${result.url}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'API Error',
        `Server error.\n\nStatus: ${result.status}\nError: ${result.error || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    Alert.alert(
      'Connection Error',
      `Cannot connect to server.\n\nError: ${error.message}`,
      [{ text: 'OK' }]
    );
  }
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Recently') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Recently" component={RecentlyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Gallery" component={GalleryScreen} />
          <Stack.Screen name="AnalysisResults" component={AnalysisResultsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}