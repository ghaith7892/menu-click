import { supabase } from "./supabase";
import type { CategoryRow, MenuItemExtra, MenuItemRow, RestaurantRow } from "./database.types";

// ─── Restaurant ─────────────────────────────────────────────
export async function getRestaurantByOwner(ownerId: string): Promise<RestaurantRow | null> {
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", ownerId)
    .single();
  return (data as RestaurantRow | null);
}

export async function getRestaurantById(id: string): Promise<RestaurantRow | null> {
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();
  return (data as RestaurantRow | null);
}

export async function updateRestaurant(id: string, updates: Partial<RestaurantRow>) {
  const { data, error } = await supabase
    .from("restaurants")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  return { data: data as RestaurantRow | null, error };
}

// ─── Categories ─────────────────────────────────────────────
export async function getCategories(restaurantId: string): Promise<CategoryRow[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order");
  return (data as CategoryRow[]) ?? [];
}

export async function createCategory(restaurantId: string, name: string, icon = "🍽️") {
  const { data: existing } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const rows = existing as { sort_order: number }[] | null;
  const nextOrder = rows && rows.length > 0 ? rows[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("categories")
    .insert({ id: crypto.randomUUID(), restaurant_id: restaurantId, name, icon, sort_order: nextOrder })
    .select()
    .single();
  return { data: data as CategoryRow | null, error };
}

export async function deleteCategory(id: string) {
  return supabase.from("categories").delete().eq("id", id);
}

// ─── Menu Items ─────────────────────────────────────────────
export async function getMenuItems(restaurantId: string): Promise<MenuItemRow[]> {
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order");
  return (data as MenuItemRow[]) ?? [];
}

export async function createMenuItem(item: Omit<MenuItemRow, "created_at">) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(item as Record<string, unknown>)
    .select()
    .single();
  return { data: data as MenuItemRow | null, error };
}

export async function updateMenuItem(id: string, updates: Partial<MenuItemRow>) {
  const { data, error } = await supabase
    .from("menu_items")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  return { data: data as MenuItemRow | null, error };
}

export async function deleteMenuItem(id: string) {
  return supabase.from("menu_items").delete().eq("id", id);
}

// ─── Admin ──────────────────────────────────────────────────
export async function getAllRestaurants(): Promise<RestaurantRow[]> {
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as RestaurantRow[]) ?? [];
}

export async function updateRestaurantPlan(id: string, plan: RestaurantRow["plan"]) {
  return supabase.from("restaurants").update({ plan } as Record<string, unknown>).eq("id", id);
}

export type { MenuItemExtra };
