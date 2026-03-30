import React from 'react';

export const BannerAd = (props: any) => null;

export const BannerAdSize = {
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
};

export const InterstitialAd = {
  createForAdRequest: (adUnitId: string, requestOptions?: any) => ({
    load: () => {},
    show: () => {},
    addAdEventListener: (eventType: string, callback: () => void) => () => {},
  }),
};

export const AdEventType = {
  LOADED: 'LOADED',
  CLOSED: 'CLOSED',
  ERROR: 'ERROR',
};
