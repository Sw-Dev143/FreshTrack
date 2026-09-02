import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const NOTIF_MAP_KEY = '@raf_omrum_notif_ids'; // barcode_id → [notifId, ...]

// ── Notification Handler ───────────────────────────────────────────────────
export const setupNotifications = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Android channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('expiry-danger', {
        name: i18n.t('notifications.expiry.danger') || 'Expiry Danger',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#EF4444',
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('expiry-warning', {
        name: i18n.t('notifications.expiry.warning') || 'Expiry Warning',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('expiry-info', {
        name: i18n.t('notifications.expiry.info') || 'Expiry Info',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#4F46E5',
      });
      await Notifications.setNotificationChannelAsync('daily-summary', {
        name: i18n.t('notifications.dailySummary.title') || 'Daily Summary',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#4F46E5',
      });
      await Notifications.setNotificationChannelAsync('medication-reminder', {
        name: i18n.t('navigation.medications') || 'Medications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400],
        lightColor: '#10B981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.error('[Notifications] Setup error:', error);
    return false;
  }
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Read notification ID map */
async function readMap(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/** Save notification ID map */
async function writeMap(map: Record<string, string[]>): Promise<void> {
  try { await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(map)); } catch {}
}

/** Build notification content based on days offset */
function buildNotifContent(productName: string, daysOffset: number): {
  title: string; body: string; channelId: string;
} {
  if (daysOffset <= 1) return {
    title: i18n.t('notifications.expiry.danger'),
    body: i18n.t('notifications.expiry.dangerBody', { productName }),
    channelId: 'expiry-danger',
  };
  if (daysOffset <= 3) return {
    title: i18n.t('notifications.expiry.warning'),
    body: i18n.t('notifications.expiry.warningBody', { productName, days: daysOffset }),
    channelId: 'expiry-warning',
  };
  return {
    title: i18n.t('notifications.expiry.info'),
    body: i18n.t('notifications.expiry.infoBody', { productName, days: daysOffset }),
    channelId: 'expiry-info',
  };
}

// ── Main API ─────────────────────────────────────────────────────────────────

/**
 * Schedules 3-tier notifications for a product:
 * → 7 days before (info), 3 days before (warning), 1 day before (critical)
 */
export const scheduleExpirationNotification = async (
  productId: string,
  productName: string,
  expirationDateString: string,
): Promise<void> => {
  if (Platform.OS === 'web') return;

  // Cancel old notifications for this product
  await cancelNotificationsForProduct(productId);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDateString); expDate.setHours(0, 0, 0, 0);
  const totalDays = Math.ceil((expDate.getTime() - today.getTime()) / 86400000);

  const offsets = [7, 3, 1].filter(d => d < totalDays); // Skip if in the past
  const scheduledIds: string[] = [];

  for (const offset of offsets) {
    const triggerDate = new Date(expirationDateString);
    triggerDate.setDate(triggerDate.getDate() - offset);
    triggerDate.setHours(9, 0, 0, 0); // 09:00 AM

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

  // Save IDs
  if (scheduledIds.length > 0) {
    const map = await readMap();
    map[productId] = scheduledIds;
    await writeMap(map);
  }
};

/**
 * Cancels all notifications for a product when deleted.
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
 * Reschedules all product notifications.
 */
export const rescheduleAllNotifications = async (
  products: Array<{ id: string; name: string; expirationDate: string }>,
): Promise<void> => {
  if (Platform.OS === 'web') return;
  // Clear all first
  await Notifications.cancelAllScheduledNotificationsAsync();
  await writeMap({});
  // Setup again
  for (const p of products) {
    await scheduleExpirationNotification(p.id, p.name, p.expirationDate);
  }
};

/**
 * Daily summary notification - runs every morning at 08:30 AM.
 */
export const scheduleDailySummary = async (
  expiredCount: number,
  warningCount: number,
): Promise<void> => {
  if (Platform.OS === 'web') return;

  // Cancel previous daily summary if exists
  const map = await readMap();
  if (map['__daily__']) {
    await Promise.allSettled(
      map['__daily__'].map(id => Notifications.cancelScheduledNotificationAsync(id))
    );
    delete map['__daily__'];
    await writeMap(map);
  }

  // Exit if nothing to notify
  if (expiredCount === 0 && warningCount === 0) return;

  const trigger = new Date();
  trigger.setDate(trigger.getDate() + 1);
  trigger.setHours(8, 30, 0, 0);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.dailySummary.title'),
        body: i18n.t('notifications.dailySummary.body', { expired: expiredCount, warning: warningCount }),
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

// ── Medication Reminders ─────────────────────────────────────────────────────

import { Medication, DayOfWeek } from '../types';

const MED_NOTIF_PREFIX = '__med__';

/**
 * Sets up repeating notifications for a medication.
 */
export const scheduleMedicationReminders = async (med: Medication): Promise<void> => {
  if (Platform.OS === 'web' || !med.active) return;

  await cancelMedicationReminders(med.id);

  const map = await readMap();
  const scheduledIds: string[] = [];

  // Which days to notify: empty = 0-6 (every day)
  const targetDays: DayOfWeek[] = med.days.length > 0
    ? med.days
    : [0, 1, 2, 3, 4, 5, 6];

  for (const time of med.times) {
    for (const dow of targetDays) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `💊 ${med.name}`,
            body: med.dosage
              ? i18n.t('notifications.medication.body', { dosage: med.dosage })
              : i18n.t('notifications.medication.bodyNoDosage'),
            sound: true,
            data: { medicationId: med.id, hour: time.hour, minute: time.minute },
            ...(Platform.OS === 'android' ? { channelId: 'medication-reminder' } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            repeats: true,
            weekday: dow + 1, // expo: 1=Sunday … 7=Saturday
            hour: time.hour,
            minute: time.minute,
            second: 0,
          },
        });
        scheduledIds.push(id);
      } catch (e) {
        console.warn('[Notifications] Med schedule error:', e);
      }
    }
  }

  if (scheduledIds.length > 0) {
    map[`${MED_NOTIF_PREFIX}${med.id}`] = scheduledIds;
    await writeMap(map);
  }
};

/**
 * Cancels all medication reminders.
 */
export const cancelMedicationReminders = async (medicationId: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const map = await readMap();
  const key = `${MED_NOTIF_PREFIX}${medicationId}`;
  const ids = map[key];
  if (!ids || ids.length === 0) return;
  await Promise.allSettled(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  delete map[key];
  await writeMap(map);
};

/**
 * Reschedules all active medication reminders.
 */
export const rescheduleAllMedicationReminders = async (
  medications: Medication[]
): Promise<void> => {
  if (Platform.OS === 'web') return;
  for (const med of medications) {
    if (med.active) await scheduleMedicationReminders(med);
    else await cancelMedicationReminders(med.id);
  }
};
