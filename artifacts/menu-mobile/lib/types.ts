export type Plan = 'free' | 'pro' | 'enterprise';
export type UserRole = 'admin' | 'restaurant';

export interface MenuItemExtra {
  name: string;
  price: number;
}

export interface RestaurantRow {
  id: string;
  owner_id: string;
  name: string;
  name_en: string | null;
  logo: string | null;
  cover_color: string | null;
  description: string | null;
  plan: Plan;
  tables_count: number;
  is_active: boolean;
  currency: string;
  language: 'ar' | 'en';
  created_at: string;
}

export interface CategoryRow {
  id: string;
  restaurant_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface MenuItemRow {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  name_en: string | null;
  description: string | null;
  price: number;
  image: string | null;
  is_popular: boolean;
  is_available: boolean;
  extras: MenuItemExtra[] | null;
  sort_order: number;
  created_at: string;
}
