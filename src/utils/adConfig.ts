/**
 * AdMob reklam ID'leri.
 * __DEV__ true ise Google'ın resmi test ID'leri kullanılır,
 * production build'de gerçek ID'lere geçilecek.
 */

const IS_TEST = __DEV__;

// ── Android ─────────────────────────────────────────────────────────────────
const ANDROID = {
  // Gerçek ID'lerinizi buraya yazın (production için)
  banner:       'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  rewarded:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};

// Google'ın resmi test ID'leri (DEV modunda bu kullanılır)
const ANDROID_TEST = {
  banner:       'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded:     'ca-app-pub-3940256099942544/5224354917',
};

export const AD_UNIT_IDS = {
  banner:       IS_TEST ? ANDROID_TEST.banner       : ANDROID.banner,
  interstitial: IS_TEST ? ANDROID_TEST.interstitial : ANDROID.interstitial,
  rewarded:     IS_TEST ? ANDROID_TEST.rewarded     : ANDROID.rewarded,
};

/** Kaç ürün eklenince interstitial gösterilsin */
export const INTERSTITIAL_EVERY_N = 3;
