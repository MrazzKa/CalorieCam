import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/apiService';
import { useI18n } from '../../app/i18n/hooks';
import { useTheme } from '../contexts/ThemeContext';

function maskEmail(email) {
  if (!email) {
    return '';
  }
  const [local, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  const maskedLocal = local.length <= 2 ? `${local[0] || ''}***` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

const OTP_LENGTH = 6;

export default function AuthScreen({ onAuthSuccess }) {
  const { t } = useI18n();
  const { tokens, colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(tokens, colors, isDark), [tokens, colors, isDark]);

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);

  const codeInputRef = useRef(null);

  useEffect(() => {
    if (step !== 'verify' || resendCooldown <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  useEffect(() => {
    if (step !== 'verify' || codeExpiresIn <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setCodeExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, codeExpiresIn]);

  const resetFeedback = () => {
    setErrorMessage('');
    setStatusMessage('');
  };

  const getErrorMessage = (error, fallbackKey) => {
    if (!error) {
      return t(fallbackKey);
    }

    const codeName = error?.payload?.code;
    const retryAfter = error?.payload?.retryAfter;

    if (codeName === 'OTP_INVALID') {
      return t('auth.errors.invalidCode');
    }

    if (codeName === 'OTP_EXPIRED') {
      return t('auth.errors.expiredCode');
    }

    if (codeName === 'OTP_RATE_LIMIT' || error?.status === 429) {
      return t('auth.errors.rateLimited', { seconds: retryAfter ?? resendCooldown ?? 60 });
    }

    if (error?.message) {
      return error.message;
    }

    return t(fallbackKey);
  };

  const handleRequestCode = async ({ isResend = false } = {}) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage(t('auth.errors.invalidEmail'));
      return;
    }

    setIsSubmitting(true);
    resetFeedback();

    try {
      const response = await ApiService.requestOtp(trimmedEmail);
      setStatusMessage(
        t(isResend ? 'auth.messages.codeResent' : 'auth.messages.codeSent', {
          email: maskEmail(trimmedEmail),
        }),
      );
      setResendCooldown(response?.retryAfter ?? 60);
      setCodeExpiresIn(response?.expiresIn ?? 600);

      if (!isResend) {
        setStep('verify');
        setCode('');
        setTimeout(() => {
          codeInputRef.current?.focus();
        }, 200);
      } else {
        setCode('');
        setTimeout(() => {
          codeInputRef.current?.focus();
        }, 50);
      }
    } catch (error) {
      if (error?.payload?.retryAfter) {
        setResendCooldown(error.payload.retryAfter);
      }
      setErrorMessage(getErrorMessage(error, isResend ? 'auth.errors.resendFailed' : 'auth.errors.sendFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    const sanitizedCode = code.replace(/[^0-9]/g, '');
    if (sanitizedCode.length !== OTP_LENGTH) {
      setErrorMessage(t('auth.errors.codeLength'));
      return;
    }

    setIsSubmitting(true);
    resetFeedback();

    try {
      const response = await ApiService.verifyOtp(email.trim().toLowerCase(), sanitizedCode);
      if (response?.accessToken) {
        await ApiService.setToken(response.accessToken, response.refreshToken);
      }
      setStatusMessage(t('auth.messages.signedIn'));
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'auth.errors.verifyFailed'));
      if (error?.payload?.code === 'OTP_EXPIRED') {
        setStep('email');
        setResendCooldown(0);
        setCodeExpiresIn(0);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = () => {
    if (isSubmitting || resendCooldown > 0) {
      return;
    }
    handleRequestCode({ isResend: true });
  };

  const handleChangeEmail = () => {
    setStep('email');
    setCode('');
    setResendCooldown(0);
    setCodeExpiresIn(0);
    resetFeedback();
  };

  const emailStep = (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="mail" size={40} color={colors.primary} />
      </View>
      <Text style={styles.title}>{t('auth.welcomeTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('auth.emailLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={(value) => setEmail(value.trim())}
          editable={!isSubmitting}
        />
      </View>

      {Boolean(errorMessage) && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {Boolean(statusMessage) && !errorMessage && (
        <Text style={styles.successText}>{statusMessage}</Text>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
        onPress={() => handleRequestCode({ isResend: false })}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Ionicons name="paper-plane" size={18} color={colors.onPrimary} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>{t('auth.sendCode')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const verifyStep = (
    <View style={styles.card}>
      <TouchableOpacity style={styles.backButton} onPress={handleChangeEmail}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={styles.backButtonText}>{t('auth.changeEmail')}</Text>
      </TouchableOpacity>

      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
      </View>

      <Text style={styles.title}>{t('auth.otpScreenTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.otpScreenSubtitle', { email: maskEmail(email) })}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('auth.otpCode')}</Text>
        <TextInput
          ref={codeInputRef}
          style={styles.otpInput}
          value={code}
          editable={!isSubmitting}
          onChangeText={(value) => {
            setCode(value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));
            if (errorMessage) {
              setErrorMessage('');
            }
          }}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={OTP_LENGTH}
          autoFocus
          onSubmitEditing={handleVerifyCode}
        />
      </View>

      {codeExpiresIn > 0 && (
        <Text style={styles.helperText}>
          {t('auth.codeExpiresIn', { seconds: codeExpiresIn })}
        </Text>
      )}

      {Boolean(errorMessage) && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {Boolean(statusMessage) && !errorMessage && (
        <Text style={styles.successText}>{statusMessage}</Text>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, (isSubmitting || code.length !== OTP_LENGTH) && styles.disabledButton]}
        onPress={handleVerifyCode}
        disabled={isSubmitting || code.length !== OTP_LENGTH}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Ionicons name="lock-open" size={18} color={colors.onPrimary} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>{t('auth.verifyCode')}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, (isSubmitting || resendCooldown > 0) && styles.disabledButton]}
        onPress={handleResend}
        disabled={isSubmitting || resendCooldown > 0}
      >
        <Ionicons name="refresh" size={18} color={colors.primary} style={styles.buttonIcon} />
        <Text style={styles.secondaryButtonText}>
          {resendCooldown > 0
            ? t('auth.resendIn', { seconds: resendCooldown })
            : t('auth.resendCode')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {step === 'email' ? emailStep : verifyStep}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(tokens, colors, isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: tokens.spacing.xxl,
      paddingVertical: tokens.spacing.xxxl,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: tokens.radii.xl,
      padding: tokens.spacing.xxl,
      gap: tokens.spacing.lg,
      ...tokens.elevations.md,
    },
    iconWrap: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? colors.surfaceMuted : colors.primaryTint,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: tokens.spacing.md,
    },
    title: {
      fontSize: tokens.typography.headingM.fontSize,
      lineHeight: tokens.typography.headingM.lineHeight,
      fontWeight: tokens.typography.headingM.fontWeight,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: tokens.typography.body.fontSize,
      lineHeight: tokens.typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: 'center',
      marginHorizontal: tokens.spacing.md,
    },
    fieldGroup: {
      marginTop: tokens.spacing.lg,
    },
    label: {
      fontSize: tokens.typography.caption.fontSize,
      color: colors.textSecondary,
      marginBottom: tokens.spacing.xs,
      fontWeight: tokens.typography.caption.fontWeight,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.inputBackground,
      borderRadius: tokens.radii.lg,
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.md,
      fontSize: tokens.typography.body.fontSize,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: isDark ? colors.borderMuted : colors.border,
    },
    otpInput: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.inputBackground,
      borderRadius: tokens.radii.lg,
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.md,
      fontSize: 28,
      fontWeight: tokens.fontWeights.semibold,
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: 12,
      borderWidth: 1,
      borderColor: isDark ? colors.borderMuted : colors.border,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: tokens.radii.lg,
      paddingVertical: tokens.spacing.md,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: tokens.spacing.sm,
      marginTop: tokens.spacing.xl,
    },
    secondaryButton: {
      backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
      borderRadius: tokens.radii.lg,
      paddingVertical: tokens.spacing.md,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: tokens.spacing.sm,
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontSize: tokens.typography.bodyStrong.fontSize,
      fontWeight: tokens.typography.bodyStrong.fontWeight,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: tokens.typography.body.fontSize,
      fontWeight: tokens.typography.body.fontWeight,
    },
    disabledButton: {
      opacity: 0.6,
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      fontSize: tokens.typography.body.fontSize,
    },
    successText: {
      color: colors.success,
      textAlign: 'center',
      fontSize: tokens.typography.body.fontSize,
    },
    helperText: {
      textAlign: 'center',
      color: colors.textTertiary,
      fontSize: tokens.typography.caption.fontSize,
    },
    buttonIcon: {
      marginRight: tokens.spacing.xs,
    },
    backButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
      marginBottom: tokens.spacing.md,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: tokens.typography.body.fontSize,
      fontWeight: tokens.fontWeights.medium,
    },
  });
}

