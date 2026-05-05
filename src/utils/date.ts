import i18n from '../i18n';

// Language code → standard locale identifier
const LOCALE_MAP: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  zh: 'zh-CN',
  ja: 'ja-JP',
};

/**
 * Returns the standard locale identifier for the given language code.
 * Falls back to i18n.language, then 'tr-TR'.
 */
export const getLocaleForLang = (lang?: string): string => {
  const key = lang || i18n.language || 'tr';
  return LOCALE_MAP[key] || 'tr-TR';
};

/**
 * Formats a date using the app's currently active language.
 * Pass `lang` explicitly to make component reactive on language change.
 */
export const formatDate = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  lang?: string,
): string => {
  const dateObj = new Date(date);
  const locale = getLocaleForLang(lang);
  return dateObj.toLocaleDateString(locale, options);
};
