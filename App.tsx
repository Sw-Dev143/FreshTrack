import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import { setupNotifications, rescheduleAllNotifications, scheduleDailySummary } from './src/utils/notifications';
import { getProducts } from './src/utils/storage';
import { COLORS } from './src/theme';
import { PremiumProvider } from './src/context/PremiumContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    const init = async () => {
      const granted = await setupNotifications();
      if (!granted) return;

      // Ürünleri yükle ve bildirimleri güncelle
      const products = await getProducts();

      // Tüm bildirimleri yeniden schedule et (uygulama güncellendi vs.)
      await rescheduleAllNotifications(products);

      // Günlük özet bildirimi kur
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let expired = 0; let warning = 0;
      for (const p of products) {
        const d = Math.ceil((new Date(p.expirationDate).getTime() - today.getTime()) / 86400000);
        if (d < 0) expired++;
        else if (d <= 3) warning++;
      }
      await scheduleDailySummary(expired, warning);
    };

    init();
  }, []);

  return (
    <PremiumProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.surface },
            headerTintColor: COLORS.secondary,
            headerShadowVisible: false,
          }}
        >
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
        </Stack.Navigator>
      </NavigationContainer>
    </PremiumProvider>
  );
}
