import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../theme';

// ── Tipler ───────────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark';

export type ThemeColors = typeof LIGHT_COLORS;

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = '@theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: LIGHT_COLORS,
  isDark: false,
  toggleTheme: () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Kaydedilmiş temayı yükle
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light') setMode(saved);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value: ThemeContextValue = {
    mode,
    colors: mode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    isDark: mode === 'dark',
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useTheme = () => useContext(ThemeContext);
