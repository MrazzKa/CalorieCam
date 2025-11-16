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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import ApiService from '../services/apiService';
import { useI18n } from '../../app/i18n/hooks';
import { useTheme } from '../contexts/ThemeContext';

// Complete web browser auth session for Google
WebBrowser.maybeCompleteAuthSession();

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

  const [step, setStep] = useState('welcome'); // 'welcome' | 'email' | 'verify'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  const codeInputRef = useRef(null);

  // Check Apple Sign In availability
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }
  }, []);

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

  const handleAppleSignIn = async () => {
    try {
      setIsSubmitting(true);
      resetFeedback();

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        // Send identity token to backend for verification
        const response = await ApiService.request('/auth/apple', {
          method: 'POST',
          body: JSON.stringify({
            identityToken: credential.identityToken,
            user: credential.user,
            email: credential.email,
            fullName: credential.fullName,
          }),
        });

        if (response?.accessToken) {
          await ApiService.setToken(response.accessToken, response.refreshToken);
        setStatusMessage(t('auth.messages.signedIn'));
        // Wait a bit before calling onAuthSuccess to ensure token is saved and state is updated
        setTimeout(async () => {
          if (onAuthSuccess) {
            console.log('[AuthScreen] Calling onAuthSuccess for Google Sign In');
            await onAuthSuccess();
            console.log('[AuthScreen] onAuthSuccess completed for Google Sign In');
          }
        }, 500);
        } else {
          throw new Error('No access token received from server');
        }
      }
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        // User canceled, do nothing
        return;
      }
      setErrorMessage(getErrorMessage(error, 'auth.errors.verifyFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth configuration with separate Client IDs for iOS/Android/Web
  const iosClientId = Constants.expoConfig?.extra?.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = Constants.expoConfig?.extra?.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  
  // Create redirect URI for Google OAuth
  // expo-auth-session uses WebBrowser which requires Web Client ID
  // For mobile apps, expo-auth-session may add flowName parameter to redirect URI
  // We need to use makeRedirectUri to get the exact URI that expo-auth-session will use
  // Then add that exact URI (with flowName if present) to Google Console
  const redirectUri = makeRedirectUri({
    scheme: 'eatsense',
    usePath: false,
    useProxy: false,
  });
  
  // Log the exact redirect URI that will be used
  console.log('[AuthScreen] Google OAuth redirectUri:', redirectUri);
  console.log('[AuthScreen] Google OAuth Client IDs:', { iosClientId, androidClientId, webClientId });
  console.log('[AuthScreen] Note: Add this exact redirect URI to Google Console (may include flowName parameter)');
  
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    webClientId, // Required for mobile apps using WebBrowser
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSignInSuccess(googleResponse.authentication);
    } else if (googleResponse?.type === 'error') {
      // Better error handling for Google OAuth errors
      const errorMsg = googleResponse.error?.message || googleResponse.error?.code || 'Google sign in failed';
      console.error('[AuthScreen] Google OAuth error:', googleResponse.error);
      
      // Handle specific OAuth errors
      if (errorMsg.includes('invalid_request') || errorMsg.includes('redirect_uri')) {
        setErrorMessage('OAuth configuration error. Please contact support.');
      } else if (errorMsg.includes('access_denied') || errorMsg.includes('cancelled')) {
        setErrorMessage('Sign in was cancelled.');
      } else if (errorMsg.includes('blocked') || errorMsg.includes("doesn't comply")) {
        setErrorMessage('This app needs to be verified by Google. Please contact support or try again later.');
      } else {
        setErrorMessage(getErrorMessage({ message: errorMsg }, 'auth.errors.verifyFailed'));
      }
      setIsSubmitting(false);
    } else if (googleResponse?.type === 'cancel') {
      // User cancelled, don't show error
      setIsSubmitting(false);
    }
  }, [googleResponse]);

  const handleGoogleSignInSuccess = async (authentication) => {
    try {
      if (!authentication?.accessToken) {
        throw new Error('No access token from Google');
      }

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${authentication.accessToken}` },
      });
      const userInfo = await userInfoResponse.json();

      if (!userInfo.email) {
        throw new Error('Could not get email from Google profile');
      }

      // Send to backend for verification
      const response = await ApiService.signInWithGoogle({
        accessToken: authentication.accessToken,
        idToken: authentication.idToken,
        email: userInfo.email,
        name: userInfo.name || undefined,
        picture: userInfo.picture || undefined,
      });

      if (response?.accessToken) {
        await ApiService.setToken(response.accessToken, response.refreshToken);
        setStatusMessage(t('auth.messages.signedIn'));
        // Wait a bit before calling onAuthSuccess to ensure token is saved and state is updated
        setTimeout(async () => {
          if (onAuthSuccess) {
            console.log('[AuthScreen] Calling onAuthSuccess for Apple Sign In');
            await onAuthSuccess();
            console.log('[AuthScreen] onAuthSuccess completed for Apple Sign In');
          }
        }, 500);
      } else {
        throw new Error('No access token received from server');
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'auth.errors.verifyFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      resetFeedback();

      if (!googleRequest) {
        throw new Error('Google OAuth not configured');
      }

      await googlePromptAsync();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'auth.errors.verifyFailed'));
      setIsSubmitting(false);
    }
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
      console.log('[AuthScreen] Requesting OTP for email:', trimmedEmail);
      console.log('[AuthScreen] API_BASE_URL from env:', process.env.EXPO_PUBLIC_API_BASE_URL);
      const response = await ApiService.requestOtp(trimmedEmail);
      console.log('[AuthScreen] OTP request successful:', response);
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
      console.error('[AuthScreen] OTP request error:', error);
      console.error('[AuthScreen] Error message:', error.message);
      console.error('[AuthScreen] Error status:', error.status);
      console.error('[AuthScreen] Error payload:', error.payload);
      
      if (error?.payload?.retryAfter) {
        setResendCooldown(error.payload.retryAfter);
      }
      // Better error handling for network errors
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        const networkErrorMsg = t('auth.errors.networkError') || 'Network error. Please check your internet connection and try again.';
        console.error('[AuthScreen] Network error detected, showing message:', networkErrorMsg);
        setErrorMessage(networkErrorMsg);
      } else {
        setErrorMessage(getErrorMessage(error, isResend ? 'auth.errors.resendFailed' : 'auth.errors.sendFailed'));
      }
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
        setStatusMessage(t('auth.messages.signedIn'));
        // Wait a bit before calling onAuthSuccess to ensure token is saved
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }, 100);
      } else {
        throw new Error('No access token received from server');
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

  const handleEmailSignIn = () => {
    setStep('email');
  };

  // Welcome screen with OAuth options (YAZIO-style)
  const welcomeStep = (
    <View style={styles.welcomeContainer}>
      <View style={styles.logoContainer}>
        {/* Logo will be loaded from assets/logo/Logo.svg or Logo.png */}
        <View style={styles.logoPlaceholder}>
          <Ionicons name="restaurant" size={64} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.welcomeTitle}>{t('auth.welcomeTitle')}</Text>
      <Text style={styles.welcomeSubtitle}>{t('auth.welcomeSubtitle')}</Text>

      <View style={styles.authButtonsContainer}>
        {Platform.OS === 'ios' && isAppleAvailable && (
          <TouchableOpacity
            style={[styles.oauthButton, styles.appleButton, isSubmitting && styles.disabledButton]}
            onPress={handleAppleSignIn}
            disabled={isSubmitting}
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.oauthButtonText}>{t('auth.signInWithApple')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.oauthButton, styles.googleButton, isSubmitting && styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={!googleRequest || isSubmitting}
        >
          <View style={styles.googleIconContainer}>
            <View style={styles.googleIcon}>
              <Text style={styles.googleG}>G</Text>
            </View>
          </View>
          <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.oauthButton, styles.emailButton, isSubmitting && styles.disabledButton]}
          onPress={handleEmailSignIn}
          disabled={isSubmitting}
        >
          <Ionicons name="mail-outline" size={20} color={colors.textPrimary} />
          <Text style={[styles.oauthButtonText, styles.emailButtonText]}>{t('auth.signUpWithEmail')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.termsText}>{t('auth.termsAcceptance')}</Text>
    </View>
  );

  const emailStep = (
    <View style={styles.card}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('welcome')}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

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

      {Boolean(errorMessage) && <Text style={styles.errorText}>{errorMessage}</Text>}

      {Boolean(statusMessage) && !errorMessage && <Text style={styles.successText}>{statusMessage}</Text>}

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

      {codeExpiresIn > 0 && <Text style={styles.helperText}>{t('auth.codeExpiresIn', { seconds: codeExpiresIn })}</Text>}

      {Boolean(errorMessage) && <Text style={styles.errorText}>{errorMessage}</Text>}

      {Boolean(statusMessage) && !errorMessage && <Text style={styles.successText}>{statusMessage}</Text>}

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
          {resendCooldown > 0 ? t('auth.resendIn', { seconds: resendCooldown }) : t('auth.resendCode')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {step === 'welcome' ? welcomeStep : step === 'email' ? emailStep : verifyStep}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(tokens, colors, isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: tokens.spacing.xl,
      paddingVertical: tokens.spacing.xxxl,
      justifyContent: 'center',
    },
    welcomeContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: tokens.spacing.xxxl,
    },
    logoContainer: {
      marginBottom: tokens.spacing.xxl,
      alignItems: 'center',
    },
    logoPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primaryTint,
      justifyContent: 'center',
      alignItems: 'center',
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: tokens.spacing.xxxl,
      paddingHorizontal: tokens.spacing.xl,
      lineHeight: 22,
    },
    authButtonsContainer: {
      width: '100%',
      gap: tokens.spacing.md,
      marginBottom: tokens.spacing.xxl,
    },
    oauthButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.lg,
      borderRadius: tokens.radii.lg,
      borderWidth: 1,
      gap: tokens.spacing.sm,
      minHeight: 52,
    },
    appleButton: {
      backgroundColor: '#000000',
      borderColor: '#333333',
    },
    googleButton: {
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderColor: isDark ? colors.borderMuted : '#E0E0E0',
    },
    emailButton: {
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderColor: isDark ? colors.borderMuted : '#E0E0E0',
    },
    oauthButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    googleButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? colors.textPrimary : '#1F2937', // Dark text on white background
    },
    emailButtonText: {
      color: colors.textPrimary,
    },
    googleIconContainer: {
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    googleIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#4285F4',
      justifyContent: 'center',
      alignItems: 'center',
    },
    googleG: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    termsText: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingHorizontal: tokens.spacing.xl,
      marginTop: tokens.spacing.lg,
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
