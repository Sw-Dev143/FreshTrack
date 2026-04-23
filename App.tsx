import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import MedicationsScreen from './src/screens/MedicationsScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import MedicationStatsScreen from './src/screens/MedicationStatsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setupNotifications,
  rescheduleAllNotifications,
  scheduleDailySummary,
  rescheduleAllMedicationReminders,
} from './src/utils/notifications';
import { getProducts } from './src/utils/storage';
import { getMedications } from './src/utils/medicationStorage';
import { PremiumProvider } from './src/context/PremiumContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { incrementLaunchCount, requestReviewIfAppropriate } from './src/utils/rating';
import './src/i18n';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Navigation (useTheme için Provider içinde olmalı) ─────────────────────────
function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [isReady, setIsReady] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState<'Home' | 'Onboarding'>('Home');

  useEffect(() => {
    let cancelled = false;

    // 10 saniye güvenlik zamanlayıcısı — bildirim kurulumu takılsa bile uygulama açılır
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        console.warn('[App] Safety timeout: forcing app ready');
        setIsReady(true);
      }
    }, 10000);

    const init = async () => {
      // ── 1. Bildirimler (hata olsa bile devam et) ──────────────────────────
      try {
        const granted = await setupNotifications();
        if (granted) {
          const products = await getProducts();
          await rescheduleAllNotifications(products);

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          let expired = 0;
          let warning = 0;
          for (const p of products) {
            const d = Math.ceil(
              (new Date(p.expirationDate).getTime() - today.getTime()) / 86400000
            );
            if (d < 0) expired++;
            else if (d <= 3) warning++;
          }
          await scheduleDailySummary(expired, warning);

          const medications = await getMedications();
          await rescheduleAllMedicationReminders(medications);
        }
      } catch (error) {
        console.warn('[App] Notification init error:', error);
      }

      // ── 2. Onboarding kontrolü (her durumda çalışır) ──────────────────────
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('@raf_omrum_has_seen_onboarding');
        if (hasSeenOnboarding !== 'true') {
          setInitialRoute('Onboarding');
        } else {
          await incrementLaunchCount();
          setTimeout(() => requestReviewIfAppropriate(false), 2000);
        }
      } catch (storageErr) {
        console.warn('[App] AsyncStorage GET error:', storageErr);
      }

      // ── 3. Hazır ──────────────────────────────────────────────────────────
      if (!cancelled) {
        clearTimeout(safetyTimer);
        setIsReady(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Splash Screen'i gizle
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [isReady]);

  // Hazır değilken SplashScreen görünür — beyaz ekran yok
  if (!isReady) return null;

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.secondary,
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddProduct"
            component={AddProductScreen}
            options={{ title: t('navigation.addProduct') }}
          />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ title: t('navigation.productDetails') }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="Medications"
            component={MedicationsScreen}
            options={{ title: t('navigation.medications') }}
          />
          <Stack.Screen
            name="AddMedication"
            component={AddMedicationScreen}
            options={({ route }) => ({
              title: route.params?.medicationToEdit ? t('navigation.editMedication') : t('navigation.addMedication'),
            })}
          />
          <Stack.Screen
            name="MedicationStats"
            component={MedicationStatsScreen}
            options={{ title: t('navigation.medicationStats') }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: t('navigation.settings') || 'Ayarlar' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <PremiumProvider>
          <ThemeProvider>
            <AppNavigator />
          </ThemeProvider>
        </PremiumProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
