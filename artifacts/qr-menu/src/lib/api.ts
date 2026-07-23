import { supabase } from "./supabase";
import type { CategoryRow, MenuItemExtra, MenuItemRow, RestaurantRow, UserRow } from "./database.types";

// ─── Restaurant ─────────────────────────────────────────────
export async function getRestaurantByOwner(ownerId: string): Promise<RestaurantRow | null> {
  const { data, error } = await supabase.rpc("get_restaurant_by_owner", { p_owner_id: ownerId });
  if (error) console.error("[api] get_restaurant_by_owner:", error.message);
  return Array.isArray(data) && data.length > 0 ? (data[0] as RestaurantRow) : null;
}

export async function getRestaurantById(id: string): Promise<RestaurantRow | null> {
  const { data, error } = await supabase.rpc("get_restaurant_by_id", { p_id: id });
  if (error) console.error("[api] get_restaurant_by_id:", error.message);
  return Array.isArray(data) && data.length > 0 ? (data[0] as RestaurantRow) : null;
}

export async function updateRestaurant(id: string, updates: Partial<RestaurantRow>) {
  const { data, error } = await supabase.rpc("update_restaurant_data", {
    p_restaurant_id: id,
    p_updates: updates,
  });
  if (error) console.error("[api] update_restaurant_data:", error.message);
  return { data: data as RestaurantRow | null, error };
}

// ─── Categories ─────────────────────────────────────────────
export async function getCategories(restaurantId: string): Promise<CategoryRow[]> {
  const { data, error } = await supabase.rpc("get_categories_by_restaurant", {
    p_restaurant_id: restaurantId,
  });
  if (error) console.error("[api] get_categories_by_restaurant:", error.message);
  return (Array.isArray(data) ? data : []) as CategoryRow[];
}

export async function createCategory(restaurantId: string, name: string, icon = "🍽️", sortOrder = 0) {
  const newId = crypto.randomUUID();
  const { data, error } = await supabase.rpc("insert_category", {
    p_id: newId,
    p_restaurant_id: restaurantId,
    p_name: name,
    p_icon: icon,
    p_sort_order: sortOrder,
  });
  if (error) console.error("[api] insert_category:", error.message);
  const row = Array.isArray(data) && data.length > 0 ? (data[0] as CategoryRow) : null;
  return { data: row, error };
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.rpc("delete_category", { p_id: id });
  if (error) console.error("[api] delete_category:", error.message);
  return { error };
}

// ─── Menu Items ─────────────────────────────────────────────
export async function getMenuItems(restaurantId: string): Promise<MenuItemRow[]> {
  const { data, error } = await supabase.rpc("get_menu_items_by_restaurant", {
    p_restaurant_id: restaurantId,
  });
  if (error) console.error("[api] get_menu_items_by_restaurant:", error.message);
  return (Array.isArray(data) ? data : []) as MenuItemRow[];
}

export async function createMenuItem(item: Omit<MenuItemRow, "created_at">) {
  const { data, error } = await supabase.rpc("insert_menu_item", {
    p_id: item.id,
    p_restaurant_id: item.restaurant_id,
    p_category_id: item.category_id ?? null,
    p_name: item.name,
    p_description: item.description ?? null,
    p_price: item.price ?? 0,
    p_image: item.image ?? null,
    p_is_available: item.is_available ?? true,
    p_is_popular: item.is_popular ?? false,
    p_sort_order: item.sort_order ?? 0,
  });
  if (error) console.error("[api] insert_menu_item:", error.message);
  const row = Array.isArray(data) && data.length > 0 ? (data[0] as MenuItemRow) : null;
  return { data: row, error };
}

export async function updateMenuItem(id: string, updates: Partial<MenuItemRow>) {
  const { data, error } = await supabase.rpc("update_menu_item_data", {
    p_item_id: id,
    p_updates: updates,
  });
  if (error) console.error("[api] update_menu_item_data:", error.message);
  return { data: data as MenuItemRow | null, error };
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase.rpc("delete_menu_item", { p_id: id });
  if (error) console.error("[api] delete_menu_item:", error.message);
  return { error };
}

// ─── Admin (all via SECURITY DEFINER RPCs — no direct table access) ─────────
export async function getAllRestaurants(): Promise<RestaurantRow[]> {
  const { data, error } = await supabase.rpc("admin_get_restaurants");
  if (error) console.error("[api] admin_get_restaurants:", error.message);
  return (Array.isArray(data) ? data : []) as RestaurantRow[];
}

export async function getAllUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase.rpc("admin_get_users");
  if (error) console.error("[api] admin_get_users:", error.message);
  return (Array.isArray(data) ? data : []) as UserRow[];
}

export async function updateRestaurantPlan(id: string, plan: RestaurantRow["plan"]) {
  const { data, error } = await supabase.rpc("admin_update_plan", {
    p_id: id,
    p_plan: plan,
  });
  if (error) console.error("[api] admin_update_plan:", error.message);
  const row = Array.isArray(data) && data.length > 0 ? (data[0] as RestaurantRow) : null;
  return { data: row, error };
}

export async function updateRestaurantActive(id: string, isActive: boolean) {
  const { data, error } = await supabase.rpc("admin_update_active", {
    p_id: id,
    p_is_active: isActive,
  });
  if (error) console.error("[api] admin_update_active:", error.message);
  const row = Array.isArray(data) && data.length > 0 ? (data[0] as RestaurantRow) : null;
  return { data: row, error };
}

export async function deleteRestaurant(id: string) {
  const { error } = await supabase.rpc("admin_delete_restaurant", { p_id: id });
  if (error) console.error("[api] admin_delete_restaurant:", error.message);
  return { error };
}

export async function getRestaurantItemCount(restaurantId: string): Promise<number> {
  const { data, error } = await supabase.rpc("admin_get_item_count", {
    p_restaurant_id: restaurantId,
  });
  if (error) console.error("[api] admin_get_item_count:", error.message);
  return typeof data === "number" ? data : 0;
}

export type { MenuItemExtra };
