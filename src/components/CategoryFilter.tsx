import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Category } from '../types';
import { COLORS, SIZES } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface CategoryFilterProps {
  categories: (Category | 'Tümü')[];
  selectedCategory: Category | 'Tümü';
  onSelect: (category: Category | 'Tümü') => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelect }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                { backgroundColor: isSelected ? COLORS.primary : colors.surface },
                isSelected && styles.filterButtonSelected,
              ]}
              onPress={() => onSelect(category)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isSelected ? '#FFFFFF' : colors.textLight },
                  isSelected && styles.filterTextSelected,
                ]}
              >
                {category}
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
    marginBottom: SIZES.md + 4,
  },
  scrollContent: {
    paddingHorizontal: SIZES.md,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    ...Platform.select({
      ios:     { shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 2 },
      web:     { boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)' },
    }),
  },
  filterButtonSelected: {
    ...Platform.select({
      ios:     { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
      web:     { boxShadow: `0 4px 12px ${COLORS.primary}40` },
    }),
  },
  filterText:         { fontSize: 14, fontWeight: '600' },
  filterTextSelected: { color: '#FFFFFF', fontWeight: '800' },
});

export default CategoryFilter;
