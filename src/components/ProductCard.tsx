import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { COLORS, SIZES, SHADOWS } from '../theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const CATEGORY_CONFIG = {
  'Şarküteri': { icon: 'restaurant' as const,  color: COLORS.deli,     light: COLORS.deliLight },
  'Eczane':    { icon: 'medkit'    as const,  color: COLORS.pharmacy, light: COLORS.pharmacyLight },
  'Diğer':     { icon: 'cube'      as const,  color: COLORS.other,    light: COLORS.otherLight },
};

const MAX_DAYS = 30; // progress bar maksimum referans (30 gün = tam dolu)

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const calculateDaysLeft = (expirationDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft(product.expirationDate);

  // Status
  const statusColor =
    daysLeft < 0  ? COLORS.danger  :
    daysLeft <= 3 ? COLORS.warning : COLORS.safe;
  const statusLight =
    daysLeft < 0  ? COLORS.dangerLight  :
    daysLeft <= 3 ? COLORS.warningLight : COLORS.safeLight;
  const statusText =
    daysLeft < 0   ? `${Math.abs(daysLeft)} gün geçti` :
    daysLeft === 0 ? 'Bugün son!' :
    daysLeft === 1 ? 'Yarın son!' :
                     `${daysLeft} gün kaldı`;
  const statusIcon =
    daysLeft < 0   ? 'alert-circle'   as const :
    daysLeft <= 3  ? 'warning'        as const :
                     'checkmark-circle' as const;

  // Progress bar (0-1), negatif 0 olarak göster
  const progress = daysLeft <= 0 ? 0 : Math.min(daysLeft / MAX_DAYS, 1);

  const catConfig = CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG['Diğer'];

  // Press scale animation
  const handlePressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const handlePressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Sol renk şeridi */}
        <View style={[styles.strip, { backgroundColor: catConfig.color }]} />

        <View style={styles.body}>
          {/* Üst satır: isim + kategori ikonu */}
          <View style={styles.topRow}>
            <View style={[styles.categoryIconWrap, { backgroundColor: catConfig.light }]}>
              <Ionicons name={catConfig.icon} size={18} color={catConfig.color} />
            </View>
            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` as any, backgroundColor: statusColor },
              ]}
            />
          </View>

          {/* Alt satır: kategori adı + durum badge */}
          <View style={styles.bottomRow}>
            <Text style={styles.categoryText}>{product.category}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusLight }]}>
              <Ionicons name={statusIcon} size={13} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: SIZES.sm + 4,
    borderRadius: SIZES.radius,
    ...SHADOWS.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  strip: {
    width: 5,
  },
  body: {
    flex: 1,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md - 2,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: SIZES.radius_sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ProductCard;
