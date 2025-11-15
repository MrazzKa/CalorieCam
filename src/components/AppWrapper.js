import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

function AppContent({ children }) {
  try {
    const { isDark } = useTheme();

    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {children}
      </>
    );
  } catch (error) {
    console.error('[AppWrapper] Error in AppContent:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading app. Please restart.</Text>
      </View>
    );
  }
}

export function AppWrapper({ children }) {
  try {
    return (
      <AuthProvider>
        <ThemeProvider>
          <AppContent>{children}</AppContent>
        </ThemeProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('[AppWrapper] Error initializing providers:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error initializing app. Please restart.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
  },
});

