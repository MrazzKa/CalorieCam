import React from 'react';
import { View, StyleSheet } from 'react-native';

interface AccessibilityWrapperProps {
  children: React.ReactNode;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
}

export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}) => {
  return (
    <View
      style={styles.container}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
