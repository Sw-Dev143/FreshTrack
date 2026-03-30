import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const CATEGORY_CONFIG = {
  'Şarküteri': { icon: 'restaurant'  as const, emoji: '🥩', color: COLORS.deli,     light: COLORS.deliLight },
  'Eczane':    { icon: 'medkit'      as const, emoji: '💊', color: COLORS.pharmacy, light: COLORS.pharmacyLight },
  'Diğer':     { icon: 'cube'        as const, emoji: '📦', color: COLORS.other,    light: COLORS.otherLight },
};

const MAX_DAYS = 30;

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { colors } = useTheme();
  const pressAnim = useRef(new Animated.Value(1)).current;

  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((new Date(product.expirationDate).getTime() - today.getTime()) / 86400000);

  const isExpired  = daysLeft < 0;
  const isCritical = daysLeft >= 0 && daysLeft <= 1;
  const isWarning  = daysLeft >= 2 && daysLeft <= 7;

  const statusColor =
    isExpired  ? COLORS.danger  :
    isCritical ? COLORS.danger  :
    isWarning  ? COLORS.warning : COLORS.safe;

  const statusLight =
    isExpired  ? COLORS.dangerLight  :
    isCritical ? COLORS.dangerLight  :
    isWarning  ? COLORS.warningLight : COLORS.safeLight;

  const statusText =
    isExpired          ? `${Math.abs(daysLeft)} gün geçti` :
    daysLeft === 0     ? 'Bugün son!' :
    daysLeft === 1     ? 'Yarın son!' :
    daysLeft <= 7      ? `${daysLeft} gün kaldı` :
                         `${daysLeft} gün kaldı`;

  const statusIcon =
    isExpired  ? 'alert-circle'   as const :
    isCritical ? 'warning'        as const :
    isWarning  ? 'time-outline'   as const :
                 'checkmark-circle' as const;

  const progress = isExpired ? 0 : Math.min(daysLeft / MAX_DAYS, 1);
  const catConfig = CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG['Diğer'];

  const handlePressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const handlePressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.card, 
          { backgroundColor: colors.surface },
          isExpired && { backgroundColor: COLORS.danger + '08' }
        ]}
        onPress={onPress}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.body}>
          {/* ── Üst satır ── */}
          <View style={styles.topRow}>
            <View style={[styles.categoryIconWrap, { backgroundColor: catConfig.light }]}>
              <Text style={styles.categoryEmoji}>{catConfig.emoji}</Text>
            </View>

            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
              {product.name}
            </Text>

            <View style={[styles.statusBadge, { backgroundColor: statusLight }]}>
              <Ionicons name={statusIcon} size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>

          {/* ── Progress bar ── */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%` as any,
                  backgroundColor: statusColor,
                  opacity: isExpired ? 0.4 : 0.85,
                },
              ]}
            />
          </View>

          {/* ── Alt satır ── */}
          <View style={styles.bottomRow}>
            <View style={[styles.categoryPill, { backgroundColor: colors.border + '60' }]}>
              <Ionicons name={catConfig.icon} size={11} color={catConfig.color} />
              <Text style={[styles.categoryText, { color: catConfig.color }]}>{product.category}</Text>
            </View>

            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {new Date(product.expirationDate).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </Text>

            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: SIZES.sm + 4,
    borderRadius: SIZES.radius + 2,
    ...SHADOWS.md,
  },
  card: {
    borderRadius: SIZES.radius + 2,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  body: {
    flex: 1,
    paddingHorizontal: SIZES.md,
    paddingVertical: 14,
    gap: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIconWrap: {
    width: 38, height: 38, borderRadius: SIZES.radius_sm + 2,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  categoryEmoji: { fontSize: 20 },
  productName: {
    flex: 1, fontSize: 15, fontWeight: '800', letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, flexShrink: 0,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  bottomRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryPill:  {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  categoryText: { fontSize: 11, fontWeight: '700' },
  dateText: {
    flex: 1, fontSize: 12, fontWeight: '600', textAlign: 'right',
  },
});

export default ProductCard;
