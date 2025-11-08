import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../../app/i18n/hooks';

export function SplashLogo() {
  const { tokens, colors, isDark } = useTheme();
  const { t } = useI18n();
  const [logoUri, setLogoUri] = useState(null);
  const [isDownloading, setIsDownloading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLogo = async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/logo/Logo.svg'));
        if (!asset.downloaded) {
          await asset.downloadAsync();
        }
        if (isMounted) {
          setLogoUri(asset.localUri ?? asset.uri);
        }
      } catch (error) {
        console.error('[SplashLogo] Failed to load logo asset:', error);
      } finally {
        if (isMounted) {
          setIsDownloading(false);
        }
      }
    };

    loadLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  const indicatorColor = useMemo(() => {
    return isDark ? colors.textPrimary : colors.primary;
  }, [isDark, colors]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingHorizontal: tokens.spacing.xxl,
        },
      ]}
    >
      <View
        style={[
          styles.logoContainer,
          {
            borderRadius: tokens.radii.xl,
            padding: tokens.spacing.xl,
            backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceElevated,
            shadowColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: Platform.OS === 'ios' ? 0.4 : 0,
            shadowRadius: 20,
            elevation: Platform.OS === 'android' ? 12 : 0,
          },
        ]}
      >
        {logoUri ? (
          <SvgUri uri={logoUri} width={200} height={200} />
        ) : (
          <ActivityIndicator size="large" color={indicatorColor} />
        )}
      </View>

      {(isDownloading || !logoUri) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={indicatorColor} />
          <Text
            style={[
              styles.loadingText,
              {
                marginLeft: tokens.spacing.md,
                color: colors.textPrimary,
                fontSize: tokens.typography.body.fontSize,
                lineHeight: tokens.typography.body.lineHeight,
                fontWeight: tokens.typography.body.fontWeight,
              },
            ]}
          >
            {t('common.loading')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    letterSpacing: 0.2,
  },
});
