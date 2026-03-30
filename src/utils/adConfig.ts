/**
 * AdMob reklam ID'leri.
 *
 * ⚠️  PRODUCTION BUILD ÖNCE:
 *     ANDROID.banner, interstitial, rewarded değerlerini
 *     Google AdMob Console'dan aldığınız GERÇEK ID'lerle değiştirin.
 *     Ayrıca app.json > plugins > react-native-google-mobile-ads > androidAppId
 *     değerini de üretim App ID'niz ile güncelleyin.
 *
 * DEV modunda (__DEV__ === true) Google'ın resmi test ID'leri kullanılır.
 */

const IS_TEST = __DEV__;

// ── Gerçek Android ID'leriniz (production) ───────────────────────────────────
// TODO: Aşağıdaki değerleri AdMob Console'dan alınan gerçek ID'lerle değiştirin.
const ANDROID_PROD = {
  banner:       'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // ← DEĞİŞTİRİN
  interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // ← DEĞİŞTİRİN
  rewarded:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // ← DEĞİŞTİRİN
};

// ── Google resmi test ID'leri (DEV modunda otomatik kullanılır) ───────────────
const ANDROID_TEST = {
  banner:       'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded:     'ca-app-pub-3940256099942544/5224354917',
};

export const AD_UNIT_IDS = {
  banner:       IS_TEST ? ANDROID_TEST.banner       : ANDROID_PROD.banner,
  interstitial: IS_TEST ? ANDROID_TEST.interstitial : ANDROID_PROD.interstitial,
  rewarded:     IS_TEST ? ANDROID_TEST.rewarded     : ANDROID_PROD.rewarded,
};

/** Kaç ürün eklenince interstitial reklam gösterilsin */
export const INTERSTITIAL_EVERY_N = 3;
