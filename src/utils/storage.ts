import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { cancelNotificationsForProduct } from './notifications';

const STORAGE_KEY = '@raf_omrum_products';

/** Raw (unsorted) read — internal use only */
const getRawProducts = async (): Promise<Product[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading products', e);
    return [];
  }
};

export const getProducts = async (): Promise<Product[]> => {
  const products = await getRawProducts();
  // Sort products by closest expiration date
  return products.sort((a, b) => {
    const dateA = new Date(a.expirationDate).getTime();
    const dateB = new Date(b.expirationDate).getTime();
    return dateA - dateB;
  });
};

export const saveProduct = async (product: Product): Promise<boolean> => {
  try {
    const products = await getRawProducts();
    if (!Array.isArray(products)) {
      console.warn('Storage corrupted, resetting products list');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([product]));
      return true;
    }
    
    // Check if updating or adding new
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (e) {
    console.error('Error saving product', e);
    return false;
  }
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    // Bildirimleri iptal et
    await cancelNotificationsForProduct(id);

    const products = await getProducts();
    const newProducts = products.filter(p => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
    return true;
  } catch (e) {
    console.error('Error deleting product', e);
    return false;
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
