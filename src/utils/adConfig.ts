/**
 * AdMob reklam ID'leri.
 *
 * ⚠️  PRODUCTION BUILD ÖNCE:
 *     Aşağıdaki ANDROID_PROD nesnesini Google AdMob Console'dan
 *     aldığınız GERÇEK ID'lerle güncellediğinizden emin olun.
 *
 *     Ayrıca app.json > plugins > react-native-google-mobile-ads > androidAppId
 *     değerini de üretim App ID'niz ile güncellemeyi unutmayın.
 */

const IS_TEST = __DEV__;

// ── Üretim (Production) ID'leri ──────────────────────────────────────────────
// TODO: AdMob Console'dan aldığınız gerçek ID'leri buraya yapıştırın.
const ANDROID_PROD = {
  banner:       'ca-app-pub-9730088447835930/5766874757',
  interstitial: 'ca-app-pub-9730088447835930/6094177816',
  rewarded:     'ca-app-pub-9730088447835930/XXXXXXXXXX', // Gelecek kullanım için
};

// ── Test ID'leri (Google Resmi Test ID'leri) ──────────────────────────────────
const ANDROID_TEST = {
  banner:       'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded:     'ca-app-pub-3940256099942544/5224354917',
};

/**
 * Uygulamanın hangi reklam birimlerini kullanacağını belirler.
 * Geliştirme aşamasında otomatik olarak Test ID'leri kullanılır.
 */
export const AD_UNIT_IDS = {
  banner:       IS_TEST ? ANDROID_TEST.banner       : ANDROID_PROD.banner,
  interstitial: IS_TEST ? ANDROID_TEST.interstitial : ANDROID_PROD.interstitial,
  rewarded:     IS_TEST ? ANDROID_TEST.rewarded     : ANDROID_PROD.rewarded,
};

/**
 * Kullanıcı Deneyimi (UX): Reklamların kullanıcıyı çok sıkmaması için
 * her N üründe bir gösterilecek şekilde ayarlanmıştır.
 */
export const INTERSTITIAL_EVERY_N = 5;
