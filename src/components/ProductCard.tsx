import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Product } from '../types';
import { COLORS, SIZES } from '../theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const calculateDaysLeft = (expirationDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft(product.expirationDate);

  let statusColor = COLORS.safe;
  let statusText = `${daysLeft} Gün Kaldı`;

  if (daysLeft < 0) {
    statusColor = COLORS.danger;
    statusText = `Süresi Geçti (${Math.abs(daysLeft)} gün)`;
  } else if (daysLeft <= 3) {
    statusColor = COLORS.warning;
  } else if (daysLeft === 0) {
    statusColor = COLORS.danger;
    statusText = 'Bugün Son Gün!';
  }

  const categoryColor = 
    product.category === 'Şarküteri' ? COLORS.deli :
    product.category === 'Eczane' ? COLORS.pharmacy : COLORS.other;

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity 
        style={styles.cardInner} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.categoryText}>{product.category}</Text>
            <Text style={styles.dateText}>SKT: {new Date(product.expirationDate).toLocaleDateString('tr-TR')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: SIZES.md,
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 10px 25px rgba(30, 41, 59, 0.08)',
      }
    }),
  },
  cardInner: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  categoryIndicator: {
    width: 8,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
    gap: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radius_sm,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: SIZES.sm,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default ProductCard;

