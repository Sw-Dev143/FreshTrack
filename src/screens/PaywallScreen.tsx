import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Alert, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { usePremium } from '../context/PremiumContext';

// ── Feature listesi ──────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'ban'            as const, color: COLORS.danger,   text: 'Tüm Reklamları Kaldır' },
  { icon: 'infinite'       as const, color: COLORS.primary,  text: 'Sınırsız Ürün Takibi' },
  { icon: 'shield-checkmark' as const, color: COLORS.safe,   text: 'Ömür Boyu Erişim & Güncellemeler' },
  { icon: 'flash'          as const, color: COLORS.warning,  text: 'Öncelikli Destek' },
];

// ── Zaten PRO ekranı ─────────────────────────────────────────────────────────
const AlreadyPro: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.proContainer}>
      <View style={[styles.proIconRing, { borderColor: COLORS.primary + '30' }]}>
        <View style={[styles.proIconInner, { backgroundColor: COLORS.primary + '18' }]}>
          <Ionicons name="diamond" size={48} color={COLORS.primary} />
        </View>
      </View>
      <Text style={styles.proTitle}>Zaten PRO Kullanıcısısınız 🎉</Text>
      <Text style={styles.proSubtitle}>Tüm premium özelliklerin tadını çıkarıyorsunuz.</Text>
      <TouchableOpacity style={styles.ctaButton} onPress={onBack} activeOpacity={0.9}>
        <Text style={styles.ctaText}>Harika!</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

// ── Ana bileşen ──────────────────────────────────────────────────────────────
const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isPremium, unlockPremium } = usePremium();

  // Ikon pulse animasyonu
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePurchase = () => {
    Alert.alert(
      'Raf Ömrüm PRO',
      '₺99,99 karşılığında tek seferlik ödeme ile ömür boyu PRO erişimi kazanacaksınız.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Satın Al ₺99,99',
          onPress: async () => {
            // TODO: Gerçek IAP entegrasyonu (RevenueCat) production öncesi eklenecek
            await unlockPremium();
            Alert.alert('✅ Teşekkürler!', 'PRO üyeliğiniz aktif edildi.', [
              { text: 'Harika!', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  const handleRestore = () => {
    Alert.alert('Satın Alımı Geri Yükle', 'Daha önce satın aldıysanız geri yüklenecek.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Geri Yükle',
        onPress: async () => {
          // TODO: IAP restore purchase
          Alert.alert('Bulunamadı', 'Daha önce yapılmış bir satın alım tespit edilemedi.');
        },
      },
    ]);
  };

  if (isPremium) return <AlreadyPro onBack={() => navigation.goBack()} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Kapat butonu */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Hero ikonu */}
        <View style={styles.heroArea}>
          <Animated.View style={[styles.iconRipple, { transform: [{ scale: pulse }] }]} />
          <View style={styles.iconContainer}>
            <Ionicons name="diamond" size={56} color="#FFD700" />
          </View>
          <Text style={styles.title}>Raf Ömrüm PRO</Text>
          <Text style={styles.subtitle}>
            Tüm kısıtları kaldırın, sınırsız kullanın.{'\n'}Tek seferlik ödeme — ömür boyu erişim.
          </Text>
        </View>

        {/* Feature listesi */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureDivider]}>
              <View style={[styles.featureIconWrap, { backgroundColor: f.color + '18' }]}>
                <Ionicons name={f.icon} size={22} color={f.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
              <Ionicons name="checkmark" size={18} color={COLORS.safe} />
            </View>
          ))}
        </View>

        {/* Fiyat */}
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>₺99,99</Text>
          <View>
            <Text style={styles.priceLabel}>TEK SEFERLİK</Text>
            <Text style={styles.priceNote}>Abonelik yok • Gizli ücret yok</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaButton} onPress={handlePurchase} activeOpacity={0.9}>
          <Ionicons name="diamond" size={20} color="#FFD700" />
          <Text style={styles.ctaText}>Şimdi PRO'ya Geç</Text>
        </TouchableOpacity>

        {/* Geri yükle */}
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
          <Text style={styles.restoreText}>Satın Alımı Geri Yükle</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Satın alma Google Play üzerinden gerçekleşir.{'\n'}
          Koşullar için gizlilik politikamızı inceleyin.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SIZES.lg, paddingBottom: 40, alignItems: 'center' },

  closeBtn: {
    alignSelf: 'flex-end',
    padding: SIZES.sm,
    backgroundColor: COLORS.border,
    borderRadius: 20,
    marginBottom: SIZES.sm,
  },

  // Hero
  heroArea: { alignItems: 'center', marginBottom: SIZES.xl },
  iconRipple: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#FFD70018',
    top: -10,
  },
  iconContainer: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.lg,
    ...SHADOWS.lg,
  },
  title: {
    fontSize: 30, fontWeight: '900', color: COLORS.secondary,
    letterSpacing: -1, marginBottom: SIZES.sm, textAlign: 'center',
  },
  subtitle: {
    fontSize: 16, color: COLORS.textLight,
    textAlign: 'center', lineHeight: 24,
  },

  // Feature listesi
  featuresCard: {
    width: '100%', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius_lg, padding: SIZES.md,
    marginBottom: SIZES.xl,
    ...SHADOWS.sm,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    paddingVertical: SIZES.md,
  },
  featureDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  featureIconWrap: {
    width: 42, height: 42, borderRadius: SIZES.radius_sm,
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { flex: 1, fontSize: 15, color: COLORS.secondary, fontWeight: '700' },

  // Fiyat
  priceRow: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SIZES.md,
    marginBottom: SIZES.xl,
    backgroundColor: COLORS.primary + '10',
    padding: SIZES.md, borderRadius: SIZES.radius,
  },
  priceAmount: { fontSize: 42, fontWeight: '900', color: COLORS.primary },
  priceLabel: { fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  priceNote: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },

  // CTA
  ctaButton: {
    width: '100%', backgroundColor: COLORS.primary,
    paddingVertical: 18, borderRadius: SIZES.radius,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
    marginBottom: SIZES.md,
    ...SHADOWS.primary,
  },
  ctaText: { color: COLORS.surface, fontSize: 18, fontWeight: '900' },

  // Geri yükle & yasal
  restoreBtn: { padding: SIZES.sm, marginBottom: SIZES.md },
  restoreText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
  legalText: {
    fontSize: 11, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 18,
  },

  // Already PRO ekranı
  proContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.xl },
  proIconRing: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  proIconInner: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  proTitle: { fontSize: 24, fontWeight: '900', color: COLORS.secondary, textAlign: 'center', marginBottom: SIZES.sm },
  proSubtitle: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginBottom: SIZES.xl, lineHeight: 24 },
});

export default PaywallScreen;
