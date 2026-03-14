import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

const STORAGE_KEY = '@raf_omrum_products';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    const products: Product[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    // Sort products by closest expiration date
    return products.sort((a, b) => {
      const dateA = new Date(a.expirationDate).getTime();
      const dateB = new Date(b.expirationDate).getTime();
      return dateA - dateB;
    });
  } catch (e) {
    console.error('Error reading products', e);
    return [];
  }
};

export const saveProduct = async (product: Product): Promise<void> => {
  try {
    const products = await getProducts();
    // Check if updating or adding new
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving product', e);
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    // Bildirimleri iptal et
    const { cancelNotificationsForProduct } = await import('../utils/notifications');
    await cancelNotificationsForProduct(id);

    const products = await getProducts();
    const newProducts = products.filter(p => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
  } catch (e) {
    console.error('Error deleting product', e);
  }
};

export interface BarcodeInfo {
  name: string;
  category: import('../types').Category;
  brand?: string;
  imageUrl?: string;
}

const BARCODE_STORAGE_KEY = '@raf_omrum_barcodes';

export const getBarcodeInfo = async (barcode: string): Promise<BarcodeInfo | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(BARCODE_STORAGE_KEY);
    const memory = jsonValue != null ? JSON.parse(jsonValue) : {};
    return memory[barcode] || null;
  } catch (e) {
    return null;
  }
};

export const saveBarcodeInfo = async (barcode: string, info: BarcodeInfo): Promise<void> => {
  try {
    const jsonValue = await AsyncStorage.getItem(BARCODE_STORAGE_KEY);
    const memory = jsonValue != null ? JSON.parse(jsonValue) : {};
    memory[barcode] = info;
    await AsyncStorage.setItem(BARCODE_STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('Error saving barcode info', e);
  }
};
