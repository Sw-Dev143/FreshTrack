import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert,  } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { DayOfWeek, DoseTime, Medication, RootStackParamList } from '../types';
import { saveMedication, getMedications } from '../utils/medicationStorage';
import { scheduleMedicationReminders, cancelMedicationReminders } from '../utils/notifications';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type NavigationProp  = NativeStackNavigationProp<RootStackParamList, 'AddMedication'>;
type RoutePropType   = RouteProp<RootStackParamList, 'AddMedication'>;

const ALL_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]; // Pzt'den başla

const PRESET_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

const padZ = (n: number) => String(n).padStart(2, '0');

// ─────────────────────────────────────────────────────────────────────────────

const AddMedicationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route      = useRoute<RoutePropType>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const existing   = route.params?.medicationToEdit;
  const isEditing  = !!existing;

  const [name, setName]     = useState(existing?.name ?? '');
  const [dosage, setDosage] = useState(existing?.dosage ?? '');
  const [notes, setNotes]   = useState(existing?.notes ?? '');
  const [color, setColor]   = useState(existing?.color ?? PRESET_COLORS[0]);

  // Days: empty = every day
  const [everyDay, setEveryDay] = useState(
    !existing || existing.days.length === 0
  );
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    existing?.days ?? []
  );

  // Dose times
  const [times, setTimes]               = useState<DoseTime[]>(
    existing?.times.length
      ? existing.times
      : [{ hour: 8, minute: 0 }]
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerIndex, setPickerIndex]     = useState<number | null>(null); // which dose is being edited
  const [pickerDate, setPickerDate]       = useState(new Date());

  const toggleDay = (d: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const addTime = () => {
    const now = new Date();
    const newTime = { hour: now.getHours(), minute: now.getMinutes() };
    const newIdx = times.length;
    
    setTimes(prev => [...prev, newTime]);
    
    // Automatically open picker for the new time
    setPickerDate(now);
    setPickerIndex(newIdx);
    setPickerVisible(true);
  };

  const removeTime = (idx: number) => {
    if (times.length === 1) return; // at least 1 hour must remain
    setTimes(prev => prev.filter((_, i) => i !== idx));
  };

  const openPicker = (idx: number) => {
    const d = new Date();
    d.setHours(times[idx].hour, times[idx].minute, 0, 0);
    setPickerDate(d);
    setPickerIndex(idx);
    setPickerVisible(true);
  };

  const onPickerChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setPickerVisible(false);
    if (!date || pickerIndex === null) return;
    const updated = [...times];
    updated[pickerIndex] = { hour: date.getHours(), minute: date.getMinutes() };
    setTimes(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('medication.validation.noName'), t('medication.validation.noNameSubtitle'));
      return;
    }
    if (times.length === 0) {
      Alert.alert(t('medication.validation.noTimes'), t('medication.validation.noTimesSubtitle'));
      return;
    }

    const med: Medication = {
      id:        isEditing ? existing!.id : Date.now().toString(),
      createdAt: isEditing ? existing!.createdAt : new Date().toISOString(),
      name:      name.trim(),
      dosage:    dosage.trim(),
      notes:     notes.trim() || undefined,
      color,
      days:      everyDay ? [] : selectedDays,
      times:     [...times].sort((a, b) => a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute),
      active:    isEditing ? existing!.active : true,
    };

    await saveMedication(med);
    // Update notifications
    await cancelMedicationReminders(med.id);
    if (med.active) await scheduleMedicationReminders(med);

    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>

          {/* İlaç Adı */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: colors.secondary }]}>{t('medication.nameLabel')}</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Ionicons name="medkit-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('medication.namePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                maxLength={80}
              />
            </View>
          </View>

          {/* Doz Bilgisi */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: colors.secondary }]}>{t('medication.dosageLabel')}</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Ionicons name="flask-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('medication.dosagePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={dosage}
                onChangeText={setDosage}
                maxLength={60}
              />
            </View>
          </View>

          {/* Renk Seçici */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: colors.secondary }]}>{t('medication.colorLabel')}</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                  onPress={() => setColor(c)}
                  activeOpacity={0.8}
                >
                  {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Gün Seçimi */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: colors.secondary }]}>{t('medication.daysLabel')}</Text>
            <TouchableOpacity
              style={[styles.everyDayBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }, everyDay && styles.everyDayBtnActive]}
              onPress={() => setEveryDay(e => !e)}
            >
              <Ionicons
                name={everyDay ? 'checkmark-circle' : 'ellipse-outline'}
                size={18} color={everyDay ? '#FFFFFF' : colors.textLight}
              />
              <Text style={[styles.everyDayText, { color: colors.textLight }, everyDay && styles.everyDayTextActive]}>{t('medication.everyDay')}</Text>
            </TouchableOpacity>

            {!everyDay && (
              <View style={styles.dayRow}>
                {ALL_DAYS.map(d => {
                  const active = selectedDays.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }, active && { backgroundColor: color, borderColor: color }]}
                      onPress={() => toggleDay(d)}
                    >
                      <Text style={[styles.dayBtnText, { color: colors.textLight }, active && styles.dayBtnTextActive]}>
                        {t(`days.${d}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Doz Saatleri */}
          <View style={styles.group}>
            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: colors.secondary }]}>{t('medication.timesLabel')}</Text>
              <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
                <Ionicons name="add-circle" size={22} color={color} />
                <Text style={[styles.addTimeText, { color }]}>{t('medication.addTime')}</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Time Options */}
            <View style={styles.quickTimeRow}>
              <QuickTimeButton 
                label={t('medication.quickTime.morning')} 
                time="08:00" 
                icon="sunny-outline"
                onPress={() => setTimes([{ hour: 8, minute: 0 }])} 
              />
              <QuickTimeButton 
                label={t('medication.quickTime.afternoon')} 
                time="13:00" 
                icon="partly-sunny-outline"
                onPress={() => setTimes(prev => [...prev.filter(t => t.hour !== 13), { hour: 13, minute: 0 }])} 
              />
              <QuickTimeButton 
                label={t('medication.quickTime.evening')} 
                time="20:00" 
                icon="moon-outline"
                onPress={() => setTimes(prev => [...prev.filter(t => t.hour !== 20), { hour: 20, minute: 0 }])} 
              />
            </View>

            {times.map((t, i) => (
              <View key={i} style={styles.timeRow}>
                <TouchableOpacity
                  style={[styles.timePill, { borderColor: color, backgroundColor: colors.surfaceAlt }]}
                  onPress={() => openPicker(i)}
                >
                  <Ionicons name="time-outline" size={16} color={color} />
                  <Text style={[styles.timeText, { color }]}>{padZ(t.hour)}:{padZ(t.minute)}</Text>
                </TouchableOpacity>
                {times.length > 1 && (
                  <TouchableOpacity onPress={() => removeTime(i)} style={styles.removeTimeBtn}>
                    <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: colors.secondary }]}>{t('medication.notesLabel')}</Text>
            <TextInput
              style={[styles.inputRow, styles.notesInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              placeholder={t('medication.notesPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        </View>

        {/* Kaydet */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: color }]}
          onPress={handleSave}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{isEditing ? t('medication.updateBtn') : t('medication.saveBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Time Picker (Android native, iOS inline) */}
      {pickerVisible && pickerIndex !== null && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
        />
      )}
    </SafeAreaView>
  );
};

// ── Helper Components ───────────────────────────────────────────────────────
const QuickTimeButton: React.FC<{ label: string; time: string; icon: any; onPress: () => void }> = ({ label, time, icon, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.quickTimeBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={14} color={colors.textLight} />
      <View>
        <Text style={[styles.quickTimeLabel, { color: colors.textLight }]}>{label}</Text>
        <Text style={[styles.quickTimeValue, { color: colors.secondary }]}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:  { flex: 1 },
  container: { padding: SIZES.md },

  card: {
    borderRadius: SIZES.radius + 4, padding: SIZES.lg,
    ...Platform.select({
      ios:     { shadowColor: '#1E293B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },

  group:    { marginBottom: SIZES.lg },
  label:    { fontSize: 14, fontWeight: '700', marginBottom: SIZES.sm - 2, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: SIZES.radius,
    borderWidth: 1, overflow: 'hidden',
  },
  inputIcon: { marginLeft: SIZES.md, marginRight: 6 },
  input:     { flex: 1, paddingVertical: 14, paddingRight: SIZES.md, fontSize: 15, fontWeight: '500' },

  notesInput: {
    padding: SIZES.md, minHeight: 80, textAlignVertical: 'top',
    fontSize: 14, fontWeight: '500',
  },

  // Renk
  colorRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot:         { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  colorDotSelected: { borderWidth: 2.5, borderColor: '#fff', ...SHADOWS.sm },

  // Günler
  everyDayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: SIZES.sm,
  },
  everyDayBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  everyDayText:      { fontSize: 14, fontWeight: '700' },
  everyDayTextActive:{ color: '#fff' },
  dayRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  dayBtnText:       { fontSize: 13, fontWeight: '700' },
  dayBtnTextActive: { color: '#fff' },

  // Saatler
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  addTimeBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addTimeText:  { fontSize: 13, fontWeight: '700' },
  timeRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SIZES.sm },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  timeText:      { fontSize: 15, fontWeight: '800' },
  removeTimeBtn: { padding: 2 },

  // Hızlı Saatler
  quickTimeRow: { flexDirection: 'row', gap: 8, marginBottom: SIZES.md },
  quickTimeBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 10, borderRadius: 12, borderWidth: 1,
  },
  quickTimeLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  quickTimeValue: { fontSize: 13, fontWeight: '800' },

  // Kaydet
  saveBtn: {
    flexDirection: 'row', paddingVertical: 16, borderRadius: SIZES.radius,
    alignItems: 'center', justifyContent: 'center', marginTop: SIZES.md, gap: 8,
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});

export default AddMedicationScreen;
