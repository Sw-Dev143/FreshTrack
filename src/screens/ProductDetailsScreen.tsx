import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  SafeAreaView, Platform, ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { deleteProduct } from '../utils/storage';
import { COLORS, SIZES, SHADOWS } from '../theme';

type DetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>;

const CATEGORY_CONFIG = {
  'Şarküteri': { icon: 'restaurant' as const, color: COLORS.deli,     light: COLORS.deliLight },
  'Eczane':    { icon: 'medkit'    as const,  color: COLORS.pharmacy, light: COLORS.pharmacyLight },
  'Diğer':     { icon: 'cube'      as const,  color: COLORS.other,    light: COLORS.otherLight },
};

const ProductDetailsScreen: React.FC = () => {
  const route      = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { product } = route.params;

  const handleDelete = () => {
    Alert.alert(
      'Ürünü Sil',
      'Bu ürünü takip listenizden silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: async () => {
          await deleteProduct(product.id);
          navigation.goBack();
        }},
      ]
    );
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((new Date(product.expirationDate).getTime() - today.getTime()) / 86400000);

  const statusColor =
    daysLeft < 0  ? COLORS.danger  :
    daysLeft <= 3 ? COLORS.warning : COLORS.safe;
  const statusLight =
    daysLeft < 0  ? COLORS.dangerLight  :
    daysLeft <= 3 ? COLORS.warningLight : COLORS.safeLight;
  const statusText =
    daysLeft < 0   ? `Süresi ${Math.abs(daysLeft)} gün önce geçti` :
    daysLeft === 0 ? 'Bugün son kullanma tarihi!' :
    daysLeft === 1 ? 'Yarın son kullanma tarihi!' :
                     `${daysLeft} gün kaldı`;
  const statusIcon =
    daysLeft < 0   ? 'alert-circle'    as const :
    daysLeft <= 3  ? 'warning'         as const :
                     'checkmark-circle' as const;

  const catConfig = CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG['Diğer'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero Kart ── */}
        <View style={styles.heroCard}>
          {/* Kategori ikonu */}
          <View style={[styles.iconCircle, { backgroundColor: catConfig.light }]}>
            <Ionicons name={catConfig.icon} size={42} color={catConfig.color} />
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          {/* Kategori badge */}
          <View style={[styles.categoryBadge, { backgroundColor: catConfig.light }]}>
            <Text style={[styles.categoryBadgeText, { color: catConfig.color }]}>
              {product.category}
            </Text>
          </View>

          {/* Büyük durum göstergesi */}
          <View style={[styles.bigStatus, { backgroundColor: statusLight }]}>
            <Ionicons name={statusIcon} size={28} color={statusColor} />
            <Text style={[styles.bigStatusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {/* ── Bilgi Kartları ── */}
        <View style={styles.infoGrid}>
          <InfoCard
            icon="calendar"
            label="Son Kullanma"
            value={new Date(product.expirationDate).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
            color={COLORS.primary}
          />
          <InfoCard
            icon="time"
            label="Kalan Gün"
            value={daysLeft < 0 ? `−${Math.abs(daysLeft)}` : `${daysLeft}`}
            color={statusColor}
          />
          <InfoCard
            icon="calendar-outline"
            label="Eklenme Tarihi"
            value={new Date(product.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
            color={COLORS.textLight}
          />
          {product.barcode && (
            <InfoCard
              icon="barcode"
              label="Barkod"
              value={product.barcode}
              color={COLORS.textLight}
            />
          )}
        </View>

        {/* ── Sil Butonu ── */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>Ürünü Sil</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Mini info card bileşeni ───────────────────────────────────────────────────
interface InfoCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; color: string;
}
const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, color }) => (
  <View style={infoCardStyles.card}>
    <View style={[infoCardStyles.iconWrap, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={infoCardStyles.label}>{label}</Text>
    <Text style={infoCardStyles.value} numberOfLines={2}>{value}</Text>
  </View>
);
const infoCardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    gap: 6,
    flex: 1,
    minWidth: '45%',
    ...SHADOWS.sm,
  },
  iconWrap: { width: 36, height: 36, borderRadius: SIZES.radius_sm, justifyContent: 'center', alignItems: 'center' },
  label:    { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  value:    { fontSize: 15, color: COLORS.text, fontWeight: '800' },
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SIZES.md, gap: SIZES.md, paddingBottom: 40 },

  // Hero
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius_lg,
    padding: SIZES.xl,
    alignItems: 'center',
    gap: SIZES.md,
    ...SHADOWS.lg,
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
  },
  productName: {
    fontSize: 26, fontWeight: '900', color: COLORS.text,
    textAlign: 'center', letterSpacing: -0.5,
  },
  categoryBadge: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeText: { fontWeight: '700', fontSize: 14 },
  bigStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: SIZES.radius, width: '100%',
    justifyContent: 'center',
  },
  bigStatusText: { fontWeight: '800', fontSize: 16 },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },

  // Delete
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 18, borderRadius: SIZES.radius + 4,
    gap: 10, borderWidth: 1, borderColor: COLORS.danger + '30',
    marginTop: SIZES.sm,
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 16, fontWeight: '800' },
});

export default ProductDetailsScreen;
