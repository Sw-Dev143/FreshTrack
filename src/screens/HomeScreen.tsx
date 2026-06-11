import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, RefreshControl, Platform, Animated, TextInput,  } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Product, Category, RootStackParamList } from '../types';
import { getProducts } from '../utils/storage';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import { usePremium } from '../context/PremiumContext';
import { BannerAd, BannerAdSize } from '../utils/ads';
import { AD_UNIT_IDS } from '../utils/adConfig';
import { exportBackup, importBackup } from '../utils/backup';
import { Alert } from 'react-native';

import { useLanguage } from '../context/LanguageContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [products, setProducts]               = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [statusFilter, setStatusFilter]       = useState<'All' | 'Expired' | 'Warning' | 'Safe'>('All');
  const [searchQuery, setSearchQuery]         = useState('');
  const [refreshing, setRefreshing]           = useState(false);
  const [searchFocused, setSearchFocused]     = useState(false);
  const [showTip, setShowTip]                 = useState(true);
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

  const applyFilter = useCallback(
    (category: Category | 'all', status: string, data: Product[], query: string) => {
      let result = category === 'all' ? data : data.filter(p => p.category === category);
      
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (status !== 'All') {
        result = result.filter(p => {
          const d = Math.ceil((new Date(p.expirationDate).getTime() - today.getTime()) / 86400000);
          if (status === 'Expired') return d < 0;
          if (status === 'Warning') return d >= 0 && d <= 3;
          if (status === 'Safe') return d > 3;
          return true;
        });
      }

      if (query.trim()) {
        const q = query.trim().toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(q));
      }
      setFilteredProducts(result);
    },
    []
  );

  const loadProducts = async () => {
    setRefreshing(true);
    const data = await getProducts();
    setProducts(data);
    applyFilter(selectedCategory, statusFilter, data, searchQuery);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadProducts(); }, []));

  const handleCategorySelect = (category: Category | 'all') => {
    setSelectedCategory(category);
    applyFilter(category, statusFilter, products, searchQuery);
  };

  const handleStatusToggle = (status: 'Expired' | 'Warning' | 'Safe') => {
    const newFilter = statusFilter === status ? 'All' : status;
    setStatusFilter(newFilter);
    applyFilter(selectedCategory, newFilter, products, searchQuery);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilter(selectedCategory, statusFilter, products, text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    applyFilter(selectedCategory, statusFilter, products, '');
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

  const stats    = calculateStats();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('home.greeting.morning');
    if (h < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  })();

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: colors.textLight }]}>{greeting}</Text>
            <Text style={[styles.headerTitle, { color: colors.secondary }]}>FreshTrack</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={handleSettings}
            >
              <Ionicons name="settings-outline" size={18} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={toggleTheme}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={isDark ? COLORS.warning : colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.medButton, { backgroundColor: COLORS.pharmacyLight }]}
              onPress={() => navigation.navigate('Medications')}
            >
              <Ionicons name="medkit-outline" size={18} color={COLORS.pharmacy} />
            </TouchableOpacity>

            {!isPremium ? (
              <TouchableOpacity onPress={() => navigation.navigate('Paywall')} activeOpacity={0.8}>
                <LinearGradient colors={COLORS.gradientWarm} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proButton}>
                  <Ionicons name="diamond" size={14} color="#FFF" />
                  <Text style={styles.proButtonText}>{t('common.pro')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.proBadge}>
                <Ionicons name="diamond" size={14} color={COLORS.primary} />
                <Text style={[styles.proBadgeText, { color: COLORS.primary }]}>{t('common.pro')}</Text>
              </View>
            )}
          </View>
        </View>

        {stats.total > 0 && (
          <View style={styles.statsRow}>
            <StatChip icon="checkmark-circle" value={stats.safe} label={t('home.stats.safe')} color={COLORS.safe} light={COLORS.safeLight} active={statusFilter === 'Safe'} onPress={() => handleStatusToggle('Safe')} />
            <StatChip icon="warning" value={stats.warning} label={t('home.stats.warning')} color={COLORS.warning} light={COLORS.warningLight} active={statusFilter === 'Warning'} onPress={() => handleStatusToggle('Warning')} />
            <StatChip icon="alert-circle" value={stats.expired} label={t('home.stats.expired')} color={COLORS.danger} light={COLORS.dangerLight} active={statusFilter === 'Expired'} onPress={() => handleStatusToggle('Expired')} />
          </View>
        )}

        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: searchFocused ? COLORS.primary : colors.border }]}>
          <Ionicons name="search" size={18} color={searchFocused ? COLORS.primary : colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <CategoryFilter 
          categories={['all', 'deli', 'pharmacy', 'other']} 
          selectedCategory={selectedCategory} 
          onSelect={handleCategorySelect} 
        />
      </View>

      {/* Pro Tip Card */}
      {showTip && products.length > 0 && (
        <View style={styles.tipContainer}>
          <LinearGradient
            colors={[COLORS.primary + '10', COLORS.primary + '05']}
            style={styles.tipCard}
          >
            <View style={styles.tipHeader}>
              <View style={styles.tipIconWrap}>
                <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={[styles.tipTitle, { color: colors.secondary }]}>{t('home.tip.title')}</Text>
              <TouchableOpacity onPress={() => setShowTip(false)}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.tipBody, { color: colors.textLight }]}>{t('home.tip.body')}</Text>
          </LinearGradient>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProducts} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { product: item })} />
        )}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconRing, { backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.emptyIconInner, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="basket-outline" size={42} color={COLORS.primary} />
                </View>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('home.empty.noProducts')}</Text>
              <Text style={[styles.emptySubText, { color: colors.textLight }]}>
                {selectedCategory !== 'all' 
                  ? t('home.empty.noCategoryProducts', { category: t(`categories.${selectedCategory.toLowerCase()}`) })
                  : searchQuery 
                    ? t('home.empty.noResults', { query: searchQuery })
                    : t('home.empty.addFirst')
                }
              </Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => navigation.navigate('AddProduct', {})}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={COLORS.gradientPrimary}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {!isPremium && Platform.OS !== 'web' && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={AD_UNIT_IDS.banner}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

// ── Mini istatistik chip ──────────────────────────────────────────────────────
interface StatChipProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number; label: string; color: string; light: string;
  active?: boolean;
  onPress: () => void;
}
const StatChip: React.FC<StatChipProps> = ({ icon, value, label, color, active, onPress }) => {
  const { isDark } = useTheme();
  const inactiveBg = isDark ? color + '18' : color + '0C';
  const inactiveBorder = isDark ? color + '30' : color + '25';

  return (
    <TouchableOpacity 
      style={[
        chipStyles.wrap, 
        { 
          backgroundColor: active ? color : inactiveBg, 
          borderColor: active ? 'transparent' : inactiveBorder, 
          borderWidth: 1 
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={15} color={active ? '#fff' : color} />
      <Text style={[chipStyles.value, { color: active ? '#fff' : color }]}>{value}</Text>
      <Text style={[chipStyles.label, { color: active ? '#fff' : color }]}>{label}</Text>
    </TouchableOpacity>
  );
};
const chipStyles = StyleSheet.create({
  wrap:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 12, borderRadius: SIZES.radius_sm + 2, ...SHADOWS.sm },
  value: { fontWeight: '900', fontSize: 15 },
  label: { fontWeight: '700', fontSize: 11, opacity: 0.9 },
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  iconButton: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  proButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, gap: 5,
    ...SHADOWS.sm,
  },
  proButtonText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  proBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, gap: 5,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  proBadgeText: { fontWeight: '800', fontSize: 12 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medButton: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.sm,
  },
  statsRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },

  filterSection: { gap: 12, marginBottom: 8 },
  resultsHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    marginTop: -4,
  },
  resultsText: { fontSize: 13, fontWeight: '600' },
  clearAllText: { fontSize: 13, fontWeight: '700' },

  // ── Arama ──
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    paddingHorizontal: SIZES.sm,
    gap: 6,
    ...Platform.select({
      ios:     { shadowColor: '#5F5DEC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  searchContainerFocused: {
    ...Platform.select({
      ios:     { shadowColor: COLORS.primary, shadowOpacity: 0.15 },
      android: { elevation: 4 },
    }),
  },
  searchIcon:  { marginLeft: 4 },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  clearBtn: { padding: 4 },

  // ── Liste ──
  listContainer:        { paddingHorizontal: SIZES.md, paddingBottom: 120, flexGrow: 1 },
  listContainerWithAd:  { paddingBottom: 180 },

  // FAB
  fabContainer: {
    position: 'absolute', bottom: SIZES.xl, right: SIZES.lg,
    width: 62, height: 62, borderRadius: 31,
    ...SHADOWS.primary,
  },
  fabGradient: {
    width: '100%', height: '100%',
    borderRadius: 31,
    justifyContent: 'center', alignItems: 'center',
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
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  emptyIconInner: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle:   { fontSize: 20, fontWeight: '800', marginBottom: SIZES.sm, textAlign: 'center' },
  emptySubText: { fontSize: 15, textAlign: 'center', fontWeight: '500', lineHeight: 22 },

  adContainer: {
    alignItems: 'center', width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  // Pro Tip
  tipContainer: { paddingHorizontal: SIZES.md, marginBottom: SIZES.sm },
  tipCard: {
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tipIconWrap: { 
    width: 28, height: 28, borderRadius: 14, 
    backgroundColor: COLORS.primary + '15', 
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8
  },
  tipTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  tipBody: { fontSize: 13, lineHeight: 18, fontWeight: '500', marginLeft: 36 },
});

export default HomeScreen;
