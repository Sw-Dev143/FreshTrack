import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, Platform, Alert, Modal,
  ActivityIndicator, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Category, RootStackParamList } from '../types';
import { saveProduct, getBarcodeInfo, saveBarcodeInfo } from '../utils/storage';
import { scheduleExpirationNotification } from '../utils/notifications';
import { usePremium } from '../context/PremiumContext';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { COLORS, SIZES } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;

const CATEGORIES: Category[] = ['Şarküteri', 'Eczane', 'Diğer'];

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
    // Önce Türkçe isim, yoksa genel isim
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
  const { isPremium } = usePremium();
  const { onProductAdded } = useInterstitialAd(isPremium);

  const [name, setName]         = useState('');
  const [category, setCategory] = useState<Category>('Şarküteri');
  const [date, setDate]         = useState(new Date(Date.now() + 86400000 * 3));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [scannedBarcode, setScannedBarcode] = useState('');
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
    if (isProcessingRef.current) return;      // çift tarama engeli
    isProcessingRef.current = true;
    setIsScanning(false);

    setScannedBarcode(data);
    setIsLookingUp(true);

    try {
      // 1) Önce local cache'e bak
      const cached = await getBarcodeInfo(data);
      if (cached) {
        setName(cached.name);
        setCategory(cached.category);
        showToast(`✅ Ürün bulundu: ${cached.name}`, 'success');
        setIsLookingUp(false);
        // kısa geciktirme sonrası bayrağı serbest bırak
        setTimeout(() => { isProcessingRef.current = false; }, 1500);
        return;
      }

      // 2) Open Food Facts API
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
    const newProduct = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      expirationDate: date.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      barcode: scannedBarcode || undefined,
    };
    if (scannedBarcode) {
      await saveBarcodeInfo(scannedBarcode, { name: newProduct.name, category: newProduct.category });
    }
    await saveProduct(newProduct);
    await scheduleExpirationNotification(newProduct.id, newProduct.name, newProduct.expirationDate);
    await onProductAdded(); // interstitial sayacını artır
    navigation.goBack();
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.card}>
          {/* Ürün Adı */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ürün Adı</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: Aspirin, Kaşar Peyniri"
                placeholderTextColor="#94A3B8"
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
                <Text style={styles.barcodeHintText}>Barkod: {scannedBarcode}</Text>
              </View>
            ) : null}
          </View>

          {/* Kategori */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryBtnText, category === cat && styles.categoryBtnTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tarih */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Son Kullanma Tarihi</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  {...({ type: 'date' } as any)}
                  style={styles.datePickerBtnWeb}
                  value={date.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    if (text) { const d = new Date(text); if (!isNaN(d.getTime())) setDate(d); }
                  }}
                />
              </View>
            ) : Platform.OS === 'android' ? (
              <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={styles.dateText}>{date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </TouchableOpacity>
            ) : null}
            {Platform.OS !== 'web' && (showDatePicker || Platform.OS === 'ios') && (
              <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : undefined}>
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
          </View>
        </View>

        {/* Kaydet butonu */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>Kaydet</Text>
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

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 160;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.md },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius + 4,
    padding: SIZES.lg,
    ...Platform.select({
      ios:     { shadowColor: '#1E293B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 8px 24px rgba(30, 41, 59, 0.06)' },
    }),
  },
  inputGroup: { marginBottom: SIZES.xl },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.secondary, marginBottom: SIZES.sm, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden',
  },
  inputIcon: { marginLeft: SIZES.md, marginRight: 8 },
  input: { flex: 1, paddingVertical: 16, paddingRight: SIZES.md, fontSize: 16, color: '#0F172A', fontWeight: '500' },
  scanButton: { padding: 12, borderLeftWidth: 1, borderLeftColor: '#E2E8F0', backgroundColor: '#F1F5F9', minWidth: 48, alignItems: 'center' },
  barcodeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginLeft: 4 },
  barcodeHintText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  categoryContainer: { flexDirection: 'row', gap: 12 },
  categoryBtn: {
    flex: 1, backgroundColor: '#F8FAFC', paddingVertical: 14,
    borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  categoryBtnActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
    ...Platform.select({
      ios:     { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web:     { boxShadow: `0 4px 12px ${COLORS.primary}40` },
    }),
  },
  categoryBtnText: { color: COLORS.textLight, fontWeight: '600', fontSize: 14 },
  categoryBtnTextActive: { color: COLORS.surface, fontWeight: '800' },
  datePickerBtnWeb: {
    flex: 1, paddingVertical: 14, paddingRight: SIZES.md,
    fontSize: 16, borderWidth: 0, backgroundColor: 'transparent', color: '#0F172A', fontWeight: '500',
  },
  dateText: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#0F172A', fontWeight: '600' },
  iosDatePickerContainer: {
    marginTop: SIZES.sm, backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radius, overflow: 'hidden', padding: 10,
  },
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
  saveBtnText: { color: COLORS.surface, fontSize: 18, fontWeight: '800' },

  // ── Kamera modal ────────────────────────────────────────────────────────
  cameraModalContainer: { flex: 1, backgroundColor: '#000' },
  cameraHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SIZES.lg,
    paddingTop: Platform.OS === 'android' ? SIZES.xl : SIZES.md,
    position: 'absolute', top: 0, width: '100%', zIndex: 10,
  },
  cameraTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  cameraArea: { flex: 1 },

  // overlay parçaları
  overlayTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayRow:    { flexDirection: 'row' },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: 20 },
  scanHint:      { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },

  // tarama çerçevesi
  scanFrame: {
    width: FRAME_WIDTH, height: FRAME_HEIGHT,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },

  // köşe imleri
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: '#4ade80',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },

  // tarama çizgisi
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
