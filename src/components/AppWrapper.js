import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

function AppContent({ children }) {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </>
  );
}

export function AppWrapper({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent>{children}</AppContent>
      </ThemeProvider>
    </AuthProvider>
  );
}

