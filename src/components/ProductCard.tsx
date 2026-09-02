import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../utils/date';

import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const MAX_DAYS = 30;

const CATEGORY_CONFIG: Record<string, { icon: 'restaurant' | 'medkit' | 'cube'; emoji: string; color: string; light: string }> = {
  'deli':     { icon: 'restaurant' as const, emoji: '🥩', color: COLORS.deli,     light: '#FFF4E6' },
  'pharmacy': { icon: 'medkit'     as const, emoji: '💊', color: COLORS.pharmacy, light: '#E6F4EA' },
  'other':    { icon: 'cube'       as const, emoji: '📦', color: COLORS.other,    light: '#F5F3FF' },
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
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
    isExpired          ? t('product.status.expired', { count: Math.abs(daysLeft) }) :
    daysLeft === 0     ? t('product.status.today') :
    daysLeft === 1     ? t('product.status.tomorrow') :
                         t('product.status.daysLeft', { count: daysLeft });

  const statusIcon =
    isExpired  ? 'alert-circle'   as const :
    isCritical ? 'warning'        as const :
    isWarning  ? 'time-outline'   as const :
                 'checkmark-circle' as const;

  const progress = isExpired ? 0 : Math.min(daysLeft / MAX_DAYS, 1);
  
  // Categorize based on default names or keep custom
  const catConfig = CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG['other'];
  const categoryLabel = (() => {
    if (['deli', 'pharmacy', 'other'].includes(product.category.toLowerCase())) {
      return t(`categories.${product.category.toLowerCase()}`);
    }
    return product.category;
  })();

  const handlePressIn  = () => Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const handlePressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 4 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.card, 
          { backgroundColor: colors.surface, borderColor: colors.border + '60' },
          isExpired && { backgroundColor: COLORS.danger + '06', borderColor: COLORS.danger + '20' }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.body}>
          {/* ── Üst satır ── */}
          <View style={styles.topRow}>
            <View style={[styles.categoryIconWrap, { backgroundColor: catConfig.light }]}>
              <Text style={styles.categoryEmoji}>{catConfig.emoji}</Text>
            </View>

            <View style={styles.nameWrap}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                {product.name}
              </Text>
              
              <View style={[styles.categoryPill, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name={catConfig.icon} size={11} color={catConfig.color} />
                <Text style={[styles.categoryText, { color: catConfig.color }]}>{categoryLabel}</Text>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusLight }]}>
              <Ionicons name={statusIcon} size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>

          {/* ── Progress bar ── */}
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%` as any,
                  backgroundColor: statusColor,
                  opacity: isExpired ? 0.3 : 1.0,
                },
              ]}
            />
          </View>

          {/* ── Alt satır ── */}
          <View style={styles.bottomRow}>
            <View style={styles.dateLabelGroup}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.dateText, { color: colors.textLight }]}>
                {formatDate(product.expirationDate, {
                  day: 'numeric', month: 'short', year: 'numeric',
                }, currentLanguage)}
              </Text>
            </View>

            <View style={styles.arrowGroup}>
              <Ionicons name="chevron-forward-circle" size={18} color={colors.textMuted} />
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
    ...SHADOWS.sm,
  },
  card: {
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: SIZES.md,
    paddingVertical: 16,
    gap: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIconWrap: {
    width: 44, height: 44, borderRadius: SIZES.radius_sm + 2,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
    ...SHADOWS.sm,
  },
  categoryEmoji: { fontSize: 22 },
  nameWrap: { flex: 1, gap: 4 },
  productName: {
    fontSize: 16, fontWeight: '800', letterSpacing: -0.4,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, flexShrink: 0,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  bottomRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryPill:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    alignSelf: 'flex-start',
  },
  categoryText: { fontSize: 11, fontWeight: '700' },
  dateLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: {
    fontSize: 12, fontWeight: '600',
  },
  arrowGroup: { flexDirection: 'row', alignItems: 'center' },
});

export default ProductCard;
