import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert, Platform,  } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Medication, DoseLog, RootStackParamList } from '../types';
import { getMedications, deleteMedication, toggleMedicationActive, getDoseLogsForDate, logDose, removeDoseLog } from '../utils/medicationStorage';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Medications'>;

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

const todayStr = () => new Date().toISOString().split('T')[0];
const padZ = (n: number) => String(n).padStart(2, '0');

// ─────────────────────────────────────────────────────────────────────────────

const MedicationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs]       = useState<DoseLog[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('MedicationStats')}
          style={{ marginRight: 4, padding: 6 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="bar-chart-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const load = useCallback(async () => {
    const [meds, logs] = await Promise.all([
      getMedications(),
      getDoseLogsForDate(todayStr()),
    ]);
    setMedications(meds);
    setDoseLogs(logs);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Bugünün dozlarını hesapla (aktif ilaçlar için)
  const todayDoses = buildTodayDoses(medications, doseLogs);

  const handleToggle = async (id: string) => {
    await toggleMedicationActive(id);
    load();
  };

  const handleDelete = (med: Medication) => {
    Alert.alert(
      'İlacı Sil',
      `"${med.name}" ilacını ve tüm bildirimlerini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => { await deleteMedication(med.id); load(); },
        },
      ]
    );
  };

  const handleDoseTaken = async (dose: TodayDose) => {
    if (dose.taken) {
      // Geri al
      await removeDoseLog(dose.medicationId, todayStr(), dose.hour, dose.minute);
    } else {
      await logDose({
        medicationId: dose.medicationId,
        date:   todayStr(),
        hour:   dose.hour,
        minute: dose.minute,
        takenAt: new Date().toISOString(),
      });
    }
    load();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={medications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Bugünün ilerlemesi */}
            {todayDoses.length > 0 && (
              <View style={styles.section}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.secondary, marginBottom: 0 }]}>Bugünkü Dozlar</Text>
                  <Text style={[styles.progressText, { color: colors.textLight }]}>
                    {todayDoses.filter(d => d.taken).length}/{todayDoses.length} Tamamlandı
                  </Text>
                </View>
                <View style={[styles.mainProgressTrack, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.mainProgressFill, 
                      { 
                        width: `${Math.round((todayDoses.filter(d => d.taken).length / todayDoses.length) * 100)}%`,
                        backgroundColor: COLORS.primary 
                      }
                    ]} 
                  />
                </View>
                {todayDoses.map((dose, i) => (
                  <DoseRow key={i} dose={dose} onPress={() => handleDoseTaken(dose)} />
                ))}
              </View>
            )}

            {medications.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Tüm İlaçlar</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconRing, { backgroundColor: COLORS.primary + '12' }]}>
              <View style={[styles.emptyIconInner, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="medkit-outline" size={44} color={COLORS.primary} />
              </View>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.secondary }]}>Henüz ilaç eklemediniz</Text>
            <Text style={[styles.emptySubText, { color: colors.textLight }]}>Sağ alttaki + butonuna dokunarak ilaç ekleyebilirsiniz.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MedicationCard
            med={item}
            colors={colors}
            onEdit={() => navigation.navigate('AddMedication', { medicationToEdit: item })}
            onDelete={() => handleDelete(item)}
            onToggle={() => handleToggle(item.id)}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedication', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ── Bugünün dozları helper ────────────────────────────────────────────────────
interface TodayDose {
  medicationId: string;
  medName: string;
  medColor: string;
  dosage: string;
  hour: number;
  minute: number;
  taken: boolean;
  takenAt: string | null;
}

function buildTodayDoses(medications: Medication[], logs: DoseLog[]): TodayDose[] {
  const today   = new Date();
  const todayDow = today.getDay() as 0|1|2|3|4|5|6; // 0=Pazar

  const doses: TodayDose[] = [];

  for (const med of medications) {
    if (!med.active) continue;
    const activeDays = med.days.length === 0 ? [0,1,2,3,4,5,6] : med.days;
    if (!activeDays.includes(todayDow)) continue;

    for (const t of med.times) {
      const log = logs.find(
        l => l.medicationId === med.id && l.hour === t.hour && l.minute === t.minute
      );
      doses.push({
        medicationId: med.id,
        medName:  med.name,
        medColor: med.color,
        dosage:   med.dosage,
        hour:     t.hour,
        minute:   t.minute,
        taken:    !!log?.takenAt,
        takenAt:  log?.takenAt ?? null,
      });
    }
  }
  // Saate göre sırala
  return doses.sort((a, b) => a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute);
}

// ── Doz Satırı ───────────────────────────────────────────────────────────────
const DoseRow: React.FC<{ dose: TodayDose; onPress: () => void }> = ({ dose, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      style={[
        styles.doseRow, 
        { backgroundColor: colors.surface }, 
        dose.taken && { backgroundColor: COLORS.safe + '10', borderColor: COLORS.safe, borderWidth: 1 }
      ]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={[styles.doseColorDot, { backgroundColor: dose.medColor }]} />
      <View style={styles.doseInfo}>
        <Text style={[
          styles.doseName, 
          { color: colors.text }, 
          dose.taken && { color: colors.textMuted, textDecorationLine: 'line-through' }
        ]}>
          {dose.medName}
        </Text>
        {!!dose.dosage && <Text style={[styles.doseDosage, { color: colors.textMuted }]}>{dose.dosage}</Text>}
      </View>
      <Text style={[styles.doseTime, { color: colors.textLight }]}>{padZ(dose.hour)}:{padZ(dose.minute)}</Text>
      <View style={[
        styles.doseCheck, 
        { borderColor: colors.border }, 
        dose.taken && { backgroundColor: COLORS.safe, borderColor: COLORS.safe }
      ]}>
        <Ionicons name={dose.taken ? 'checkmark' : 'ellipse-outline'} size={20} color={dose.taken ? '#fff' : colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

// ── İlaç Kartı ───────────────────────────────────────────────────────────────
interface MedCardProps {
  med: Medication;
  colors: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}
const MedicationCard: React.FC<MedCardProps> = ({ med, colors, onEdit, onDelete, onToggle }) => {
  const activeDayLabels = med.days.length === 0
    ? 'Her gün'
    : med.days.map(d => DAY_LABELS[d]).join(', ');

  return (
    <View style={[styles.medCard, { backgroundColor: colors.surface }, !med.active && styles.medCardInactive]}>
      {/* Sol renk şeridi */}
      <View style={[styles.medStrip, { backgroundColor: med.active ? med.color : colors.border }]} />

      <View style={styles.medBody}>
        <View style={styles.medTop}>
          {/* Renk nokta + isim */}
          <View style={[styles.medIconCircle, { backgroundColor: med.color + '22' }]}>
            <Ionicons name="medkit" size={20} color={med.color} />
          </View>
          <View style={styles.medNameWrap}>
            <Text style={[styles.medName, { color: colors.text }, !med.active && [styles.medNameInactive, { color: colors.textMuted }]]} numberOfLines={1}>
              {med.name}
            </Text>
            {!!med.dosage && <Text style={[styles.medDosage, { color: colors.textLight }]}>{med.dosage}</Text>}
          </View>
          <Switch
            value={med.active}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: med.color + '80' }}
            thumbColor={med.active ? med.color : '#ccc'}
          />
        </View>

        {/* Günler + saatler */}
        <View style={styles.medMeta}>
          <View style={[styles.metaChip, { backgroundColor: colors.border + '60' }]}>
            <Ionicons name="calendar-outline" size={12} color={colors.textLight} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>{activeDayLabels}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: colors.border + '60' }]}>
            <Ionicons name="time-outline" size={12} color={colors.textLight} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>
              {med.times.map(t => `${padZ(t.hour)}:${padZ(t.minute)}`).join(' · ')}
            </Text>
          </View>
        </View>

        {med.notes ? <Text style={[styles.medNotes, { color: colors.textMuted }]} numberOfLines={2}>{med.notes}</Text> : null}

        {/* Aksiyon satırı */}
        <View style={styles.medActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.actionText, { color: COLORS.primary }]}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.actionText, { color: COLORS.danger }]}>Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:      { flex: 1 },
  listContainer: { padding: SIZES.md, paddingBottom: 120 },

  section:      { marginBottom: SIZES.lg },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: SIZES.sm },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressText:   { fontSize: 12, fontWeight: '700' },
  mainProgressTrack: { height: 6, borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  mainProgressFill:  { height: '100%', borderRadius: 3 },

  // Doz satırı
  doseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: SIZES.radius, padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  doseRowTaken: { opacity: 0.65 },
  doseColorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  doseInfo:     { flex: 1 },
  doseName:     { fontSize: 14, fontWeight: '700' },
  doseTextTaken:{ textDecorationLine: 'line-through' },
  doseDosage:   { fontSize: 12, fontWeight: '500', marginTop: 1 },
  doseTime:     { fontSize: 14, fontWeight: '800' },
  doseCheck: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },

  // İlaç kartı
  medCard: {
    borderRadius: SIZES.radius + 2,
    flexDirection: 'row', marginBottom: SIZES.sm + 4, overflow: 'hidden',
    ...SHADOWS.md,
  },
  medCardInactive: { opacity: 0.7 },
  medStrip:        { width: 4 },
  medBody:         { flex: 1, padding: SIZES.md, gap: SIZES.sm },
  medTop:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medIconCircle:   { width: 38, height: 38, borderRadius: SIZES.radius_sm + 2, justifyContent: 'center', alignItems: 'center' },
  medNameWrap:     { flex: 1 },
  medName:         { fontSize: 15, fontWeight: '800' },
  medNameInactive: { },
  medDosage:       { fontSize: 12, fontWeight: '500', marginTop: 1 },

  medMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  metaText: { fontSize: 11, fontWeight: '600' },

  medNotes:   { fontSize: 12, fontStyle: 'italic' },
  medActions: { flexDirection: 'row', gap: SIZES.md, paddingTop: SIZES.xs },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '700' },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 80, paddingHorizontal: SIZES.xl },
  emptyIconRing:  { width: 108, height: 108, borderRadius: 54, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.lg },
  emptyIconInner: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  emptyTitle:     { fontSize: 20, fontWeight: '800', marginBottom: SIZES.sm, textAlign: 'center' },
  emptySubText:   { fontSize: 15, textAlign: 'center', fontWeight: '500', lineHeight: 22 },

  // FAB
  fab: {
    position: 'absolute', bottom: SIZES.xl, right: SIZES.lg,
    backgroundColor: COLORS.primary, width: 62, height: 62, borderRadius: 31,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.primary,
  },
});

export default MedicationsScreen;
