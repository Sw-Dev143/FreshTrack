/**
 * FreshTrack AdMob Configuration
 *
 * ⚠️ ACTION REQUIRED FOR PRODUCTION:
 * 1. Replace placeholder IDs in ANDROID_PROD with your actual AdMob Unit IDs.
 * 2. Update 'androidAppId' in app.json with your AdMob App ID.
 *
 * In development mode (__DEV__), Google's official test IDs are used automatically.
 */

const IS_TEST = __DEV__;

// ── Production IDs (From AdMob Console) ──────────────────────────────────────
const ANDROID_PROD = {
  // TODO: Replace with your actual Banner Ad Unit ID
  banner:       'ca-app-pub-9730088447835930/5766874757',

  // TODO: Replace with your actual Interstitial Ad Unit ID
  interstitial: 'ca-app-pub-9730088447835930/6094177816',

  // Optional: Replace with your Rewarded Ad Unit ID if used in the future
  rewarded:     'ca-app-pub-9730088447835930/XXXXXXXXXX',
};

// ── Google's Official Test IDs (Safe for Development) ───────────────────────
const ANDROID_TEST = {
  banner:       'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded:     'ca-app-pub-3940256099942544/5224354917',
};

/**
 * Automatically selects the appropriate ID based on the environment.
 */
export const AD_UNIT_IDS = {
  banner:       IS_TEST ? ANDROID_TEST.banner       : ANDROID_PROD.banner,
  interstitial: IS_TEST ? ANDROID_TEST.interstitial : ANDROID_PROD.interstitial,
  rewarded:     IS_TEST ? ANDROID_TEST.rewarded     : ANDROID_PROD.rewarded,
};

/**
 * UX Tuning: Show an interstitial ad every N items added to avoid annoying users.
 */
export const INTERSTITIAL_EVERY_N = 5;

// Validation Check
if (!IS_TEST && ANDROID_PROD.banner.includes('XXXXX')) {
  console.warn('⚠️ FreshTrack: You are using placeholder AdMob IDs in production!');
}
