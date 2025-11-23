import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import i18n, { getSupportedLocales, setAppLocale } from './config';
import { LANGUAGE_OPTIONS } from './languages';

export const useI18n = () => {
  // Безопасный useTranslation с fallback
  let translation;
  try {
    translation = useTranslation();
  } catch (error) {
    console.warn('[useI18n] useTranslation failed, using fallback:', error);
    // Fallback если i18n не инициализирован
    translation = {
      t: (key: string) => key,
      i18n: { language: 'en' },
      ready: false,
    };
  }

  const { t } = translation;

  const changeLanguage = useCallback(async (locale: string) => {
    try {
      await setAppLocale(locale);
    } catch (error) {
      console.warn('[useI18n] Failed to change language:', error);
    }
  }, []);

  return {
    t: t || ((key: string) => key),
    language: i18n?.language || 'en',
    changeLanguage,
    availableLanguages: LANGUAGE_OPTIONS.filter(option =>
      getSupportedLocales().includes(option.code)
    ),
  } as const;
};
