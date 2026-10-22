import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { usePremium } from '../context/PremiumContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// ── Feature listesi ──────────────────────────────────────────────────────────
const getFeatures = (t: any) => [
  { icon: 'ban' as const, color: COLORS.danger, text: t('paywall.features.noAds') },
  { icon: 'shield-checkmark' as const, color: COLORS.safe, text: t('paywall.features.support') },
];

const AlreadyPro: React.FC<{ onBack: () => void; colors: any }> = ({ onBack, colors }) => {
  const { t } = useLanguage();
  return (
  <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <View style={styles.proContainer}>
      <View style={[styles.proIconRing, { borderColor: COLORS.primary + '30' }]}>
        <View style={[styles.proIconInner, { backgroundColor: COLORS.primary + '18' }]}>
          <Ionicons name="diamond" size={48} color={COLORS.primary} />
        </View>
      </View>
      <Text style={[styles.proTitle, { color: colors.secondary }]}>{t('paywall.alreadyPro')}</Text>
      <Text style={[styles.proSubtitle, { color: colors.textLight }]}>{t('paywall.alreadyProSubtitle')}</Text>
      <TouchableOpacity style={styles.ctaButton} onPress={onBack} activeOpacity={0.9}>
        <Text style={styles.ctaText}>{t('common.success')}</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
  );
};

const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isPremium, unlockPremium } = usePremium();
  const { colors } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const FEATURES = getFeatures(t);

  // Yerel fiyat formatlama (Profesyonel Global Fiyatlandırma)
  const getPricing = () => {
    switch (currentLanguage) {
      case 'tr': return { price: 149.99, currency: 'TRY' };
      case 'ja': return { price: 450,    currency: 'JPY' };
      case 'zh': return { price: 21,     currency: 'CNY' };
      case 'de':
      case 'es':
      case 'fr': return { price: 3.49,   currency: 'EUR' };
      case 'ru': // Rusça dili için belirsizliği önlemek adına Global USD kullanıyoruz
      default:   return { price: 2.99,   currency: 'USD' };
    }
  };

  const { price, currency } = getPricing();
  const formattedPrice = new Intl.NumberFormat(currentLanguage === 'ru' ? 'ru-RU' : currentLanguage, {
    style: 'currency',
    currency: currency,
  }).format(price);

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
      t('paywall.title'),
      `${formattedPrice} ${t('paywall.subtitle')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: `${t('paywall.cta')} ${formattedPrice}`,
          onPress: async () => {
            await unlockPremium();
            Alert.alert(t('paywall.successTitle'), t('paywall.successMessage'), [
              { text: t('common.success'), onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  const handleRestore = () => {
    Alert.alert(t('paywall.restore'), t('paywall.priceNote'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('paywall.restore'),
        onPress: async () => {
          Alert.alert(t('paywall.restoreErrorTitle'), t('paywall.restoreErrorMessage'));
        },
      },
    ]);
  };

  if (isPremium) return <AlreadyPro onBack={() => navigation.goBack()} colors={colors} />;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Kapat butonu */}
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.border }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.textLight} />
        </TouchableOpacity>

        {/* Hero ikonu */}
        <View style={styles.heroArea}>
          <Animated.View style={[styles.iconRipple, { transform: [{ scale: pulse }] }]} />
          <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="diamond" size={56} color="#FFD700" />
          </View>
          <Text style={[styles.title, { color: colors.secondary }]}>{t('paywall.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            {t('paywall.subtitle')}
          </Text>
        </View>

        {/* Feature listesi */}
        <View style={[styles.featuresCard, { backgroundColor: colors.surface }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && [styles.featureDivider, { borderBottomColor: colors.border }]]}>
              <View style={[styles.featureIconWrap, { backgroundColor: f.color + '18' }]}>
                <Ionicons name={f.icon} size={22} color={f.color} />
              </View>
              <Text style={[styles.featureText, { color: colors.secondary }]}>{f.text}</Text>
              <Ionicons name="checkmark" size={18} color={COLORS.safe} />
            </View>
          ))}
        </View>

        {/* Fiyat */}
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>{formattedPrice}</Text>
          <View>
            <Text style={styles.priceLabel}>{t('paywall.priceLabel')}</Text>
            <Text style={styles.priceNote}>{t('paywall.priceNote')}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaButton} onPress={handlePurchase} activeOpacity={0.9}>
          <Ionicons name="diamond" size={20} color="#FFD700" />
          <Text style={styles.ctaText}>{t('paywall.cta')}</Text>
        </TouchableOpacity>

        {/* Geri yükle */}
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
          <Text style={[styles.restoreText, { color: colors.textLight }]}>{t('paywall.restore')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy' as never)} activeOpacity={0.6}>
          <Text style={[styles.legalText, { color: COLORS.primary, marginTop: 4, textDecorationLine: 'underline' }]}>
            {t('settings.privacyPolicy')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.legalText, { color: colors.textMuted, marginTop: 8 }]}>
          {t('paywall.legal')}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: SIZES.lg, paddingBottom: 40, alignItems: 'center' },

  closeBtn: {
    alignSelf: 'flex-end',
    padding: SIZES.sm,
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
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.lg,
    ...SHADOWS.lg,
  },
  title: {
    fontSize: 30, fontWeight: '900',
    letterSpacing: -1, marginBottom: SIZES.sm, textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center', lineHeight: 24,
  },

  // Feature listesi
  featuresCard: {
    width: '100%',
    borderRadius: SIZES.radius_lg, padding: SIZES.md,
    marginBottom: SIZES.xl,
    ...SHADOWS.sm,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    paddingVertical: SIZES.md,
  },
  featureDivider: { borderBottomWidth: 1 },
  featureIconWrap: {
    width: 42, height: 42, borderRadius: SIZES.radius_sm,
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { flex: 1, fontSize: 15, fontWeight: '700' },

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
  ctaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },

  // Geri yükle & yasal
  restoreBtn: { padding: SIZES.sm, marginBottom: SIZES.md },
  restoreText: { fontSize: 14, fontWeight: '600' },
  legalText: {
    fontSize: 11,
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
  proTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: SIZES.sm },
  proSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: SIZES.xl, lineHeight: 24 },
});

export default PaywallScreen;
