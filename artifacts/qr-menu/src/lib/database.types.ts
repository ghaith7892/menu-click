export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered";
export type UserRole = "admin" | "restaurant";
export type Plan = "free" | "pro" | "enterprise";

export interface MenuItemExtra { name: string; price: number }

export interface OrderItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  extras?: string[];
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
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
  category_id: string;
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

export interface OrderRow {
  id: string;
  restaurant_id: string;
  table_number: number;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  customer_note: string | null;
  created_at: string;
}
