import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, DoseLog } from '../types';
import { cancelMedicationReminders, scheduleMedicationReminders } from './notifications';

const MEDICATIONS_KEY = '@raf_omrum_medications';
const DOSE_LOGS_KEY   = '@raf_omrum_dose_logs';

// ── İlaçlar ──────────────────────────────────────────────────────────────────

export const getMedications = async (): Promise<Medication[]> => {
  try {
    const raw = await AsyncStorage.getItem(MEDICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const saveMedication = async (med: Medication): Promise<void> => {
  try {
    const all = await getMedications();
    const idx = all.findIndex(m => m.id === med.id);
    if (idx >= 0) all[idx] = med;
    else all.push(med);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(all));
  } catch (e) { console.error('saveMedication error', e); }
};

export const deleteMedication = async (id: string): Promise<void> => {
  try {
    // Bildirimleri iptal et
    await cancelMedicationReminders(id);

    const all = await getMedications();
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(all.filter(m => m.id !== id)));

    // O ilaca ait dose log'ları da temizle
    const logs = await getAllDoseLogs();
    const remaining = logs.filter(l => l.medicationId !== id);
    await AsyncStorage.setItem(DOSE_LOGS_KEY, JSON.stringify(remaining));
  } catch (e) { console.error('deleteMedication error', e); }
};

export const toggleMedicationActive = async (id: string): Promise<void> => {
  try {
    const all = await getMedications();
    const med = all.find(m => m.id === id);
    if (!med) return;
    med.active = !med.active;
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(all));

    if (med.active) await scheduleMedicationReminders(med);
    else await cancelMedicationReminders(id);
  } catch (e) { console.error('toggleMedicationActive error', e); }
};

// ── Doz Logları ───────────────────────────────────────────────────────────────

export const getAllDoseLogs = async (): Promise<DoseLog[]> => {
  try {
    const raw = await AsyncStorage.getItem(DOSE_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const all = await getAllDoseLogs();
  return all.filter(l => l.date === date);
};

export const logDose = async (log: DoseLog): Promise<void> => {
  try {
    const all = await getAllDoseLogs();
    // Aynı ilaç + tarih + saat kombinasyonu varsa güncelle
    const idx = all.findIndex(
      l => l.medicationId === log.medicationId &&
           l.date === log.date &&
           l.hour === log.hour &&
           l.minute === log.minute
    );
    if (idx >= 0) all[idx] = log;
    else all.push(log);
    await AsyncStorage.setItem(DOSE_LOGS_KEY, JSON.stringify(all));
  } catch (e) { console.error('logDose error', e); }
};

export const removeDoseLog = async (
  medicationId: string, date: string, hour: number, minute: number
): Promise<void> => {
  try {
    const all = await getAllDoseLogs();
    const filtered = all.filter(
      l => !(l.medicationId === medicationId && l.date === date &&
             l.hour === hour && l.minute === minute)
    );
    await AsyncStorage.setItem(DOSE_LOGS_KEY, JSON.stringify(filtered));
  } catch (e) { console.error('removeDoseLog error', e); }
};
