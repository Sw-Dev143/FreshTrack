import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView,  } from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Product, RootStackParamList } from '../types';
import { deleteProduct, getProducts } from '../utils/storage';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { addToShoppingList, removeFromShoppingList, getShoppingList } from '../utils/shoppingList';
import { formatDate } from '../utils/date';
import { useLanguage } from '../context/LanguageContext';

type DetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type NavigationProp   = NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>;

const CATEGORY_CONFIG: Record<string, { icon: 'restaurant' | 'medkit' | 'cube'; color: string; light: string }> = {
  'deli':     { icon: 'restaurant' as const, color: COLORS.deli,     light: COLORS.deliLight },
  'pharmacy': { icon: 'medkit'    as const,  color: COLORS.pharmacy, light: COLORS.pharmacyLight },
  'other':    { icon: 'cube'      as const,  color: COLORS.other,    light: COLORS.otherLight },
};

const ProductDetailsScreen: React.FC = () => {
  const route      = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const [product, setProduct] = useState<Product>(route.params.product);
  const [inShoppingList, setInShoppingList] = useState(false);
  const { currentLanguage } = useLanguage();
  const { t } = useLanguage();

  const checkShoppingList = async (p: Product) => {
    const list = await getShoppingList();
    setInShoppingList(list.some(i => i.productName === p.name));
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const products = await getProducts();
        const fresh    = products.find(p => p.id === route.params.product.id);
        if (fresh && active) { setProduct(fresh); checkShoppingList(fresh); }
        else if (!fresh && active) navigation.goBack();
      })();
      return () => { active = false; };
    }, [route.params.product.id])
  );

  const handleDelete = () => {
    Alert.alert(
      t('details.deleteTitle'),
      t('details.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: async () => {
          await deleteProduct(product.id);
          navigation.goBack();
        }},
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('AddProduct', { productToEdit: product });
  };

  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((new Date(product.expirationDate).getTime() - today.getTime()) / 86400000);

  const statusColor =
    daysLeft < 0  ? COLORS.danger  :
    daysLeft <= 3 ? COLORS.warning : COLORS.safe;
  const statusLight =
    daysLeft < 0  ? COLORS.dangerLight  :
    daysLeft <= 3 ? COLORS.warningLight : COLORS.safeLight;
  const statusText =
    daysLeft < 0   ? t('details.status.expired', { count: Math.abs(daysLeft) }) :
    daysLeft === 0 ? t('details.status.today') :
    daysLeft === 1 ? t('details.status.tomorrow') :
                     t('details.status.daysLeft', { count: daysLeft });
  const statusIcon =
    daysLeft < 0   ? 'alert-circle'    as const :
    daysLeft <= 3  ? 'warning'         as const :
                     'checkmark-circle' as const;

  const catConfig = CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG['other'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero Kart ── */}
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.heroCard}
        >
          <View style={[styles.iconCircle, { backgroundColor: catConfig.light }]}>
            <Ionicons name={catConfig.icon} size={42} color={catConfig.color} />
          </View>

          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>

          <View style={[styles.categoryBadge, { backgroundColor: catConfig.light }]}>
            <Text style={[styles.categoryBadgeText, { color: catConfig.color }]}>
              {t(`categories.${product.category}`)}
            </Text>
          </View>

          <LinearGradient
            colors={[statusLight, statusLight + '80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bigStatus}
          >
            <Ionicons name={statusIcon} size={28} color={statusColor} />
            <Text style={[styles.bigStatusText, { color: statusColor }]}>{statusText}</Text>
          </LinearGradient>
        </LinearGradient>

        {/* ── Bilgi Kartları ── */}
        <View style={styles.infoGrid}>
          <InfoCard
            icon="calendar"
            label={t('details.labels.expiration')}
            value={formatDate(product.expirationDate, {
              day: 'numeric', month: 'long', year: 'numeric',
            }, currentLanguage)}
            color={COLORS.primary}
            colors={colors}
          />
          <InfoCard
            icon="time"
            label={t('details.labels.daysLeft')}
            value={daysLeft < 0 ? `−${Math.abs(daysLeft)}` : `${daysLeft}`}
            color={statusColor}
            colors={colors}
          />
          <InfoCard
            icon="calendar-outline"
            label={t('details.labels.createdAt')}
            value={formatDate(product.createdAt, {
              day: 'numeric', month: 'long', year: 'numeric',
            }, currentLanguage)}
            color={colors.textLight}
            colors={colors}
          />
          {product.barcode && (
            <InfoCard
              icon="barcode"
              label={t('details.labels.barcode')}
              value={product.barcode}
              color={colors.textLight}
              colors={colors}
            />
          )}
        </View>

        {/* ── Aksiyon Butonları ── */}
        <View style={styles.actionRow}>
          {/* Düzenle */}
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.editBtnText}>{t('details.edit')}</Text>
          </TouchableOpacity>

          {/* Sil */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            <Text style={styles.deleteBtnText}>{t('details.delete')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Alışveriş Listesi ── */}
        <TouchableOpacity
          style={[
            styles.shoppingBtn,
            { backgroundColor: inShoppingList ? COLORS.safe + '15' : colors.surface,
              borderColor: inShoppingList ? COLORS.safe : colors.border },
          ]}
          onPress={async () => {
            if (inShoppingList) {
              const list = await getShoppingList();
              const item = list.find(i => i.productName === product.name);
              if (item) await removeFromShoppingList(item.id);
              setInShoppingList(false);
            } else {
              await addToShoppingList(product.name, product.category);
              setInShoppingList(true);
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={inShoppingList ? 'cart' : 'cart-outline'}
            size={20}
            color={inShoppingList ? COLORS.safe : colors.textLight}
          />
          <Text style={[styles.shoppingBtnText, { color: inShoppingList ? COLORS.safe : colors.textLight }]}>
            {inShoppingList ? t('details.shoppingListAdded') : t('details.shoppingListAdd')}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Mini info card ────────────────────────────────────────────────────────────
interface InfoCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; color: string;
  colors: any;
}
const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, color, colors }) => (
  <View style={[infoCardStyles.card, { backgroundColor: colors.surface }]}>
    <View style={[infoCardStyles.iconWrap, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={[infoCardStyles.label, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[infoCardStyles.value, { color: colors.text }]} numberOfLines={2}>{value}</Text>
  </View>
);
const infoCardStyles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    gap: 6,
    flex: 1,
    minWidth: '45%',
    ...SHADOWS.sm,
  },
  iconWrap: { width: 36, height: 36, borderRadius: SIZES.radius_sm, justifyContent: 'center', alignItems: 'center' },
  label:    { fontSize: 12, fontWeight: '600' },
  value:    { fontSize: 15, fontWeight: '800' },
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:      { flex: 1 },
  scrollContent: { padding: SIZES.md, gap: SIZES.md, paddingBottom: 40 },

  // Hero
  heroCard: {
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
    fontSize: 26, fontWeight: '900',
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

  // Aksiyon butonları
  actionRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
  editBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary + '12',
    paddingVertical: 18, borderRadius: SIZES.radius + 4,
    gap: 10, borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  editBtnText:   { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 18, borderRadius: SIZES.radius + 4,
    gap: 10, borderWidth: 1, borderColor: COLORS.danger + '30',
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 16, fontWeight: '800' },
  shoppingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: SIZES.radius + 4,
    gap: 10, borderWidth: 1, marginTop: -4,
  },
  shoppingBtnText: { fontSize: 15, fontWeight: '700' },
});

export default ProductDetailsScreen;
