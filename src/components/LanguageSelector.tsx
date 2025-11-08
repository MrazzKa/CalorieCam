import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AccessibilityInfo } from 'react-native';
import { LANGUAGE_OPTIONS, LanguageOption } from '../../app/i18n/languages';
import { useTheme } from '../contexts/ThemeContext';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void | Promise<void>;
  languages?: LanguageOption[];
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  languages = LANGUAGE_OPTIONS,
}) => {
  const { tokens } = useTheme();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  const current = languages.find((option) => option.code === selectedLanguage) ?? languages[0];

  const handlePress = async (code: string) => {
    if (code === selectedLanguage) {
      return;
    }
    await onLanguageChange(code);
    AccessibilityInfo.announceForAccessibility?.(code);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.currentChip} accessible accessibilityRole="text">
        <Text style={styles.currentFlag}>{current?.flag}</Text>
        <View>
          <Text style={styles.currentLabel}>{current?.label}</Text>
          <Text style={styles.currentNative}>{current?.nativeLabel}</Text>
        </View>
      </View>
      <View style={styles.optionsRow}>
        {languages.map((language) => {
          const isActive = language.code === selectedLanguage;
          return (
            <TouchableOpacity
              key={language.code}
              style={[styles.optionChip, isActive && styles.optionChipActive]}
              onPress={() => handlePress(language.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${language.label} (${language.nativeLabel})`}
            >
              <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                {language.flag} {language.code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (tokens: any) =>
  StyleSheet.create({
    wrapper: {
      gap: tokens.spacing.md,
    },
    currentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.md,
      padding: tokens.spacing.md,
      backgroundColor: tokens.colors.card,
      borderRadius: tokens.radii.lg,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.xs),
    },
    currentFlag: {
      fontSize: 28,
    },
    currentLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    currentNative: {
      fontSize: 13,
      color: tokens.colors.textSecondary,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing.sm,
    },
    optionChip: {
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.lg,
      borderRadius: tokens.radii.pill,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      backgroundColor: tokens.colors.surface,
    },
    optionChipActive: {
      backgroundColor: tokens.states.primary.base,
      borderColor: tokens.states.primary.border || tokens.states.primary.base,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    optionLabelActive: {
      color: tokens.states.primary.on,
    },
  });
