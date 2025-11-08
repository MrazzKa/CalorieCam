import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens as baseTokens, palettes } from '../design/tokens';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const useDesignTokens = () => {
  const { tokens } = useTheme();
  return tokens;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

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

  useEffect(() => {
    const loadReduceMotion = async () => {
      try {
        const value = await AccessibilityInfo.isReduceMotionEnabled();
        setReduceMotion(value);
      } catch {
        setReduceMotion(false);
      }
    };

    loadReduceMotion();

    const handleReduceMotionChange = (enabled) => setReduceMotion(enabled);

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      handleReduceMotionChange,
    );

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else if (AccessibilityInfo.removeEventListener) {
        AccessibilityInfo.removeEventListener('reduceMotionChanged', handleReduceMotionChange);
      }
    };
  }, []);

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

  const palette = isDark ? palettes.dark : palettes.light;
  const themeTokens = useMemo(() => {
    const { states: stateTokens, ...restTokens } = baseTokens;
    const resolvedStates = stateTokens ? (isDark ? stateTokens.dark : stateTokens.light) : {};

    return {
      ...restTokens,
      colors: palette,
      states: resolvedStates,
    };
  }, [isDark, palette]);

  const getColor = (key) => palette[key] ?? key;

  const value = {
    isDark,
    themeMode,
    colors: palette,
    tokens: themeTokens,
    toggleTheme,
    reduceMotion,
    getColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

