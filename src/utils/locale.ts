export type AppLocale = 'en' | 'ru' | 'kk';

/**
 * Map i18n language codes (e.g. 'en', 'en-US', 'ru-RU', 'kk-KZ') to backend locales.
 */
export const mapLanguageToLocale = (lng?: string | null): AppLocale => {
  if (!lng) return 'en';
  const lower = lng.toLowerCase();
  if (lower.startsWith('ru')) return 'ru';
  if (lower.startsWith('kk') || lower.startsWith('kz')) return 'kk';
  return 'en';
};


