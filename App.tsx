import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import MedicationsScreen from './src/screens/MedicationsScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import MedicationStatsScreen from './src/screens/MedicationStatsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Navigation (useTheme için Provider içinde olmalı) ─────────────────────────
function AppNavigator() {
  const { colors, isDark } = useTheme();
  const [isReady, setIsReady] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState<'Home' | 'Onboarding'>('Home');

  useEffect(() => {
    const init = async () => {
      const granted = await setupNotifications();
      if (!granted) return;

      // Ürün bildirimleri
      const products = await getProducts();
      await rescheduleAllNotifications(products);

      const today = new Date(); today.setHours(0, 0, 0, 0);
      let expired = 0; let warning = 0;
      for (const p of products) {
        const d = Math.ceil((new Date(p.expirationDate).getTime() - today.getTime()) / 86400000);
        if (d < 0) expired++;
        else if (d <= 3) warning++;
      }
      await scheduleDailySummary(expired, warning);

      // İlaç bildirimleri
      const medications = await getMedications();
      await rescheduleAllMedicationReminders(medications);

      const hasSeenOnboarding = await AsyncStorage.getItem('@raf_omrum_has_seen_onboarding');
      if (hasSeenOnboarding !== 'true') {
        setInitialRoute('Onboarding');
      }
      setIsReady(true);
    };
    init();
  }, []);

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
            options={{ title: 'Yeni Ürün Ekle' }}
          />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ title: 'Ürün Detayı' }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="Medications"
            component={MedicationsScreen}
            options={{ title: '💊 İlaç Hatırlatıcı' }}
          />
          <Stack.Screen
            name="AddMedication"
            component={AddMedicationScreen}
            options={({ route }) => ({
              title: route.params?.medicationToEdit ? 'İlacı Düzenle' : 'Yeni İlaç Ekle',
            })}
          />
          <Stack.Screen
            name="MedicationStats"
            component={MedicationStatsScreen}
            options={{ title: '📊 İlaç İstatistikleri' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <PremiumProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </PremiumProvider>
  );
}
