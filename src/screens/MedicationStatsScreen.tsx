import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity,  } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Medication, DoseLog } from '../types';
import { getMedications, getAllDoseLogs, getDoseLogsForDate } from '../utils/medicationStorage';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const padZ = (n: number) => String(n).padStart(2, '0');

// Son N günün tarih string'ini üretir (bugün dahil)
function lastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

interface DayStats {
  date: string;
  label: string;
  total: number;
  taken: number;
}

// ─────────────────────────────────────────────────────────────────────────────

const MedicationStatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dayStats, setDayStats]       = useState<DayStats[]>([]);
  const [selectedMed, setSelectedMed] = useState<string | null>(null); // null = tümü

  const load = useCallback(async () => {
    const meds  = await getMedications();
    setMedications(meds);
    const dates = lastNDays(14); // son 14 gün
    const allLogs = await getAllDoseLogs();

    const stats: DayStats[] = dates.map(date => {
      const logs = allLogs.filter(l => l.date === date);
      const d    = new Date(date + 'T00:00:00');
      const dow  = d.getDay() as 0|1|2|3|4|5|6;

      let total = 0, taken = 0;
      for (const med of meds) {
        if (!med.active) continue;
        if (selectedMed && med.id !== selectedMed) continue;
        const activeDays = med.days.length === 0 ? [0,1,2,3,4,5,6] : med.days;
        if (!activeDays.includes(dow)) continue;
        total += med.times.length;
        taken += logs.filter(l => l.medicationId === med.id && !!l.takenAt).length;
      }
      return {
        date,
        label: t(`days.${dow}`),
        total,
        taken,
      };
    });
    setDayStats(stats);
  }, [selectedMed]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalDoses  = dayStats.reduce((s, d) => s + d.total, 0);
  const takenDoses  = dayStats.reduce((s, d) => s + d.taken, 0);
  const adherence   = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const maxTotal = Math.max(...dayStats.map(d => d.total), 1);

  const adherenceColor =
    adherence >= 80 ? COLORS.safe :
    adherence >= 50 ? COLORS.warning : COLORS.danger;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Genel Uyum Kartı ── */}
        <View style={[styles.adherenceCard, { backgroundColor: colors.surface }]}>
          <View style={styles.adherenceLeft}>
            <Text style={[styles.adherenceTitle, { color: colors.secondary }]}>{t('medication.stats.overallAdherence')}</Text>
            <Text style={[styles.adherenceSub, { color: colors.textLight }]}>{t('medication.stats.lastDays', { count: 14 })} • {takenDoses}/{totalDoses} {t('medication.stats.doses')}</Text>
          </View>
          <View style={[styles.adherenceCircle, { borderColor: adherenceColor }]}>
            <Text style={[styles.adherencePct, { color: adherenceColor }]}>{adherence}%</Text>
          </View>
        </View>

        {/* ── İlaç Filtresi ── */}
        {medications.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, !selectedMed && styles.filterChipActive]}
              onPress={() => setSelectedMed(null)}
            >
              <Text style={[styles.filterChipText, { color: colors.textLight }, !selectedMed && styles.filterChipTextActive]}>
                {t('home.filter.all')}
              </Text>
            </TouchableOpacity>
            {medications.map(med => (
              <TouchableOpacity
                key={med.id}
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, selectedMed === med.id && { backgroundColor: med.color, borderColor: med.color }]}
                onPress={() => setSelectedMed(prev => prev === med.id ? null : med.id)}
              >
                <View style={[styles.filterDot, { backgroundColor: med.color }]} />
                <Text style={[styles.filterChipText, { color: colors.textLight }, selectedMed === med.id && styles.filterChipTextActive]}>
                  {med.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── 14 Gün Bar Chart ── */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.secondary }]}>📅 {t('medication.stats.lastDays', { count: 14 })}</Text>
          <View style={styles.barsRow}>
            {dayStats.map((day, i) => {
              const fillRatio = day.total > 0 ? day.taken / day.total : 0;
              const barH      = Math.max((day.total / maxTotal) * 100, 4);
              const fillH     = fillRatio * barH;
              const isToday   = i === dayStats.length - 1;
              const barColor  = fillRatio >= 0.8 ? COLORS.safe : fillRatio >= 0.5 ? COLORS.warning : COLORS.danger;

              return (
                <View key={day.date} style={styles.barWrapper}>
                  <Text style={[styles.barCount, { color: colors.textMuted }]}>
                    {day.total > 0 ? `${day.taken}/${day.total}` : ''}
                  </Text>
                  <View style={[styles.barTrack, { height: 100 }]}>
                    {day.total === 0 ? (
                      <View style={[styles.barEmpty, { backgroundColor: colors.border + '40' }]} />
                    ) : (
                      <>
                        <View style={[styles.barFill, {
                          height: fillH, backgroundColor: barColor,
                          opacity: isToday ? 1 : 0.75,
                        }]} />
                        <View style={[styles.barBg, { height: barH - fillH, backgroundColor: colors.border }]} />
                      </>
                    )}
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textLight }, isToday && { color: COLORS.primary, fontWeight: '800' }]}>
                    {day.label}
                  </Text>
                  {isToday && <View style={styles.todayDot} />}
                </View>
              );
            })}
          </View>
          {/* Renk rehberi */}
          <View style={styles.legend}>
            <LegendDot color={COLORS.safe}    label="≥80%" />
            <LegendDot color={COLORS.warning} label="50–79%" />
            <LegendDot color={COLORS.danger}  label="<50%" />
          </View>
        </View>

        {/* ── İlaç Bazlı Özet ── */}
        {medications.length > 0 && (
          <View style={[styles.perMedCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.chartTitle, { color: colors.secondary }]}>💊 {t('medication.stats.medBased')}</Text>
            {medications.filter(m => m.active).map(med => (
              <MedRow key={med.id} med={med} dayStats={dayStats} colors={colors} />
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// ── İlaç satır bileşeni ───────────────────────────────────────────────────────
function MedRow({ med, dayStats, colors }: { med: Medication; dayStats: DayStats[]; colors: any }) {
  const [stats, setStats] = React.useState<{ total: number; taken: number }>({ total: 0, taken: 0 });

  React.useEffect(() => {
    let active = true;
    (async () => {
      let total = 0, taken = 0;
      const allLogs = await getAllDoseLogs();
      for (const day of dayStats) {
        const d    = new Date(day.date + 'T00:00:00');
        const dow  = d.getDay();
        const activeDays: number[] = med.days.length === 0 ? [0,1,2,3,4,5,6] : med.days;
        if (!activeDays.includes(dow)) continue;
        
        total += med.times.length;
        const logs = allLogs.filter(l => l.date === day.date);
        taken += logs.filter(l => l.medicationId === med.id && !!l.takenAt).length;
      }
      if (active) setStats({ total, taken });
    })();
    return () => { active = false; };
  }, [med, dayStats]);

  const pct = stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0;
  const pctColor = pct >= 80 ? COLORS.safe : pct >= 50 ? COLORS.warning : COLORS.danger;

  return (
    <View style={medRowStyles.row}>
      <View style={[medRowStyles.dot, { backgroundColor: med.color }]} />
      <View style={medRowStyles.info}>
        <Text style={[medRowStyles.name, { color: colors.text }]} numberOfLines={1}>{med.name}</Text>
        <View style={[medRowStyles.barTrack, { backgroundColor: colors.border }]}>
          <View style={[medRowStyles.barFill, { width: `${pct}%` as any, backgroundColor: pctColor }]} />
        </View>
      </View>
      <Text style={[medRowStyles.pct, { color: pctColor }]}>{pct}%</Text>
    </View>
  );
}

const medRowStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SIZES.md },
  dot:      { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  info:     { flex: 1, gap: 4 },
  name:     { fontSize: 13, fontWeight: '700' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3 },
  pct:      { fontSize: 13, fontWeight: '800', minWidth: 38, textAlign: 'right' },
});

// ── Legend ─────────────────────────────────────────────────────────────────
const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View style={legendStyles.item}>
    <View style={[legendStyles.dot, { backgroundColor: color }]} />
    <Text style={legendStyles.text}>{label}</Text>
  </View>
);
const legendStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:  { width: 10, height: 10, borderRadius: 5 },
  text: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:  { flex: 1 },
  container: { padding: SIZES.md, gap: SIZES.md, paddingBottom: 40 },

  // Uyum kartı
  adherenceCard: {
    borderRadius: SIZES.radius_lg,
    padding: SIZES.lg, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.lg,
  },
  adherenceLeft:  { gap: 4 },
  adherenceTitle: { fontSize: 20, fontWeight: '900' },
  adherenceSub:   { fontSize: 13, fontWeight: '500' },
  adherenceCircle: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 5, justifyContent: 'center', alignItems: 'center',
  },
  adherencePct: { fontSize: 20, fontWeight: '900' },

  // Filtre
  filterScroll: { flexGrow: 0, marginBottom: SIZES.xs },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText:      { fontSize: 12, fontWeight: '700' },
  filterChipTextActive:{ color: '#fff' },
  filterDot:           { width: 8, height: 8, borderRadius: 4 },

  // Chart
  chartCard: {
    borderRadius: SIZES.radius_lg,
    padding: SIZES.lg, ...SHADOWS.md,
  },
  chartTitle: { fontSize: 15, fontWeight: '800', marginBottom: SIZES.md },
  barsRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 3 },
  barCount:   { fontSize: 8, fontWeight: '600', textAlign: 'center' },
  barTrack:   { width: '100%', justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 4 },
  barFill:    { width: '100%', borderRadius: 4 },
  barBg:      { width: '100%' },
  barEmpty:   { width: '100%', flex: 1, borderRadius: 4 },
  barLabel:   { fontSize: 10, fontWeight: '600' },
  todayDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },
  legend:     { flexDirection: 'row', gap: SIZES.md, marginTop: SIZES.md, justifyContent: 'center' },

  // Per-med
  perMedCard: {
    borderRadius: SIZES.radius_lg,
    padding: SIZES.lg, ...SHADOWS.md,
  },
});

export default MedicationStatsScreen;
