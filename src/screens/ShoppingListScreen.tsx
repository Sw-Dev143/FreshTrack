import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Share, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SIZES } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ShoppingItem, getShoppingList,
  addToShoppingList, toggleShoppingItem,
  removeFromShoppingList, clearShoppingList,
  clearCheckedItems,
} from '../utils/shoppingList';

const ShoppingListScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('other');

  const load = async () => setItems(await getShoppingList());

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert(t('common.error'), t('add.validation.noNameSubtitle'));
      return;
    }
    await addToShoppingList(newItemName.trim(), newItemCategory);
    setNewItemName('');
    load();
  };

  const handleToggle = async (id: string) => {
    await toggleShoppingItem(id);
    load();
  };

  const handleRemove = async (id: string) => {
    await removeFromShoppingList(id);
    load();
  };

  const handleClearChecked = async () => {
    await clearCheckedItems();
    load();
  };

  const handleShare = async () => {
    if (items.length === 0) {
      Alert.alert(t('shopping.alert.emptyList'), t('shopping.alert.shareEmpty'));
      return;
    }
    const lines = items.map(i => `${i.checked ? '✅' : '⬜'} ${i.productName} (${i.category})`);
    await Share.share({
      title: `Shopping List — FreshTrack`,
      message: `${t('shopping.shareTitle')}\n\n${lines.join('\n')}`,
    });
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    Alert.alert(
      t('shopping.alert.clearTitle'),
      t('shopping.alert.clearMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => { await clearShoppingList(); load(); },
        },
      ]
    );
  };

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Action Bar */}
        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.countText, { color: colors.textLight }]}>
            {checkedCount}/{items.length} {t('shopping.action.completed')}
          </Text>
          <View style={styles.barBtns}>
            {checkedCount > 0 && (
              <TouchableOpacity style={styles.barBtn} onPress={handleClearChecked}>
                <Ionicons name="checkmark-done-outline" size={18} color={COLORS.safe} />
                <Text style={[styles.barBtnText, { color: COLORS.safe }]}>{t('shopping.action.clearChecked')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.barBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={COLORS.primary} />
              <Text style={[styles.barBtnText, { color: COLORS.primary }]}>{t('shopping.action.share')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.barBtn} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual Item Input */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputField, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              placeholder={t('shopping.addPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={newItemName}
              onChangeText={setNewItemName}
              maxLength={50}
            />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.primary }]} onPress={handleAddItem} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>{t('shopping.addBtn')}</Text>
              <Ionicons name="add-circle-outline" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.catRow}>
            {['deli', 'pharmacy', 'other'].map(cat => {
              const isActive = newItemCategory === cat;
              const config = {
                deli: { icon: 'restaurant-outline', color: COLORS.deli },
                pharmacy: { icon: 'medkit-outline', color: COLORS.pharmacy },
                other: { icon: 'cube-outline', color: COLORS.other },
              }[cat as 'deli' | 'pharmacy' | 'other'];
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catBtn,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    isActive && { backgroundColor: config.color + '15', borderColor: config.color }
                  ]}
                  onPress={() => setNewItemCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={config.icon as any} 
                    size={14} 
                    color={isActive ? config.color : colors.textLight} 
                  />
                  <Text style={[
                    styles.catBtnText, 
                    { color: colors.textLight }, 
                    isActive && { color: config.color, fontWeight: '800' }
                  ]}>
                    {t(`categories.${cat}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
                <Text style={[styles.itemCat, { color: colors.textLight }]}>
                  {['deli', 'pharmacy', 'other'].includes(item.category.toLowerCase())
                    ? t(`categories.${item.category.toLowerCase()}`)
                    : item.category}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
                <Ionicons name="close" size={18} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconRing, { backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.emptyIconInner, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="cart-outline" size={42} color={COLORS.primary} />
                </View>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('shopping.empty.title')}</Text>
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                {t('shopping.empty.subtitle')}
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
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

  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 80, paddingHorizontal: SIZES.xl },
  emptyIconRing: {
    width: 108, height: 108, borderRadius: 54,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  emptyIconInner: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginBottom: SIZES.sm, textAlign: 'center' },
  emptyText:  { fontSize: 15, textAlign: 'center', fontWeight: '500', lineHeight: 22 },

  // Manual Input Styles
  inputCard: {
    padding: SIZES.md,
    borderBottomWidth: 1,
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputField: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  addBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  catRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  catBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ShoppingListScreen;
