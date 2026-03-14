import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_MAP_KEY = '@raf_omrum_notif_ids'; // barcode_id → [notifId, ...]

// ── Bildirim işleyici ────────────────────────────────────────────────────────
export const setupNotifications = async (): Promise<boolean> => {
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

  // Android kanalları
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-danger', {
      name: '🔴 Kritik - Bugün / Yarın Doluyor',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#EF4444',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('expiry-warning', {
      name: '⚠️ Uyarı - 3 Gün İçinde',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('expiry-info', {
      name: 'ℹ️ Bilgi - 7 Gün İçinde',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#4F46E5',
    });
    await Notifications.setNotificationChannelAsync('daily-summary', {
      name: '📋 Günlük Özet',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#4F46E5',
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

// ── Yardımcılar ──────────────────────────────────────────────────────────────

/** Bildirim ID haritasını oku */
async function readMap(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/** Bildirim ID haritasını kaydet */
async function writeMap(map: Record<string, string[]>): Promise<void> {
  try { await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(map)); } catch {}
}

/** Tarihe göre bildirim başlık/mesaj/kanal seç */
function buildNotifContent(productName: string, daysOffset: number): {
  title: string; body: string; channelId: string;
} {
  if (daysOffset <= 1) return {
    title: '🔴 Bugün Son Gün!',
    body: `${productName} bugün son kullanma tarihine ulaşıyor. Kontrol etmeyi unutmayın!`,
    channelId: 'expiry-danger',
  };
  if (daysOffset <= 3) return {
    title: '⚠️ Son Kullanma Tarihi Yaklaşıyor',
    body: `${productName} ürününüzün son kullanma tarihine ${daysOffset} gün kaldı.`,
    channelId: 'expiry-warning',
  };
  return {
    title: 'ℹ️ Son Kullanma Tarihi Hatırlatıcı',
    body: `${productName} ürününüzün son kullanma tarihine ${daysOffset} gün kaldı.`,
    channelId: 'expiry-info',
  };
}

// ── Ana API ──────────────────────────────────────────────────────────────────

/**
 * Bir ürün için 3 katmanlı bildirim schedule eder:
 * → 7 gün önce (bilgi), 3 gün önce (uyarı), 1 gün önce (kritik)
 */
export const scheduleExpirationNotification = async (
  productId: string,
  productName: string,
  expirationDateString: string,
): Promise<void> => {
  if (Platform.OS === 'web') return;

  // Önce bu ürünün eski bildirimlerini iptal et
  await cancelNotificationsForProduct(productId);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDateString); expDate.setHours(0, 0, 0, 0);
  const totalDays = Math.ceil((expDate.getTime() - today.getTime()) / 86400000);

  const offsets = [7, 3, 1].filter(d => d < totalDays); // geçmişteyse atla
  const scheduledIds: string[] = [];

  for (const offset of offsets) {
    const triggerDate = new Date(expirationDateString);
    triggerDate.setDate(triggerDate.getDate() - offset);
    triggerDate.setHours(9, 0, 0, 0); // Sabah 09:00

    if (triggerDate.getTime() <= Date.now()) continue;

    const { title, body, channelId } = buildNotifContent(productName, offset);
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { productId, productName },
          ...(Platform.OS === 'android' ? { channelId } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      scheduledIds.push(id);
    } catch (e) {
      console.warn('[Notifications] Schedule error:', e);
    }
  }

  // ID'leri kaydet
  if (scheduledIds.length > 0) {
    const map = await readMap();
    map[productId] = scheduledIds;
    await writeMap(map);
  }
};

/**
 * Bir ürün silindiğinde tüm bildirimlerini iptal eder.
 */
export const cancelNotificationsForProduct = async (productId: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const map = await readMap();
  const ids = map[productId];
  if (!ids || ids.length === 0) return;

  await Promise.allSettled(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  delete map[productId];
  await writeMap(map);
};

/**
 * Tüm ürünler için bildirimleri yeniden schedule eder.
 * App açılışında çağrıla­bilir (güncel ürün listesi gerekir).
 */
export const rescheduleAllNotifications = async (
  products: Array<{ id: string; name: string; expirationDate: string }>,
): Promise<void> => {
  if (Platform.OS === 'web') return;
  // Önce hepsini temizle
  await Notifications.cancelAllScheduledNotificationsAsync();
  await writeMap({});
  // Yeniden kur
  for (const p of products) {
    await scheduleExpirationNotification(p.id, p.name, p.expirationDate);
  }
};

/**
 * Günlük özet bildirimi - her gün sabah 08:30 çalışır.
 * expiredCount ve warningCount ile kullanıcıyı bilgilendirir.
 */
export const scheduleDailySummary = async (
  expiredCount: number,
  warningCount: number,
): Promise<void> => {
  if (Platform.OS === 'web' || (expiredCount === 0 && warningCount === 0)) return;

  // Önceki günlük özet varsa iptal et
  const map = await readMap();
  if (map['__daily__']) {
    await Promise.allSettled(
      map['__daily__'].map(id => Notifications.cancelScheduledNotificationAsync(id))
    );
  }

  const trigger = new Date();
  trigger.setDate(trigger.getDate() + 1);
  trigger.setHours(8, 30, 0, 0);

  const parts: string[] = [];
  if (expiredCount > 0) parts.push(`${expiredCount} ürünün süresi geçti`);
  if (warningCount > 0) parts.push(`${warningCount} ürün yakında doluyor`);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Raf Ömrüm Günlük Özet',
        body: parts.join(', ') + '. Raflarınızı kontrol etmeyi unutmayın!',
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'daily-summary' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
    map['__daily__'] = [id];
    await writeMap(map);
  } catch (e) {
    console.warn('[Notifications] Daily summary error:', e);
  }
};
