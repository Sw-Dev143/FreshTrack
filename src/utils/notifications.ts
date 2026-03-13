import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const setupNotifications = async () => {
  if (Platform.OS === 'web') return false;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

export const scheduleExpirationNotification = async (productName: string, expirationDateString: string) => {
  if (Platform.OS === 'web') return;
  const expDate = new Date(expirationDateString);
  // Bildirimi SKT'den 1 gün önce saat 10:00'a kur
  expDate.setDate(expDate.getDate() - 1);
  expDate.setHours(10, 0, 0, 0);

  // Eğer hesaplanan zaman geçmişte kaldıysa bildirim kurma
  if (expDate.getTime() <= Date.now()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Yaklaşan Son Kullanma Tarihi!',
      body: `${productName} adlı ürününüzün son kullanma tarihi yarın doluyor.`,
      sound: true,
    },
    trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: expDate,
    },
  });
};
