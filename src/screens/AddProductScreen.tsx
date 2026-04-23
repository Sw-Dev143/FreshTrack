import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, ActivityIndicator, Animated,  } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Category, RootStackParamList } from '../types';
import { saveProduct, getBarcodeInfo, saveBarcodeInfo } from '../utils/storage';
import { scheduleExpirationNotification } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { incrementActionCount, requestReviewIfAppropriate } from '../utils/rating';
import { usePremium } from '../context/PremiumContext';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { COLORS, SIZES } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../utils/date';
import { useLanguage } from '../context/LanguageContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;
type RoutePropType  = RouteProp<RootStackParamList, 'AddProduct'>;

const CATEGORIES: Category[] = ['Şarküteri', 'Eczane', 'Diğer'];

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  'Şarküteri': { icon: 'restaurant-outline' , color: COLORS.deli },
  'Eczane':    { icon: 'medkit-outline', color: COLORS.pharmacy },
  'Diğer':     { icon: 'cube-outline', color: COLORS.other },
};

// ── Open Food Facts API ──────────────────────────────────────────────────────
async function lookupBarcode(barcode: string): Promise<{ name: string; brand?: string } | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'RafOmrum/1.0' } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1) return null;
    const p = json.product;
    const name: string =
      p.product_name_tr || p.product_name || p.abbreviated_product_name || '';
    const brand: string = p.brands || '';
    if (!name) return null;
    return { name: name.trim(), brand: brand.trim() };
  } catch {
    return null;
  }
}

// ── Toast bileşeni ───────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface ToastState { message: string; type: ToastType; visible: boolean }

