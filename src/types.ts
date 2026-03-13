export type Category = 'Şarküteri' | 'Eczane' | 'Diğer';

export interface Product {
  id: string;
  name: string;
  category: Category;
  expirationDate: string; // ISO format (YYYY-MM-DD)
  createdAt: string; 
  notes?: string;
}

export type RootStackParamList = {
  Home: undefined;
  AddProduct: { productToEdit?: Product };
  ProductDetails: { product: Product };
};
