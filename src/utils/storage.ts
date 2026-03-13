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
    const products = await getProducts();
    const newProducts = products.filter(p => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
  } catch (e) {
    console.error('Error deleting product', e);
  }
};
