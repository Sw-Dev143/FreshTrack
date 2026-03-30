import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ShoppingItem {
  id: string;
  productName: string;
  category: string;
  addedAt: string;
  checked: boolean;
}

const SHOPPING_KEY = '@raf_omrum_shopping';

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
  try {
    const json = await AsyncStorage.getItem(SHOPPING_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const saveShoppingList = async (items: ShoppingItem[]): Promise<void> => {
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(items));
};

export const addToShoppingList = async (
  productName: string,
  category: string
): Promise<ShoppingItem> => {
  const items = await getShoppingList();
  // Aynı ürün zaten varsa tekrar ekleme
  const exists = items.find(i => i.productName === productName);
  if (exists) return exists;
  const newItem: ShoppingItem = {
    id: Date.now().toString(),
    productName,
    category,
    addedAt: new Date().toISOString(),
    checked: false,
  };
  await saveShoppingList([...items, newItem]);
  return newItem;
};

export const toggleShoppingItem = async (id: string): Promise<void> => {
  const items = await getShoppingList();
  await saveShoppingList(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
};

export const removeFromShoppingList = async (id: string): Promise<void> => {
  const items = await getShoppingList();
  await saveShoppingList(items.filter(i => i.id !== id));
};

export const clearShoppingList = async (): Promise<void> => {
  await AsyncStorage.removeItem(SHOPPING_KEY);
};
