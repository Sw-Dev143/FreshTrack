import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView,  } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SIZES } from '../theme';
import {
  CustomCategory, getCategories, addCategory,
  updateCategory, deleteCategory,
} from '../utils/categories';

const ICON_OPTIONS = [
  'restaurant-outline', 'medkit-outline', 'cube-outline', 'cart-outline',
  'home-outline', 'pricetag-outline', 'nutrition-outline', 'wine-outline',
  'cafe-outline', 'ice-cream-outline', 'fast-food-outline', 'fish-outline',
  'leaf-outline', 'rose-outline', 'bandage-outline', 'flask-outline',
  'beer-outline', 'basket-outline', 'bag-outline', 'archive-outline',
];

const COLOR_OPTIONS = [
  '#F97316', '#8B5CF6', '#64748B', '#10B981', '#3B82F6',
  '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16',
  '#6366F1', '#14B8A6', '#F43F5E', '#A855F7', '#0EA5E9',
];

const ManageCategoriesScreen: React.FC = () => {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CustomCategory | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  const load = async () => {
    setCategories(await getCategories());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const openAdd = () => {
    setEditing(null);
    setName('');
    setSelectedIcon(ICON_OPTIONS[0]);
    setSelectedColor(COLOR_OPTIONS[0]);
    setModalVisible(true);
  };

  const openEdit = (cat: CustomCategory) => {
    if (cat.isDefault) {
      Alert.alert('Varsayılan Kategori', 'Varsayılan kategoriler düzenlenemez.');
      return;
    }
    setEditing(cat);
    setName(cat.name);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Hata', 'Kategori adı boş olamaz.');
      return;
    }
    if (editing) {
      await updateCategory({ ...editing, name: trimmed, icon: selectedIcon, color: selectedColor });
    } else {
      await addCategory({ name: trimmed, icon: selectedIcon, color: selectedColor });
    }
    setModalVisible(false);
    load();
  };

  const handleDelete = (cat: CustomCategory) => {
    if (cat.isDefault) {
      Alert.alert('Varsayılan Kategori', 'Varsayılan kategoriler silinemez.');
      return;
    }
    Alert.alert(
      'Kategoriyi Sil',
      `"${cat.name}" kategorisini silmek istiyor musunuz? Bu kategorideki ürünler etkilenmez.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => { await deleteCategory(cat.id); load(); },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.hint, { color: colors.textLight }]}>
            Varsayılan kategoriler düzenlenemez. Özel kategoriler ekleyebilir, düzenleyebilir veya silebilirsiniz.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={[styles.catName, { color: colors.text }]}>{item.name}</Text>
            {item.isDefault
              ? <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Varsayılan</Text></View>
              : (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )
            }
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.primary }]} onPress={openAdd}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Yeni Kategori Ekle</Text>
          </TouchableOpacity>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.secondary }]}>
              {editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textLight }]}>Kategori Adı</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Dondurmalar, Konserveler..."
              placeholderTextColor={colors.textMuted}
              maxLength={30}
            />

            <Text style={[styles.fieldLabel, { color: colors.textLight }]}>İkon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
              {ICON_OPTIONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    { backgroundColor: colors.surfaceAlt },
                    selectedIcon === icon && { backgroundColor: selectedColor + '25', borderColor: selectedColor, borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons name={icon as any} size={22} color={selectedIcon === icon ? selectedColor : colors.textLight} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textLight }]}>Renk</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorDotSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <View style={[styles.preview, { backgroundColor: selectedColor + '15', borderColor: selectedColor }]}>
              <Ionicons name={selectedIcon as any} size={20} color={selectedColor} />
              <Text style={[styles.previewText, { color: selectedColor }]}>{name || 'Önizleme'}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textLight }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list:     { padding: SIZES.md, gap: 10 },
  hint:     { fontSize: 13, fontWeight: '500', marginBottom: 4, lineHeight: 19 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SIZES.md, borderRadius: SIZES.radius, borderWidth: 1,
  },
  iconBg:    { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  catName:   { flex: 1, fontSize: 16, fontWeight: '700' },
  actions:   { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  defaultBadge: {
    backgroundColor: '#64748B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  addBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    padding: SIZES.md, borderRadius: SIZES.radius, marginTop: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.lg, paddingBottom: 40, gap: 12 },
  modalTitle:   { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  fieldLabel:   { fontSize: 13, fontWeight: '700' },
  textInput: {
    borderWidth: 1, borderRadius: SIZES.radius, padding: 12,
    fontSize: 15, fontWeight: '600',
  },
  iconScroll: { marginVertical: 4 },
  iconOption: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  colorDotSelected: { transform: [{ scale: 1.2 }] },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1.5, marginTop: 4,
  },
  previewText: { fontWeight: '800', fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: {
    flex: 1, padding: 14, borderRadius: SIZES.radius,
    alignItems: 'center', borderWidth: 1,
  },
  modalBtnText: { fontWeight: '800', fontSize: 15 },
});

export default ManageCategoriesScreen;
