import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, Alert, Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SIZES } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ShoppingItem, getShoppingList,
  addToShoppingList, toggleShoppingItem,
  removeFromShoppingList, clearShoppingList,
  saveShoppingList, // Added this export if needed or just use clear/save
} from '../utils/shoppingList';

const ShoppingListScreen: React.FC = () => {
  const { colors } = useTheme();
  const [items, setItems] = useState<ShoppingItem[]>([]);

  const load = async () => setItems(await getShoppingList());

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleToggle = async (id: string) => {
    await toggleShoppingItem(id);
    load();
  };

  const handleRemove = async (id: string) => {
    await removeFromShoppingList(id);
    load();
  };

  const handleClearChecked = async () => {
    const unchecked = items.filter(i => !i.checked);
    await AsyncStorage.setItem('@raf_omrum_shopping', JSON.stringify(unchecked));
    load();
  };

  const handleShare = async () => {
    if (items.length === 0) {
      Alert.alert('Liste boş', 'Paylaşmak için alışveriş listesi dolu olmalı.');
      return;
    }
    const lines = items.map(i => `${i.checked ? '✅' : '⬜'} ${i.productName} (${i.category})`);
    await Share.share({
      title: 'Alışveriş Listesi — Raf Ömrüm',
      message: `🛒 Alışveriş Listesi\n\n${lines.join('\n')}`,
    });
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Listeyi Temizle',
      'Tüm alışveriş listesini silmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle', style: 'destructive',
          onPress: async () => { await clearShoppingList(); load(); },
        },
      ]
    );
  };

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.countText, { color: colors.textLight }]}>
          {checkedCount}/{items.length} tamamlandı
        </Text>
        <View style={styles.barBtns}>
          {checkedCount > 0 && (
            <TouchableOpacity style={styles.barBtn} onPress={handleClearChecked}>
              <Ionicons name="checkmark-done-outline" size={18} color={COLORS.safe} />
              <Text style={[styles.barBtnText, { color: COLORS.safe }]}>Tamamlananları Sil</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.barBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.barBtnText, { color: COLORS.primary }]}>Paylaş</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.barBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border },
            item.checked && styles.rowChecked,
          ]}>
            <TouchableOpacity onPress={() => handleToggle(item.id)} style={styles.checkbox}>
              <Ionicons
                name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={item.checked ? COLORS.safe : colors.textLight}
              />
            </TouchableOpacity>
            <View style={styles.itemInfo}>
              <Text style={[
                styles.itemName,
                { color: colors.text },
                item.checked && styles.itemNameChecked,
              ]}>
                {item.productName}
              </Text>
              <Text style={[styles.itemCat, { color: colors.textLight }]}>{item.category}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
              <Ionicons name="close" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.secondary }]}>Liste Boş</Text>
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              Ürün detay ekranından ürünleri alışveriş listesine ekleyebilirsiniz.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SIZES.md, borderBottomWidth: 1,
  },
  countText: { fontSize: 13, fontWeight: '700' },
  barBtns:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  barBtnText:{ fontSize: 12, fontWeight: '700' },

  list: { padding: SIZES.md, gap: 8, flexGrow: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SIZES.md, borderRadius: SIZES.radius, borderWidth: 1,
  },
  rowChecked: { opacity: 0.55 },
  checkbox:   { padding: 2 },
  itemInfo:   { flex: 1 },
  itemName:        { fontSize: 16, fontWeight: '700' },
  itemNameChecked: { textDecorationLine: 'line-through' },
  itemCat:         { fontSize: 12, fontWeight: '500', marginTop: 2 },
  removeBtn: { padding: 6 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12, paddingHorizontal: SIZES.xl },
  emptyTitle: { fontSize: 22, fontWeight: '900' },
  emptyText:  { fontSize: 14, textAlign: 'center', fontWeight: '500', lineHeight: 20 },
});

export default ShoppingListScreen;
