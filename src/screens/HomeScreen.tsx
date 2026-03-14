import React, { useState, useCallback, useRef } from 'react';
import {
  View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity,
  Text, RefreshControl, Platform, Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Product, Category, RootStackParamList } from '../types';
import { getProducts } from '../utils/storage';
import { COLORS, SIZES, SHADOWS } from '../theme';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import { usePremium } from '../context/PremiumContext';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../utils/adConfig';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const [products, setProducts]               = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Tümü'>('Tümü');
  const [refreshing, setRefreshing]           = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { isPremium } = usePremium();

  // FAB pulse animation
  const fabPulse = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadProducts = async () => {
    setRefreshing(true);
    const data = await getProducts();
    setProducts(data);
    applyFilter(selectedCategory, data);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadProducts(); }, []));

  const applyFilter = (category: Category | 'Tümü', data: Product[] = products) => {
    setSelectedCategory(category);
    setFilteredProducts(category === 'Tümü' ? data : data.filter(p => p.category === category));
  };

  const calculateStats = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let expired = 0, warning = 0, safe = 0;
    products.forEach(p => {
      const d = Math.ceil((new Date(p.expirationDate).getTime() - today.getTime()) / 86400000);
      if (d < 0) expired++;
      else if (d <= 3) warning++;
      else safe++;
    });
    return { expired, warning, safe, total: products.length };
  };

  const stats = calculateStats();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Günaydın 🌤';
    if (h < 18) return 'İyi günler 👋';
    return 'İyi akşamlar 🌙';
  })();

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.headerTitle}>Raf Ömrüm</Text>
          </View>
          {!isPremium ? (
            <TouchableOpacity style={styles.proButton} onPress={() => navigation.navigate('Paywall')}>
              <Ionicons name="diamond" size={14} color="#FFD700" />
              <Text style={styles.proButtonText}>PRO</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.proBadge}>
              <Ionicons name="diamond" size={14} color={COLORS.primaryLight} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        {stats.total > 0 && (
          <View style={styles.statsRow}>
            <StatChip icon="checkmark-circle" value={stats.safe}    label="Güvende"  color={COLORS.safe}    light={COLORS.safeLight} />
            <StatChip icon="warning"          value={stats.warning} label="Yaklaşan" color={COLORS.warning} light={COLORS.warningLight} />
            <StatChip icon="alert-circle"     value={stats.expired} label="Geçti"    color={COLORS.danger}  light={COLORS.dangerLight} />
          </View>
        )}
      </View>

      <CategoryFilter
        categories={['Tümü', 'Şarküteri', 'Eczane', 'Diğer']}
        selectedCategory={selectedCategory}
        onSelect={(cat) => applyFilter(cat)}
      />

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadProducts} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
          />
        )}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconRing}>
                <View style={styles.emptyIconInner}>
                  <Ionicons name="basket-outline" size={44} color={COLORS.primary} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>
                {selectedCategory === 'Tümü' ? 'Ürün eklemediniz' : `${selectedCategory} ürünü yok`}
              </Text>
              <Text style={styles.emptySubText}>
                Sağ alttaki{' '}
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>+</Text>
                {' '}butonuna dokunarak ürün ekleyebilirsiniz.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Banner reklam */}
      {!isPremium && (
          <View style={styles.adContainer}>
          <BannerAd
            unitId={AD_UNIT_IDS.banner}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdFailedToLoad={(err) => console.warn('[AdMob] Banner failed:', err.message)}
          />
        </View>
      )}

      {/* FAB */}
      <Animated.View style={[styles.fabRipple, { transform: [{ scale: fabPulse }] }]} />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color={COLORS.surface} />
      </TouchableOpacity>

    </SafeAreaView>
  );
};

// ── Mini istatistik chip ──────────────────────────────────────────────────────
interface StatChipProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number; label: string; color: string; light: string;
}
const StatChip: React.FC<StatChipProps> = ({ icon, value, label, color, light }) => (
  <View style={[chipStyles.wrap, { backgroundColor: light }]}>
    <Ionicons name={icon} size={16} color={color} />
    <Text style={[chipStyles.value, { color }]}>{value}</Text>
    <Text style={[chipStyles.label, { color }]}>{label}</Text>
  </View>
);
const chipStyles = StyleSheet.create({
  wrap:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: SIZES.radius_sm + 2 },
  value: { fontWeight: '900', fontSize: 15 },
  label: { fontWeight: '600', fontSize: 12, opacity: 0.85 },
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.md,
    gap: SIZES.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: -1,
  },
  proButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, gap: 5,
  },
  proButtonText: { color: '#FFD700', fontWeight: '800', fontSize: 12 },
  proBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, gap: 5,
  },
  proBadgeText: { color: COLORS.primaryLight, fontWeight: '800', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },

  listContainer: { paddingHorizontal: SIZES.md, paddingBottom: 120, flexGrow: 1 },

  // FAB
  fab: {
    position: 'absolute', bottom: SIZES.xl, right: SIZES.lg,
    backgroundColor: COLORS.primary,
    width: 62, height: 62, borderRadius: 31,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.primary,
  },
  fabRipple: {
    position: 'absolute', bottom: SIZES.xl, right: SIZES.lg,
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: COLORS.primary + '30',
  },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 80, paddingHorizontal: SIZES.xl },
  emptyIconRing: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  emptyIconInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, color: COLORS.secondary, fontWeight: '800', marginBottom: SIZES.sm, textAlign: 'center' },
  emptySubText: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', fontWeight: '500', lineHeight: 22 },

  adContainer: {
    alignItems: 'center', width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    backgroundColor: COLORS.surface,
  },
});

export default HomeScreen;
