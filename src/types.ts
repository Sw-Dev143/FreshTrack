export type Category = 'Şarküteri' | 'Eczane' | 'Diğer';

export interface Product {
  id: string;
  name: string;
  category: Category;
  expirationDate: string; // ISO format (YYYY-MM-DD)
  createdAt: string; 
  notes?: string;
  barcode?: string;
}

export type RootStackParamList = {
  Home: undefined;
  AddProduct: { productToEdit?: import('./types').Product | undefined } | undefined;
  ProductDetails: { product: import('./types').Product };
  Paywall: undefined;
};
