import { useEffect, useRef, useCallback } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AD_UNIT_IDS, INTERSTITIAL_EVERY_N } from '../utils/adConfig';

const COUNTER_KEY = '@raf_omrum_add_count';

const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
  requestNonPersonalizedAdsOnly: true,
});

/**
 * Her N ürün eklemede bir interstitial reklam gösterir.
 * Kullanım: AddProductScreen'de kaydetme sonrası `onProductAdded()` çağır.
 */
export function useInterstitialAd(isPremium: boolean) {
  const isLoaded = useRef(false);
  const isShowing = useRef(false);

  // Reklam yükle
  const loadAd = useCallback(() => {
    if (isPremium || isShowing.current) return;
    try {
      interstitial.load();
    } catch (e) {
      // Sessizce geç
    }
  }, [isPremium]);

  useEffect(() => {
    if (isPremium) return;

    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded.current = true;
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      isLoaded.current = false;
      isShowing.current = false;
      loadAd(); // bir sonraki için hazırla
    });
    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      isLoaded.current = false;
      // 10 sn sonra tekrar dene
      setTimeout(loadAd, 10_000);
    });

    loadAd();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [isPremium, loadAd]);

  /**
   * Ürün eklendiğinde çağır.
   * Her INTERSTITIAL_EVERY_N ürün eklemesinde interstitial gösterir.
   */
  const onProductAdded = useCallback(async () => {
    if (isPremium) return;

    try {
      const raw = await AsyncStorage.getItem(COUNTER_KEY);
      const count = (raw ? parseInt(raw, 10) : 0) + 1;
      await AsyncStorage.setItem(COUNTER_KEY, String(count));

      if (count % INTERSTITIAL_EVERY_N === 0 && isLoaded.current && !isShowing.current) {
        isShowing.current = true;
        interstitial.show();
      }
    } catch {
      // AsyncStorage hatası — devam et
    }
  }, [isPremium]);

  return { onProductAdded, loadAd };
}
