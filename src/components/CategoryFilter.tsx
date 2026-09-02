import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Category } from '../types';
import { COLORS, SIZES } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface CategoryFilterProps {
  categories: (Category | 'all')[];
  selectedCategory: Category | 'all';
  onSelect: (category: Category | 'all') => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'all':      '🍽️',
  'deli':     '🥩',
  'pharmacy': '💊',
  'other':    '📦',
};

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelect }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const getLabel = (cat: string) => {
    if (cat === 'all') return t('home.filter.all');
    return t(`categories.${cat.toLowerCase()}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          const emoji = CATEGORY_EMOJIS[category.toLowerCase()] ?? '📦';
          
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: isSelected ? COLORS.primary : colors.surface,
                  borderColor: isSelected ? COLORS.primary : colors.border + '60'
                },
                isSelected && styles.filterButtonSelected,
              ]}
              onPress={() => onSelect(category)}
              activeOpacity={0.85}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
              <Text
                style={[
                  styles.filterText,
                  { color: isSelected ? '#FFFFFF' : colors.textLight },
                  isSelected && styles.filterTextSelected,
                ]}
              >
                {getLabel(category)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.sm,
  },
  scrollContent: {
    paddingHorizontal: SIZES.md,
    gap: 10,
    paddingVertical: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      ios:     { shadowColor: '#5F5DEC', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  filterButtonSelected: {
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      ios:     { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  emojiText: { fontSize: 15 },
  filterText:         { fontSize: 13, fontWeight: '600' },
  filterTextSelected: { color: '#FFFFFF', fontWeight: '800' },
});

export default CategoryFilter;
