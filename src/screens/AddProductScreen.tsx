import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Category, RootStackParamList } from '../types';
import { saveProduct } from '../utils/storage';
import { scheduleExpirationNotification } from '../utils/notifications';
import { COLORS, SIZES } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;

const CATEGORIES: Category[] = ['Şarküteri', 'Eczane', 'Diğer'];

const AddProductScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Şarküteri');
  const [date, setDate] = useState(new Date(Date.now() + 86400000 * 3)); // Default 3 days from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const handleSave = async () => {
    if (name.trim() === '') {
      alert('Lütfen ürün adı giriniz.');
      return;
    }

    const newProduct = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      expirationDate: date.toISOString().split('T')[0], // YYYY-MM-DD
      createdAt: new Date().toISOString(),
    };

    await saveProduct(newProduct);
    await scheduleExpirationNotification(newProduct.name, newProduct.expirationDate);
    navigation.goBack();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.card}>
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
                maxLength={40}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    category === cat && styles.categoryBtnActive
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.categoryBtnText,
                    category === cat && styles.categoryBtnTextActive
                  ]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
                    if (text) {
                      const newDate = new Date(text);
                      if (!isNaN(newDate.getTime())) {
                        setDate(newDate);
                      }
                    }
                  }}
                />
              </View>
            ) : Platform.OS === 'android' ? (
              <TouchableOpacity 
                style={styles.inputContainer} 
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={styles.dateText}>{date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </TouchableOpacity>
            ) : null}
            
            {Platform.OS !== 'web' && (showDatePicker || Platform.OS === 'ios') && (
              <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : null}>
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

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>Kaydet</Text>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.surface} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius + 4,
    padding: SIZES.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 8px 24px rgba(30, 41, 59, 0.06)',
      }
    }),
  },
  inputGroup: {
    marginBottom: SIZES.xl,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SIZES.sm,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  inputIcon: {
    marginLeft: SIZES.md,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: SIZES.md,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 12px ${COLORS.primary}40`,
      }
    }),
  },
  categoryBtnText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryBtnTextActive: {
    color: COLORS.surface,
    fontWeight: '800',
  },
  datePickerBtnWeb: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: SIZES.md,
    fontSize: 16,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: '#0F172A',
    fontWeight: '500',
  },
  dateText: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  iosDatePickerContainer: {
    marginTop: SIZES.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    padding: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.md,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: `0 8px 20px ${COLORS.primary}50`,
      }
    }),
  },
  saveBtnText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '800',
  },
});

export default AddProductScreen;
