import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colors = isDark ? {
    background: '#000000',
    surface: '#1C1C1E',
    primary: '#007AFF',
    secondary: '#5856D6',
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#EBEBF599',
    border: '#38383A',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    card: '#1C1C1E',
    input: '#2C2C2E',
    inputBackground: '#2C2C2E',
    shadow: '#000000',
  } : {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    primary: '#007AFF',
    secondary: '#5856D6',
    text: '#1C1C1E',
    textSecondary: '#3A3A3C',
    textTertiary: '#8E8E93',
    border: '#E5E5E7',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    card: '#FFFFFF',
    input: '#1C1C1E',
    inputBackground: '#F8F9FA',
    shadow: '#000000',
  };

  const value = {
    isDark,
    themeMode,
    colors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

