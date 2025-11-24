// App.js с навигацией и SmokeTest
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { I18nProvider } from './app/i18n/provider';
import { AppWrapper } from './src/components/AppWrapper';
import { EmptySplash } from './src/components/EmptySplash';
import { useAuth } from './src/contexts/AuthContext';

// Import screens
import SmokeTestScreen from './src/screens/SmokeTestScreen';
import AuthScreen from './src/components/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { clientLog } from './src/utils/clientLog';

const Stack = createStackNavigator();

// Простой MainTabs для начала (можно улучшить позже)
function MainTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    clientLog('RootNav:render', { isAuthenticated }).catch(() => {});
  }, [isAuthenticated]);

  const handleAuthSuccess = async () => {
    await clientLog('App:authSuccess').catch(() => {});
    // Navigation будет обработан внутри AuthScreen
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer
        onReady={() => {
          clientLog('App:navigationReady').catch(() => {});
        }}
        onStateChange={(state) => {
          const currentRoute = state?.routes?.[state.index]?.name;
          if (currentRoute) {
            clientLog('App:navigationStateChange', { route: currentRoute, isAuthenticated }).catch(() => {});
          }
        }}
      >
        {isAuthenticated ? (
          <Stack.Navigator
            initialRouteName="MainTabs"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="_SmokeTest" component={SmokeTestScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator
            initialRouteName="_SmokeTest"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="_SmokeTest" component={SmokeTestScreen} />
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  React.useEffect(() => {
    clientLog('App:rootMounted').catch(() => {});
  }, []);

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
