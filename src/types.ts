export type Category = string; // Artık dinamik (özel kategoriler desteklenir)

// 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DoseTime {
  hour: number;   // 0-23
  minute: number; // 0-59
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;        // "500 mg", "1 tablet" vb.
  days: DayOfWeek[];     // boş array = her gün
  times: DoseTime[];     // günde kaç doz
  notes?: string;
  color: string;         // hex renk
  active: boolean;
  createdAt: string;
}

export interface DoseLog {
  medicationId: string;
  date: string;          // YYYY-MM-DD
  hour: number;
  minute: number;
  takenAt: string | null; // null = henüz alınmadı
}

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
  Onboarding: undefined;
  Home: undefined;
  AddProduct: { productToEdit?: import('./types').Product | undefined } | undefined;
  ProductDetails: { product: import('./types').Product };
  Paywall: undefined;
  Medications: undefined;
  AddMedication: { medicationToEdit?: import('./types').Medication } | undefined;
  MedicationStats: undefined;
  ManageCategories: undefined;
  ShoppingList: undefined;
  Calendar: undefined;
  Settings: undefined;
};
