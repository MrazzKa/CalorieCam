import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import i18n, { getSupportedLocales, setAppLocale } from './config';
import { LANGUAGE_OPTIONS } from './languages';

export const useI18n = () => {
  const { t } = useTranslation();

  const changeLanguage = useCallback(async (locale: string) => {
    await setAppLocale(locale);
  }, []);

  return {
    t,
    language: i18n.language,
    changeLanguage,
    availableLanguages: LANGUAGE_OPTIONS.filter(option =>
      getSupportedLocales().includes(option.code)
    ),
  } as const;
};
