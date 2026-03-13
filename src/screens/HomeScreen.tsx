import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Text, RefreshControl, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Product, Category, RootStackParamList } from '../types';
import { getProducts } from '../utils/storage';
import { COLORS, SIZES } from '../theme';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Tümü'>('Tümü');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const loadProducts = async () => {
    setRefreshing(true);
    const data = await getProducts();
    setProducts(data);
    applyFilter(selectedCategory, data);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const applyFilter = (category: Category | 'Tümü', data: Product[] = products) => {
    setSelectedCategory(category);
    if (category === 'Tümü') {
      setFilteredProducts(data);
    } else {
      setFilteredProducts(data.filter(p => p.category === category));
    }
  };

  const calculateAppStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let expired = 0;
    let warning = 0;

    products.forEach(p => {
      const expDate = new Date(p.expirationDate);
      const diffTime = expDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) expired++;
      else if (daysLeft <= 3) warning++;
    });

    return { expired, warning };
  };

  const status = calculateAppStatus();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Raf Ömrüm</Text>
          <Text style={styles.headerSubtitle}>
            {products.length === 0 
              ? 'Henüz ürün eklemediniz.' 
              : `Toplam ${products.length} ürün takip ediliyor.`}
          </Text>
        </View>
      </View>

      {products.length > 0 && (status.expired > 0 || status.warning > 0) && (
        <View style={styles.summaryContainer}>
          {status.expired > 0 && (
            <View style={[styles.summaryBadge, { backgroundColor: COLORS.danger + '15' }]}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={[styles.summaryText, { color: COLORS.danger }]}>
                {status.expired} Ürünün Süresi Geçti
              </Text>
            </View>
          )}
          {status.warning > 0 && (
            <View style={[styles.summaryBadge, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="warning" size={18} color={COLORS.warning} />
              <Text style={[styles.summaryText, { color: COLORS.warning }]}>
                {status.warning} Ürünün Süresi Yaklaşıyor
              </Text>
            </View>
          )}
        </View>
      )}

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
              <View style={styles.emptyIconContainer}>
                <Ionicons name="fast-food-outline" size={50} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>Bu kategoride ürün yok</Text>
              <Text style={styles.emptySubText}>Sağ alttaki (+) butonuna dokunarak yeni ürün ekleyebilirsiniz.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddProduct', {})}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color={COLORS.surface} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.md + 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    marginTop: 6,
    fontWeight: '500',
  },
  summaryContainer: {
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    gap: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radius,
    gap: 8,
  },
  summaryText: {
    fontWeight: '700',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: SIZES.md,
    paddingBottom: 110,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: SIZES.xl,
    right: SIZES.lg,
    backgroundColor: COLORS.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: `0 8px 24px ${COLORS.primary}66`,
      }
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  emptyText: {
    fontSize: 20,
    color: COLORS.secondary,
    fontWeight: '800',
    marginBottom: SIZES.sm,
  },
  emptySubText: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    paddingHorizontal: SIZES.xl,
  },
});

export default HomeScreen;

