import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;   // Ionicons icon name
  color: string;  // hex color
  isDefault?: boolean;
}

const CATEGORIES_KEY = '@raf_omrum_categories';

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'deli',     name: 'deli',     icon: 'restaurant-outline', color: '#F97316', isDefault: true },
  { id: 'pharmacy', name: 'pharmacy', icon: 'medkit-outline',     color: '#8B5CF6', isDefault: true },
  { id: 'other',    name: 'other',    icon: 'cube-outline',       color: '#64748B', isDefault: true },
];

export const getCategories = async (): Promise<CustomCategory[]> => {
  try {
    const json = await AsyncStorage.getItem(CATEGORIES_KEY);
    if (!json) {
      // İlk açılış: varsayılanları kaydet ve döndür
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(json);
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = async (categories: CustomCategory[]): Promise<void> => {
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const addCategory = async (cat: Omit<CustomCategory, 'id'>): Promise<CustomCategory> => {
  const categories = await getCategories();
  const newCat: CustomCategory = { ...cat, id: Date.now().toString() };
  await saveCategories([...categories, newCat]);
  return newCat;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categories = await getCategories();
  await saveCategories(categories.filter(c => c.id !== id));
};

export const updateCategory = async (updated: CustomCategory): Promise<void> => {
  const categories = await getCategories();
  await saveCategories(categories.map(c => c.id === updated.id ? updated : c));
};
