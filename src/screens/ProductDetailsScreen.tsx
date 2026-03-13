import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { deleteProduct } from '../utils/storage';
import { COLORS, SIZES } from '../theme';

type DetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>;

const ProductDetailsScreen: React.FC = () => {
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { product } = route.params;

  const handleDelete = () => {
    Alert.alert(
      'Ürünü Sil',
      'Bu ürünü takip listenizden silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const calculateDaysLeft = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(product.expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const daysLeft = calculateDaysLeft();

  const categoryColor = 
    product.category === 'Şarküteri' ? COLORS.deli :
    product.category === 'Eczane' ? COLORS.pharmacy : COLORS.other;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor + '30' }]}>
            <Ionicons 
              name={product.category === 'Eczane' ? 'medical' : product.category === 'Şarküteri' ? 'restaurant' : 'cube'} 
              size={50} 
              color={categoryColor !== COLORS.other ? categoryColor : COLORS.primary} 
            />
          </View>
          
          <Text style={styles.productName}>{product.name}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: categoryColor !== COLORS.other ? categoryColor : COLORS.primary }]}>{product.category}</Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.infoLabel}>Son Kullanma Tarihi:</Text>
              </View>
              <Text style={styles.infoValue}>{new Date(product.expirationDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="time-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.infoLabel}>Kalan Süre:</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: daysLeft < 0 ? COLORS.danger + '15' : daysLeft <= 3 ? COLORS.warning + '15' : COLORS.safe + '15' }]}>
                <Text style={[
                  styles.statusBadgeText, 
                  { color: daysLeft < 0 ? COLORS.danger : daysLeft <= 3 ? COLORS.warning : COLORS.safe }
                ]}>
                  {daysLeft < 0 ? `Süresi ${Math.abs(daysLeft)} gün geçti` : daysLeft === 0 ? 'Bugün Son!' : `${daysLeft} Gün`}
                </Text>
              </View>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.infoLabel}>Eklenme Tarihi:</Text>
              </View>
              <Text style={styles.infoValue}>{new Date(product.createdAt).toLocaleDateString('tr-TR')}</Text>
            </View>
          </View>

        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>Ürünü Sil</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SIZES.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SIZES.xl,
    borderRadius: SIZES.radius + 8,
    alignItems: 'center',
    marginBottom: SIZES.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 12px 30px rgba(30, 41, 59, 0.08)',
      }
    }),
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  productName: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: SIZES.xl + 8,
  },
  categoryBadgeText: {
    fontWeight: '700',
    fontSize: 14,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radius,
    padding: SIZES.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontWeight: '800',
    fontSize: 14,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger + '10',
    paddingVertical: 18,
    borderRadius: SIZES.radius + 4,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ProductDetailsScreen;

