import { useTranslation } from 'react-i18next';

export const useI18n = () => {
  const { t, i18n } = useTranslation();
  
  return {
    t,
    language: i18n.language,
    changeLanguage: (lang) => i18n.changeLanguage(lang),
    availableLanguages: ['en', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'],
  };
};

