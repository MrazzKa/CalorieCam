import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { ping } from './src/lib/ping';
import ApiService from './src/services/apiService';
import { DEV_TOKEN, DEV_REFRESH_TOKEN, API_BASE_URL } from './src/config/env';
import * as Linking from 'expo-linking';
import { useTheme } from './src/contexts/ThemeContext';
import { useI18n } from './app/i18n/hooks';
import { I18nProvider } from './app/i18n/provider';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useAuth } from './src/contexts/AuthContext';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import RecentlyScreen from './src/screens/RecentlyScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CameraScreen from './src/screens/CameraScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import AnalysisResultsScreen from './src/screens/AnalysisResultsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import ArticlesScreen from './src/screens/ArticlesScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import AuthScreen from './src/components/AuthScreen';
import { AppWrapper } from './src/components/AppWrapper';
import { EmptySplash } from './src/components/EmptySplash';
import { ErrorBoundary } from './src/components/ErrorBoundary';

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
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route && route.name) {
            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Articles') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'Recently') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
          }

          return <Ionicons name={iconName || 'help-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBackground || (isDark ? '#1C1C1E' : '#FFFFFF'),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: t('tabs.dashboard'),
        }}
      />
      <Tab.Screen 
        name="Articles" 
        component={ArticlesScreen}
        options={{
          tabBarLabel: t('tabs.articles'),
        }}
      />
      <Tab.Screen 
        name="Recently" 
        component={RecentlyScreen}
        options={{
          tabBarLabel: t('tabs.recently'),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const { expoPushToken } = usePushNotifications();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (expoPushToken && isAuthenticated) {
      ApiService.expoPushToken = expoPushToken;
      const deviceId = Device.osInternalBuildId || Device.osBuildId || Device.modelId || Device.modelName || 'unknown-device';
      const platform = Device.osName || Device.platformApiLevel?.toString() || Device.platformArchitecture || 'unknown';
      // Use safe fallback to avoid ExpoApplication error
      const appVersion = Constants.expoConfig?.version || Constants.expoConfig?.runtimeVersion || '1.0.0';
      ApiService.registerPushToken(expoPushToken, deviceId, platform, appVersion);
      console.log('[App] Registered Expo push token', expoPushToken);
    }
  }, [expoPushToken, isAuthenticated]);

  useEffect(() => {
    // Log configuration on startup
    console.log('========================================');
    console.log('[App] Starting EatSense App');
    console.log('[App] API_BASE_URL:', API_BASE_URL);
    console.log('[App] process.env.EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
    console.log('[App] DEV_TOKEN present:', !!DEV_TOKEN);
    console.log('========================================');

    const initializeApp = async () => {
      try {
        // Load tokens from Secure Storage on app start
        try {
          await ApiService.loadTokens();
        } catch (loadError) {
          console.warn('[App] Error loading tokens, continuing without tokens:', loadError.message);
        }
        
        // Set dev token if provided (for development ONLY)
        // In production, users will authenticate via OTP/Magic Link
        if (DEV_TOKEN && __DEV__) {
          // Only use DEV_TOKEN in development mode
          try {
            ApiService.setToken(DEV_TOKEN, DEV_REFRESH_TOKEN);
            console.log('[App] Using DEV_TOKEN for development');
            setIsAuthenticated(true);
            
            // Check if user has completed onboarding
            try {
              const profilePromise = ApiService.getUserProfile();
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
              );
              const profile = await Promise.race([profilePromise, timeoutPromise]);
              setHasCompletedOnboarding(!!profile?.isOnboardingCompleted);
            } catch (error) {
              console.log('[App] No profile found or API error, onboarding required');
              console.log('[App] Error:', error.message);
              setHasCompletedOnboarding(false);
            }
          } catch (devTokenError) {
            console.warn('[App] Error setting dev token:', devTokenError.message);
            setIsAuthenticated(false);
          }
        } else {
          // Check if we have a token loaded from storage (already loaded by loadTokens above)
          if (ApiService.token) {
            // Check if token is valid by making a test request
            try {
              // Add timeout to prevent hanging if API is unavailable
              const profilePromise = ApiService.getUserProfile();
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
              );
              const profile = await Promise.race([profilePromise, timeoutPromise]);
              setIsAuthenticated(true);
              setHasCompletedOnboarding(!!profile?.isOnboardingCompleted);
            } catch (error) {
              console.log('[App] Token invalid or API unavailable, authentication required');
              console.log('[App] Error details:', error.message);
              setIsAuthenticated(false);
              // Clear invalid token
              try {
                await ApiService.setToken(null, null);
              } catch (e) {
                console.warn('[App] Error clearing tokens:', e.message);
              }
            }
          } else {
            console.log('[App] No tokens found, authentication required');
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('[App] Error initializing app:', error);
        console.error('[App] Error stack:', error.stack);
        // Don't crash the app - just show auth screen
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    // Wrap in try-catch to prevent unhandled promise rejection
    initializeApp().catch((error) => {
      console.error('[App] Unhandled error in initializeApp:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    });
  }, []);

  const handleAuthSuccess = useCallback(async () => {
    console.log('[App] ========================================');
    console.log('[App] handleAuthSuccess called');
    console.log('[App] Current state - isAuthenticated:', isAuthenticated);
    console.log('[App] Current state - hasCompletedOnboarding:', hasCompletedOnboarding);
    console.log('[App] Current state - user from AuthContext:', user);
    
    // Set authentication state FIRST to trigger navigation
    // This ensures navigation happens immediately
    console.log('[App] Setting isAuthenticated to true...');
    setIsAuthenticated(true);
    
    // Add small delay to avoid race conditions before setting navigation ready
    console.log('[App] Waiting for navigation to be ready...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Set navigation ready after delay
    console.log('[App] Setting isNavigationReady to true...');
    setIsNavigationReady(true);
    
    // Check onboarding status AFTER navigation is ready
    // This prevents showing onboarding if user already completed it
    console.log('[App] Checking onboarding status...');
    try {
      // Add timeout to prevent hanging
      const profilePromise = ApiService.getUserProfile();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      const profile = await Promise.race([profilePromise, timeoutPromise]);
      const isOnboardingCompleted = profile?.isOnboardingCompleted || false;
      console.log('[App] Onboarding status from profile:', isOnboardingCompleted);
      setHasCompletedOnboarding(isOnboardingCompleted);
      
      if (isOnboardingCompleted) {
        console.log('[App] User already completed onboarding, navigating to MainTabs');
      } else {
        console.log('[App] User needs onboarding, showing onboarding screen');
      }
    } catch (error) {
      console.log('[App] Error checking onboarding status, defaulting to onboarding:', error.message);
      // If we can't check, show onboarding screen (safer default)
      setHasCompletedOnboarding(false);
    }
    
    // Update AuthContext in background (non-blocking)
    // This prevents useEffect from resetting isAuthenticated
    console.log('[App] Refreshing user in AuthContext (background)...');
    if (refreshUser && typeof refreshUser === 'function') {
      refreshUser()
        .then(() => {
          console.log('[App] AuthContext refreshed successfully');
        })
        .catch((error) => {
          console.warn('[App] Error refreshing AuthContext (non-blocking):', error.message);
          // Don't reset authentication if refresh fails - token is already saved
        });
    } else {
      console.warn('[App] refreshUser is not available');
    }
    
    console.log('[App] State updated, navigation should trigger now');
    console.log('[App] ========================================');
  }, [isAuthenticated, hasCompletedOnboarding, user, refreshUser]);

  // Handle deep links (Magic Links) - delayed until app is fully loaded
  useEffect(() => {
    // Don't process deep links until app is fully initialized
    if (isLoading) {
      return;
    }

    const handleDeepLink = async (event) => {
      const { url } = event;
      console.log('Deep link received:', url);

      try {
        // Parse the URL
        const parsed = Linking.parse(url);
        
        // Handle magic link consumption
        if (parsed.path === '/v1/auth/magic/consume' && parsed.queryParams?.token) {
          const token = parsed.queryParams.token;
          
          // Call API to consume magic link
          const response = await ApiService.request('/auth/magic/consume?token=' + token, {
            method: 'GET',
          });

          if (response.accessToken && response.refreshToken) {
            // Save tokens
            await ApiService.setToken(response.accessToken, response.refreshToken);
            
            // Update authentication state
            await handleAuthSuccess();
            
            Alert.alert('Success', 'You have been signed in successfully!');
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
        Alert.alert('Error', 'Failed to process magic link. Please try again.');
      }
    };

    // Handle initial URL if app was opened via deep link - delayed
    const timeoutId = setTimeout(() => {
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink({ url });
        }
      });
    }, 1000); // Wait 1 second after app loads

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      clearTimeout(timeoutId);
      subscription.remove();
    };
  }, [isLoading, handleAuthSuccess]);

  // Sync authentication state with AuthContext
  // Only sync if user is explicitly signed out (not during initial auth flow)
  useEffect(() => {
    // Don't sync during initial loading or if we just set isAuthenticated
    if (isLoading) {
      return;
    }
    
    // If user is null and we're authenticated, but we have a token, 
    // it might be that AuthContext hasn't loaded yet - don't reset
    if (user === null && isAuthenticated && !ApiService.token) {
      // User was explicitly deleted or signed out via AuthContext, update state
      console.log('[App] User signed out, resetting authentication state');
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
    } else if (user !== null && ApiService.token && !isAuthenticated) {
      // User authenticated via AuthContext (e.g., from token on app start), sync state
      console.log('[App] User found in AuthContext, syncing authentication state');
      setIsAuthenticated(true);
    }
  }, [user, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <EmptySplash />
      </SafeAreaProvider>
    );
  }

  // Show AuthScreen if not authenticated
  // Navigation ready state is handled inside handleAuthSuccess
  const initialRouteName = hasCompletedOnboarding ? 'MainTabs' : 'Onboarding';

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Gallery" component={GalleryScreen} />
          <Stack.Screen name="AnalysisResults" component={AnalysisResultsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          <Stack.Screen name="Articles" component={ArticlesScreen} />
          <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  // Removed global error handler to avoid conflicts with ErrorBoundary
  // ErrorBoundary will handle all React errors

  return (
    <ErrorBoundary>
      <I18nProvider fallback={<EmptySplash />}>
        <AppWrapper>
          <AppContent />
        </AppWrapper>
      </I18nProvider>
    </ErrorBoundary>
  );
}