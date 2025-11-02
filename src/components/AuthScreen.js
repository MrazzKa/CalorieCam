import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/apiService';
import { PADDING, SPACING, BORDER_RADIUS } from '../utils/designConstants';

export default function AuthScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authMethod, setAuthMethod] = useState(null); // 'otp' or 'magic'
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Неверный email', 'Пожалуйста, введите корректный email адрес');
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.requestOtp(email);
      setAuthMethod('otp');
      setOtpSent(true);
      Alert.alert(
        'Код отправлен',
        'Проверьте почту - мы отправили код подтверждения.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('OTP request error:', error);
      Alert.alert(
        'Ошибка',
        error.message || 'Не удалось отправить код. Попробуйте еще раз.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestMagicLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Неверный email', 'Пожалуйста, введите корректный email адрес');
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.requestMagicLink(email);
      setAuthMethod('magic');
      Alert.alert(
        'Ссылка отправлена',
        'Проверьте почту и перейдите по ссылке для входа.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Magic link request error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send magic link. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      Alert.alert('Неверный код', 'Пожалуйста, введите 6-значный код из письма');
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.verifyOtp(email, otpCode);
      
      // Save tokens
      if (response.accessToken && response.refreshToken) {
        await ApiService.setToken(response.accessToken, response.refreshToken);
        Alert.alert('Успешно', 'Вы вошли в аккаунт!', [
          { text: 'OK', onPress: () => onAuthSuccess && onAuthSuccess() }
        ]);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert(
        'Неверный код',
        error.message || 'Введенный код неверен. Пожалуйста, попробуйте еще раз.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setAuthMethod(null);
    setOtpSent(false);
    setOtpCode('');
  };

  if (!authMethod) {
    // Initial screen - choose auth method
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Ionicons name="camera" size={64} color="#007AFF" />
            </View>
            
            <Text style={styles.title}>Добро пожаловать в CalorieCam</Text>
            <Text style={styles.subtitle}>
              Войдите, чтобы отслеживать питание и достигать ваших целей
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email адрес</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#8E8E93"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Войти по коду из email</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleRequestMagicLink}
                disabled={isLoading}
              >
                <Ionicons name="link-outline" size={20} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Войти по ссылке</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (authMethod === 'otp' && otpSent) {
    // OTP verification screen
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Ionicons name="mail" size={64} color="#007AFF" />
            </View>
            
            <Text style={styles.title}>Введите код подтверждения</Text>
            <Text style={styles.subtitle}>
              Мы отправили 6-значный код на{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Код подтверждения</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor="#8E8E93"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Подтвердить</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleRequestOtp}
              disabled={isLoading}
            >
              <Text style={styles.resendText}>Отправить код повторно</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Magic link sent screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Ionicons name="mail-open" size={64} color="#007AFF" />
        </View>
        
        <Text style={styles.title}>Проверьте почту</Text>
        <Text style={styles.subtitle}>
          Мы отправили ссылку для входа на{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        <Text style={styles.magicLinkText}>
          Перейдите по ссылке в письме, чтобы войти. Ссылка действительна 15 минут.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRequestMagicLink}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Отправить ссылку повторно</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
    paddingTop: 40,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: PADDING.screen,
    zIndex: 1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resendButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  resendText: {
    color: '#007AFF',
    fontSize: 16,
  },
  magicLinkText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 20,
  },
});