const Toast: React.FC<{ toast: ToastState }> = ({ toast }) => {
  if (!toast.visible) return null;
  const bg =
    toast.type === 'success' ? '#22c55e' :
    toast.type === 'error'   ? '#ef4444' : '#3b82f6';
  const icon =
    toast.type === 'success' ? 'checkmark-circle' :
    toast.type === 'error'   ? 'close-circle' : 'information-circle';
  return (
    <View style={[toastStyles.container, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={20} color="#fff" />
      <Text style={toastStyles.text}>{toast.message}</Text>
    </View>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 100, left: 24, right: 24,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 14, zIndex: 999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
});

// ── Ana bileşen ──────────────────────────────────────────────────────────────
const AddProductScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route      = useRoute<RoutePropType>();
  const { isPremium } = usePremium();
  const { onProductAdded } = useInterstitialAd(isPremium);
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();

  // Bug 1 Fix: productToEdit param'ı oku
  const productToEdit = route.params?.productToEdit;
  const isEditing     = !!productToEdit;

  const [name, setName]         = useState(productToEdit?.name ?? '');
  const [category, setCategory] = useState<Category>(productToEdit?.category ?? 'Şarküteri');
  const [date, setDate]         = useState(
    productToEdit
      ? new Date(productToEdit.expirationDate)
      : new Date(Date.now() + 86400000 * 3)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [scannedBarcode, setScannedBarcode] = useState(productToEdit?.barcode ?? '');
  const [isScanning, setIsScanning]         = useState(false);
  const [isLookingUp, setIsLookingUp]       = useState(false);
  const [permission, requestPermission]     = useCameraPermissions();

  // Çift-tarama koruması
  const isProcessingRef = useRef(false);

  // Toast
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }, []);

  const addDuration = (amount: number, unit: 'week' | 'month' | 'year') => {
    const newDate = new Date();
    if (unit === 'week') newDate.setDate(newDate.getDate() + amount * 7);
    else if (unit === 'month') newDate.setMonth(newDate.getMonth() + amount);
    else if (unit === 'year') newDate.setFullYear(newDate.getFullYear() + amount);
    setDate(newDate);
    showToast(`Tarih güncellendi: ${formatDate(newDate, undefined, currentLanguage)}`, 'info');
  };

  // Tarayıcı köşe animasyonu
  const scanAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
      scanAnim.setValue(0);
    }
  }, [isScanning]);

  const scanLineTranslate = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });

  // ── Barkod tarandı ──────────────────────────────────────────────────────
  const handleBarcodeScanned = useCallback(async ({ data }: { type: string; data: string }) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsScanning(false);

    setScannedBarcode(data);
    setIsLookingUp(true);

    try {
      const cached = await getBarcodeInfo(data);
      if (cached) {
        setName(cached.name);
        setCategory(cached.category);
        showToast(`✅ Ürün bulundu: ${cached.name}`, 'success');
        setIsLookingUp(false);
        setTimeout(() => { isProcessingRef.current = false; }, 1500);
        return;
      }

      const result = await lookupBarcode(data);
      if (result) {
        const productName = result.brand ? `${result.brand} ${result.name}` : result.name;
        setName(productName);
        await saveBarcodeInfo(data, { name: productName, category, brand: result.brand });
        showToast(`🎉 Ürün tanındı: ${productName}`, 'success');
      } else {
        showToast('Yeni barkod — ürün adını siz girin, bir dahaki sefere hatırlayacağız.', 'info');
      }
    } catch {
      showToast('Barkod sorgulanırken hata oluştu.', 'error');
    } finally {
      setIsLookingUp(false);
      setTimeout(() => { isProcessingRef.current = false; }, 1500);
    }
  }, [category, showToast]);

  // ── Kamera aç ───────────────────────────────────────────────────────────
  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('İzin Reddedildi', 'Kamera izni olmadan barkod tarayamazsınız.');
        return;
      }
    }
    isProcessingRef.current = false;
    setIsScanning(true);
  };

  // ── Kaydet ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (name.trim() === '') {
      Alert.alert('Eksik Bilgi', 'Lütfen ürün adı giriniz.');
      return;
    }

    const product = {
      // Bug 1 Fix: düzenleme modunda orijinal id ve createdAt korunur
      id:             isEditing ? productToEdit!.id        : Date.now().toString(),
      createdAt:      isEditing ? productToEdit!.createdAt : new Date().toISOString(),
      name:           name.trim(),
      category,
      expirationDate: date.toISOString().split('T')[0],
      barcode:        scannedBarcode || undefined,
    };

    if (scannedBarcode) {
      await saveBarcodeInfo(scannedBarcode, { name: product.name, category: product.category });
    }
    await saveProduct(product);
    await scheduleExpirationNotification(product.id, product.name, product.expirationDate);

    if (!isEditing) {
      await onProductAdded(); // interstitial sadece yeni ürün eklemede
      
      // In-App Review Trigger
      try {
        await incrementActionCount();
        setTimeout(() => requestReviewIfAppropriate(true), 1500);
      } catch (e) {
        console.error('In-app review err:', e);
      }
    }
    navigation.goBack();
  };

  // Bug 2 Fix: minimum tarih string (web için)
  const todayString = new Date().toISOString().split('T')[0];

  const onDateChange = (_: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Ürün Adı */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.secondary }]}>Ürün Adı</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Ionicons name="pricetag-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Örn: Aspirin, Kaşar Peyniri"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                maxLength={60}
              />
              <TouchableOpacity style={styles.scanButton} onPress={openScanner} activeOpacity={0.7}>
                {isLookingUp
                  ? <ActivityIndicator size="small" color={COLORS.primary} />
                  : <Ionicons name="barcode-outline" size={24} color={COLORS.primary} />
                }
              </TouchableOpacity>
            </View>
            {scannedBarcode ? (
              <View style={styles.barcodeTag}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                <Text style={[styles.barcodeHintText, { color: COLORS.primary }]}>Barkod: {scannedBarcode}</Text>
              </View>
            ) : null}
          </View>

          {/* Kategori */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.secondary }]}>Kategori</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const isActive = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBtn, 
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, 
                      isActive && { backgroundColor: config.color + '15', borderColor: config.color }
                    ]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={config.icon as any} 
                      size={20} 
                      color={isActive ? config.color : colors.textLight} 
                    />
                    <Text style={[
                      styles.categoryBtnText, 
                      { color: colors.textLight }, 
                      isActive && { color: config.color, fontWeight: '800' }
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tarih */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.secondary }]}>Son Kullanma Tarihi</Text>
            {Platform.OS === 'web' ? (
              <View style={[styles.inputContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  {...({ type: 'date', min: todayString } as any)}
                  style={[styles.datePickerBtnWeb, { color: colors.text }]}
                  value={date.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    if (text) { const d = new Date(text); if (!isNaN(d.getTime())) setDate(d); }
                  }}
                />
              </View>
            ) : Platform.OS === 'android' ? (
              <TouchableOpacity style={[styles.inputContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' }, currentLanguage)}</Text>
              </TouchableOpacity>
            ) : null}
            {Platform.OS !== 'web' && (showDatePicker || Platform.OS === 'ios') && (
              <View style={Platform.OS === 'ios' ? [styles.iosDatePickerContainer, { backgroundColor: colors.surfaceAlt }] : undefined}>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  accentColor={COLORS.primary}
                />
              </View>
            )}

            {/* Hızlı Seçim Butonları */}
            <View style={styles.quickDateContainer}>
              <QuickDateBtn label="+1 Hafta" onPress={() => addDuration(1, 'week')} />
              <QuickDateBtn label="+1 Ay"    onPress={() => addDuration(1, 'month')} />
              <QuickDateBtn label="+6 Ay"    onPress={() => addDuration(6, 'month')} />
              <QuickDateBtn label="+1 Yıl"   onPress={() => addDuration(1, 'year')} />
            </View>
          </View>
        </View>

        {/* Kaydet butonu */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Güncelle' : 'Kaydet'}</Text>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.surface} />
        </TouchableOpacity>
      </ScrollView>

      {/* Toast */}
      <Toast toast={toast} />

      {/* Kamera Modal */}
      <Modal visible={isScanning} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.cameraModalContainer}>
          {/* Başlık */}
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>Barkod Tara</Text>
            <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {isScanning && (
            <CameraView
              style={styles.cameraArea}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'qr', 'upc_a', 'upc_e', 'code128', 'code39'],
              }}
            >
              {/* Karanlık overlay */}
              <View style={styles.overlayTop} />
              <View style={styles.overlayRow}>
                <View style={styles.overlaySide} />
                {/* Tarama çerçevesi */}
                <View style={styles.scanFrame}>
                  {/* Köşe imleri */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  {/* Tarama çizgisi */}
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.scanHint}>Barkodu çerçeveye hizalayın</Text>
              </View>
            </CameraView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ── Yardımcı Bileşenler ──────────────────────────────────────────────────────
const QuickDateBtn: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.quickDateBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.quickDateText, { color: colors.secondary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const CORNER_SIZE      = 24;
const CORNER_THICKNESS = 3;
const FRAME_WIDTH      = 260;
const FRAME_HEIGHT     = 160;

const styles = StyleSheet.create({
  safeArea:  { flex: 1 },
  container: { padding: SIZES.md },
  card: {
    borderRadius: SIZES.radius + 4,
    padding: SIZES.lg,
    ...Platform.select({
      ios:     { shadowColor: '#1E293B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 8px 24px rgba(30, 41, 59, 0.06)' },
    }),
  },
  inputGroup:     { marginBottom: SIZES.xl },
  label:          { fontSize: 15, fontWeight: '700', marginBottom: SIZES.sm, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: SIZES.radius,
    borderWidth: 1, overflow: 'hidden',
  },
  inputIcon:   { marginLeft: SIZES.md, marginRight: 8 },
  input:       { flex: 1, paddingVertical: 16, paddingRight: SIZES.md, fontSize: 16, fontWeight: '500' },
  scanButton:  { padding: 12, borderLeftWidth: 1, borderLeftColor: COLORS.border, backgroundColor: COLORS.surfaceAlt, minWidth: 48, alignItems: 'center' },
  barcodeTag:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginLeft: 4 },
  barcodeHintText: { fontSize: 12, fontWeight: '600' },

  categoryContainer: { flexDirection: 'row', gap: 12 },
  categoryBtn: {
    flex: 1, paddingVertical: 12,
    borderRadius: 16, alignItems: 'center', borderWidth: 1.5,
    gap: 6,
  },
  categoryBtnText: { color: COLORS.textLight, fontWeight: '600', fontSize: 13 },

  datePickerBtnWeb: {
    flex: 1, paddingVertical: 14, paddingRight: SIZES.md,
    fontSize: 16, borderWidth: 0, backgroundColor: 'transparent', fontWeight: '500',
  },
  dateText: { flex: 1, paddingVertical: 16, fontSize: 16, fontWeight: '600' },
  iosDatePickerContainer: {
    marginTop: SIZES.sm, backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radius, overflow: 'hidden', padding: 10,
  },
  quickDateContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginTop: SIZES.md 
  },
  quickDateBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12, 
    borderWidth: 1 
  },
  quickDateText: { fontSize: 13, fontWeight: '700' },


  saveBtn: {
    flexDirection: 'row', backgroundColor: COLORS.primary,
    paddingVertical: 16, borderRadius: SIZES.radius,
    alignItems: 'center', justifyContent: 'center', marginTop: SIZES.md, gap: 8,
    ...Platform.select({
      ios:     { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
      web:     { boxShadow: `0 8px 20px ${COLORS.primary}50` },
    }),
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

  // ── Kamera modal ────────────────────────────────────────────────────────
  cameraModalContainer: { flex: 1, backgroundColor: '#000' },
  cameraHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SIZES.lg,
    paddingTop: Platform.OS === 'android' ? SIZES.xl : SIZES.md,
    position: 'absolute', top: 0, width: '100%', zIndex: 10,
  },
  cameraTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn:    { padding: 4 },
  cameraArea:  { flex: 1 },

  overlayTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayRow:    { flexDirection: 'row' },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: 20 },
  scanHint:      { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },

  scanFrame: {
    width: FRAME_WIDTH, height: FRAME_HEIGHT,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: '#4ade80',
  },
  cornerTL: { top: 0,    left: 0,   borderTopWidth:    CORNER_THICKNESS, borderLeftWidth:  CORNER_THICKNESS, borderTopLeftRadius:     4 },
  cornerTR: { top: 0,    right: 0,  borderTopWidth:    CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius:    4 },
  cornerBL: { bottom: 0, left: 0,   borderBottomWidth: CORNER_THICKNESS, borderLeftWidth:  CORNER_THICKNESS, borderBottomLeftRadius:  4 },
  cornerBR: { bottom: 0, right: 0,  borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },

  scanLine: {
    position: 'absolute', left: 8, right: 8, height: 2,
    backgroundColor: '#4ade80',
    borderRadius: 1,
    opacity: 0.85,
    ...Platform.select({
      ios:     { shadowColor: '#4ade80', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
});

export default AddProductScreen;
