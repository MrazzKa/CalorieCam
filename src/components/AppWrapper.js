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
  console.log('[BOOT:AppWrapper] Rendering AppWrapper');
  return (
    <ThemeProvider>
      {(() => {
        console.log('[BOOT:AppWrapper] Inside ThemeProvider, rendering AuthProvider');
        return (
          <AuthProvider>
            {(() => {
              console.log('[BOOT:AppWrapper] Inside AuthProvider, rendering AppContent');
              return <AppContent>{children}</AppContent>;
            })()}
          </AuthProvider>
        );
      })()}
    </ThemeProvider>
  );
}
