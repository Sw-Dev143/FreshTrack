import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './translations/en.json';
import tr from './translations/tr.json';
import zh from './translations/zh.json';
import es from './translations/es.json';
import de from './translations/de.json';
import fr from './translations/fr.json';
import ja from './translations/ja.json';
import ru from './translations/ru.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  zh: { translation: zh },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  ja: { translation: ja },
  ru: { translation: ru },
};

const deviceLanguage = getLocales()[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Object.keys(resources).includes(deviceLanguage) ? deviceLanguage : 'en',
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
