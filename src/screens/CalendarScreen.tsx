import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,  } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SIZES } from '../theme';
import { getProducts } from '../utils/storage';
import { Product } from '../types';
import { formatDate } from '../utils/date';
import { useLanguage } from '../context/LanguageContext';

// Her gün için renk kategorisi
type DayStatus = 'expired' | 'warning' | 'safe';

interface DayInfo {
  date: string;      // YYYY-MM-DD
  products: Product[];
  status: DayStatus;
}

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function buildCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(year, month, d);
    cells.push(toDateStr(dt));
  }
  return cells;
}

const CalendarScreen: React.FC = () => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = new Date();
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [displayYear, setDisplayYear] = useState(today.getFullYear());

  const load = async () => {
    setAllProducts(await getProducts());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  // Tarih → ürün eşlemesi
  const dateMap = useMemo<Record<string, DayInfo>>(() => {
    const map: Record<string, DayInfo> = {};
    const todayStr = toDateStr(today);
    for (const p of allProducts) {
      const expDate = p.expirationDate;
      const daysLeft = Math.ceil(
        (new Date(expDate).setHours(0,0,0,0) - new Date(todayStr).setHours(0,0,0,0)) / 86400000
      );
      const status: DayStatus = daysLeft < 0 ? 'expired' : daysLeft <= 3 ? 'warning' : 'safe';
      if (!map[expDate]) {
        map[expDate] = { date: expDate, products: [], status };
      } else {
        // Kötü durum kazanır
        if (status === 'expired') map[expDate].status = 'expired';
        else if (status === 'warning' && map[expDate].status === 'safe') map[expDate].status = 'warning';
      }
      map[expDate].products.push(p);
    }
    return map;
  }, [allProducts]);

  const calDays = buildCalendarDays(displayYear, displayMonth);
  const todayStr = toDateStr(today);

  const prevMonth = () => {
    if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(y => y - 1); }
    else setDisplayMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(y => y + 1); }
    else setDisplayMonth(m => m + 1);
  };

  const selectedProducts = selectedDate ? (dateMap[selectedDate]?.products ?? []) : [];

  const statusColor = (s?: DayStatus) => {
    if (!s) return 'transparent';
    if (s === 'expired') return COLORS.danger;
    if (s === 'warning') return COLORS.warning;
    return COLORS.safe;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Month navigation */}
        <View style={[styles.monthNav, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.secondary }]}>
            {MONTHS_TR[displayMonth]} {displayYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Days header */}
        <View style={styles.daysHeader}>
          {DAYS_TR.map(d => (
            <Text key={d} style={[styles.dayHeaderText, { color: colors.textLight }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {calDays.map((dateStr, idx) => {
            if (!dateStr) return <View key={`empty-${idx}`} style={styles.cell} />;
            const info = dateMap[dateStr];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dotColor = statusColor(info?.status);
            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.cell,
                  isToday && [styles.todayCell, { borderColor: COLORS.primary }],
                  isSelected && { backgroundColor: COLORS.primary + '20' },
                ]}
                onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayNum,
                  { color: colors.text },
                  isToday && { color: COLORS.primary, fontWeight: '900' },
                ]}>
                  {new Date(dateStr + 'T00:00:00').getDate()}
                </Text>
                {info && (
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Renk açıklaması */}
        <View style={styles.legend}>
          <LegendItem color={COLORS.safe}    label="Güvende" />
          <LegendItem color={COLORS.warning} label="Yaklaşan (≤3 gün)" />
          <LegendItem color={COLORS.danger}  label="Süresi geçmiş" />
        </View>

        {/* Seçili gün ürünleri */}
        {selectedDate && (
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.detailTitle, { color: colors.secondary }]}>
              {formatDate(selectedDate + 'T00:00:00', {
                day: 'numeric', month: 'long', year: 'numeric',
              }, currentLanguage)}
            </Text>
            {selectedProducts.length === 0 ? (
              <Text style={[styles.noProductText, { color: colors.textLight }]}>Bu tarihe ait ürün yok.</Text>
            ) : (
              selectedProducts.map(p => {
                const info = dateMap[p.expirationDate];
                return (
                  <View key={p.id} style={[styles.productRow, { borderColor: colors.border }]}>
                    <View style={[styles.productDot, { backgroundColor: statusColor(info?.status) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: colors.text }]}>{p.name}</Text>
                      <Text style={[styles.productCat, { color: colors.textLight }]}>{p.category}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: colors.textLight }]}>{label}</Text>
    </View>
  );
};

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  safeArea:   { flex: 1 },
  container:  { padding: SIZES.md, gap: 12 },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: SIZES.radius, padding: SIZES.sm,
  },
  navBtn:     { padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: '900' },

  daysHeader: { flexDirection: 'row', justifyContent: 'space-around' },
  dayHeaderText: { width: CELL_SIZE, textAlign: 'center', fontSize: 12, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  todayCell: { borderWidth: 2, borderRadius: 10 },
  dayNum:    { fontSize: 14, fontWeight: '600' },
  dot:       { width: 5, height: 5, borderRadius: 3, marginTop: 2 },

  legend:     { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600' },

  detailCard: {
    borderRadius: SIZES.radius, borderWidth: 1,
    padding: SIZES.md, gap: 10,
  },
  detailTitle:   { fontSize: 16, fontWeight: '900' },
  noProductText: { fontSize: 14, fontWeight: '500' },
  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1,
  },
  productDot:  { width: 10, height: 10, borderRadius: 5 },
  productName: { fontSize: 15, fontWeight: '700' },
  productCat:  { fontSize: 12, fontWeight: '500' },
});

export default CalendarScreen;
