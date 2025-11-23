// App.js с навигацией и SmokeTest
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { I18nProvider } from './app/i18n/provider';
import { AppWrapper } from './src/components/AppWrapper';
import { EmptySplash } from './src/components/EmptySplash';

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
  const handleAuthSuccess = async () => {
    await clientLog('App:authSuccess').catch(() => {});
    // Navigation будет обработан внутри AuthScreen через onAuthSuccess
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
            clientLog('App:navigationStateChange', { route: currentRoute }).catch(() => {});
          }
        }}
      >
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
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
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
