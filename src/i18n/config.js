import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import ru from './locales/ru.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';

const LANGUAGE_KEY = '@caloriecam:language';

// Detect device language
const getDeviceLanguage = () => {
  try {
    const locales = getLocales();
    const locale = locales[0];
    const languageCode = locale?.languageCode || 'en';
    // Map to supported languages
    const supportedLanguages = ['en', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'];
    return supportedLanguages.includes(languageCode) ? languageCode : 'en';
  } catch (error) {
    return 'en';
  }
};

// Load saved language or detect device language
const loadLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
    return getDeviceLanguage();
  } catch (error) {
    console.error('Error loading language:', error);
    return 'en';
  }
};

// Save language preference
export const saveLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Initialize i18n synchronously for immediate use
// Language will be loaded asynchronously
const initI18n = () => {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: { translation: en },
        ru: { translation: ru },
        es: { translation: es },
        fr: { translation: fr },
        de: { translation: de },
        it: { translation: it },
        pt: { translation: pt },
        zh: { translation: zh },
        ja: { translation: ja },
        ko: { translation: ko },
      },
      lng: 'en', // Default, will be updated after loading
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false,
      },
    });

  // Load saved language asynchronously
  loadLanguage().then(language => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }).catch(err => {
    console.error('Error loading language:', err);
  });

  return i18n;
};

export default initI18n();

