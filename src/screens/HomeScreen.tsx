import React, { useState, useCallback, useRef } from 'react';
import {
  View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity,
  Text, RefreshControl, Platform, Animated, TextInput,
} from 'react-native';
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
import { exportData, importData } from '../utils/backup';
import { Alert } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [products, setProducts]               = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Tümü'>('Tümü');
  const [statusFilter, setStatusFilter]       = useState<'All' | 'Expired' | 'Warning' | 'Safe'>('All');
  const [searchQuery, setSearchQuery]         = useState('');
  const [refreshing, setRefreshing]           = useState(false);
  const [searchFocused, setSearchFocused]     = useState(false);
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
    (category: Category | 'Tümü', status: string, data: Product[], query: string) => {
      let result = category === 'Tümü' ? data : data.filter(p => p.category === category);
      
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

  const handleCategorySelect = (category: Category | 'Tümü') => {
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
    if (h < 12) return 'Günaydın 🌤';
    if (h < 18) return 'İyi günler 👋';
    return 'İyi akşamlar 🌙';
  })();

  const handleSettings = () => {
    Alert.alert(
      'Veri Yönetimi',
      'Uygulama verilerinizi (İlaç, Ürün vb.) JSON olarak cihazınıza kaydedebilir veya yükleyebilirsiniz.',
      [
        { text: 'Dışa Aktar (Yedekle)', onPress: () => exportData() },
        { text: 'İçe Aktar (Ger Yükle)', onPress: () => importData(loadProducts) },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: colors.textLight }]}>{greeting}</Text>
            <Text style={[styles.headerTitle, { color: colors.secondary }]}>Raf Ömrüm</Text>
          </View>
          <View style={styles.headerButtons}>
            {/* Settings / Backup */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={handleSettings}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={colors.textLight}
              />
            </TouchableOpacity>

            {/* Dark Mode Toggle */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={toggleTheme}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={isDark ? COLORS.warning : colors.textLight}
              />
            </TouchableOpacity>

            {/* İlaç Hatırlatıcı kısayolu */}
            <TouchableOpacity
              style={[styles.medButton, { backgroundColor: COLORS.pharmacyLight }]}
              onPress={() => navigation.navigate('Medications')}
            >
              <Ionicons name="medkit-outline" size={18} color={COLORS.pharmacy} />
            </TouchableOpacity>

            {!isPremium ? (
              <TouchableOpacity onPress={() => navigation.navigate('Paywall')} activeOpacity={0.8}>
                <LinearGradient
                  colors={COLORS.gradientWarm}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.proButton}
                >
                  <Ionicons name="diamond" size={14} color="#FFF" />
                  <Text style={styles.proButtonText}>PRO</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <LinearGradient
                colors={[COLORS.primary + '20', COLORS.primary + '10']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.proBadge}
              >
                <Ionicons name="diamond" size={14} color={COLORS.primary} />
                <Text style={[styles.proBadgeText, { color: COLORS.primary }]}>PRO</Text>
              </LinearGradient>
            )}
          </View>
        </View>

        {/* Stats Row */}
        {stats.total > 0 && (
          <View style={styles.statsRow}>
            <StatChip 
              icon="checkmark-circle" 
              value={stats.safe}    
              label="Güvende"  
              color={COLORS.safe}    
              light={COLORS.safeLight}
              active={statusFilter === 'Safe'}
              onPress={() => handleStatusToggle('Safe')}
            />
            <StatChip 
              icon="warning"          
              value={stats.warning} 
              label="Yaklaşan" 
              color={COLORS.warning} 
              light={COLORS.warningLight}
              active={statusFilter === 'Warning'}
              onPress={() => handleStatusToggle('Warning')}
            />
            <StatChip 
              icon="alert-circle"     
              value={stats.expired} 
              label="Geçti"    
              color={COLORS.danger}  
              light={COLORS.dangerLight}
              active={statusFilter === 'Expired'}
              onPress={() => handleStatusToggle('Expired')}
            />
          </View>
        )}

        {/* ── Arama Çubuğu ── */}
        <View style={[
          styles.searchContainer,
          { backgroundColor: colors.surface, borderColor: searchFocused ? COLORS.primary : colors.border },
          searchFocused && styles.searchContainerFocused,
        ]}>
          <Ionicons name="search" size={18} color={searchFocused ? COLORS.primary : colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Ürün ara..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <CategoryFilter
          categories={['Tümü', 'Şarküteri', 'Eczane', 'Diğer']}
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
        />
        {(searchQuery.length > 0 || statusFilter !== 'All') && (
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsText, { color: colors.textLight }]}>
              {filteredProducts.length} ürün listeleniyor
              {statusFilter !== 'All' && <Text style={{ fontWeight: '700' }}> ({statusFilter === 'Expired' ? 'Geçmiş' : statusFilter === 'Warning' ? 'Yaklaşan' : 'Güvende'})</Text>}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setSelectedCategory('Tümü');
                applyFilter('Tümü', 'All', products, '');
              }}
            >
              <Text style={[styles.clearAllText, { color: COLORS.primary }]}>Filtreleri Temizle</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContainer, !isPremium && styles.listContainerWithAd]}
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
              <View style={[styles.emptyIconRing, { backgroundColor: COLORS.primary + '12' }]}>
                <View style={[styles.emptyIconInner, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons
                    name={searchQuery ? 'search-outline' : 'basket-outline'}
                    size={44}
                    color={COLORS.primary}
                  />
                </View>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.secondary }]}>
                {searchQuery
                  ? `"${searchQuery}" bulunamadı`
                  : selectedCategory === 'Tümü'
                  ? 'Ürün eklemediniz'
                  : `${selectedCategory} ürünü yok`}
              </Text>
              <Text style={[styles.emptySubText, { color: colors.textLight }]}>
                {searchQuery
                  ? 'Farklı bir arama deneyin veya aramayı temizleyin.'
                  : 'Sağ alttaki '}{!searchQuery && <Text style={{ color: COLORS.primary, fontWeight: '700' }}>+</Text>}
                {!searchQuery && ' butonuna dokunarak ürün ekleyebilirsiniz.'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Banner reklam */}
      {!isPremium && (
        <View style={[styles.adContainer, { backgroundColor: colors.surface }]}>
          <BannerAd
            unitId={AD_UNIT_IDS.banner}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdFailedToLoad={(err: any) => console.warn('[AdMob] Banner failed:', err.message)}
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
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

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
const StatChip: React.FC<StatChipProps> = ({ icon, value, label, color, light, active, onPress }) => (
  <TouchableOpacity 
    style={[
      chipStyles.wrap, 
      { backgroundColor: active ? color : light, borderColor: color, borderWidth: active ? 1 : 0 }
    ]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={16} color={active ? '#fff' : color} />
    <Text style={[chipStyles.value, { color: active ? '#fff' : color }]}>{value}</Text>
    <Text style={[chipStyles.label, { color: active ? '#fff' : color }]}>{label}</Text>
  </TouchableOpacity>
);
const chipStyles = StyleSheet.create({
  wrap:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 12, borderRadius: SIZES.radius_sm + 4, ...SHADOWS.sm },
  value: { fontWeight: '900', fontSize: 16 },
  label: { fontWeight: '600', fontSize: 12, opacity: 0.9 },
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
    gap: SIZES.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  iconButton: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  proButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, gap: 6,
    ...SHADOWS.sm,
  },
  proButtonText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  proBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, gap: 6,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  proBadgeText: { fontWeight: '800', fontSize: 12 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medButton: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },

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
    borderWidth: 1.5,
    paddingHorizontal: SIZES.sm,
    gap: 4,
    ...Platform.select({
      ios:     { shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
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
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  clearBtn: { padding: 4 },

  // ── Liste ──
  listContainer:        { paddingHorizontal: SIZES.md, paddingBottom: 120, flexGrow: 1 },
  listContainerWithAd:  { paddingBottom: 180 },

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
});

export default HomeScreen;
