import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { InterstitialAd, AdEventType } from '../utils/ads';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AD_UNIT_IDS, INTERSTITIAL_EVERY_N } from '../utils/adConfig';

const COUNTER_KEY = '@raf_omrum_add_count';

/**
 * Her N ürün eklemede bir interstitial reklam gösterir.
 * Bug fix: InterstitialAd artık useRef ile lazy init edilir —
 * hot reload / dev modunda birden fazla listener birikmez.
 */
export function useInterstitialAd(isPremium: boolean) {
  const adRef     = useRef<any>(null);
  const isLoaded  = useRef(false);
  const isShowing = useRef(false);

  const getAd = useCallback((): any => {
    if (Platform.OS === 'web') return null;
    if (!adRef.current) {
      adRef.current = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
        requestNonPersonalizedAdsOnly: true,
      });
    }
    return adRef.current;
  }, []);

  const loadAd = useCallback(() => {
    if (isPremium || isShowing.current || Platform.OS === 'web') return;
    try {
      getAd().load();
    } catch {
      // Sessizce geç
    }
  }, [isPremium, getAd]);

  useEffect(() => {
    if (isPremium || Platform.OS === 'web') return;

    const ad = getAd();

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded.current = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      isLoaded.current  = false;
      isShowing.current = false;
      loadAd(); // bir sonraki için hazırla
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      isLoaded.current = false;
      setTimeout(loadAd, 10_000);
    });

    loadAd();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [isPremium, loadAd, getAd]);

  /**
   * Ürün eklendiğinde çağır.
   * Her INTERSTITIAL_EVERY_N ürün eklemesinde interstitial gösterir.
   */
  const onProductAdded = useCallback(async () => {
    if (isPremium) return;

    try {
      const raw   = await AsyncStorage.getItem(COUNTER_KEY);
      const count = (raw ? parseInt(raw, 10) : 0) + 1;
      await AsyncStorage.setItem(COUNTER_KEY, String(count));

      if (count % INTERSTITIAL_EVERY_N === 0 && isLoaded.current && !isShowing.current) {
        isShowing.current = true;
        getAd().show();
      }
    } catch {
      // AsyncStorage hatası — devam et
    }
  }, [isPremium, getAd]);

  return { onProductAdded, loadAd };
}
