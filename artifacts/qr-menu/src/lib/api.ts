import { supabase } from "./supabase";
import type { CategoryRow, MenuItemExtra, MenuItemRow, RestaurantRow, UserRow } from "./database.types";

// ─── Restaurant ─────────────────────────────────────────────
export async function getRestaurantByOwner(ownerId: string): Promise<RestaurantRow | null> {
  // Try RPC first (security definer — bypasses RLS recursion)
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_restaurant_by_owner", {
    p_owner_id: ownerId,
  });
  if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
    return rpcData[0] as RestaurantRow;
  }
  // Fallback to direct query
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", ownerId)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("[api] getRestaurantByOwner error:", rpcError?.message, error.code, error.message);
  }
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
  const { data: rpcData, error: rpcError } = await supabase.rpc("update_restaurant_data", {
    p_restaurant_id: id,
    p_updates: updates,
  });
  if (!rpcError && rpcData) return { data: rpcData as RestaurantRow, error: null };

  // Fallback to direct query
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
  const newId = crypto.randomUUID();

  // Try RPC first (security definer — bypasses RLS recursion)
  const { data: rpcData, error: rpcError } = await supabase.rpc("insert_category", {
    p_id: newId,
    p_restaurant_id: restaurantId,
    p_name: name,
    p_icon: icon,
    p_sort_order: nextOrder,
  });
  if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
    return { data: rpcData[0] as CategoryRow, error: null };
  }

  // Fallback to direct insert
  const { data, error } = await supabase
    .from("categories")
    .insert({ id: newId, restaurant_id: restaurantId, name, icon, sort_order: nextOrder })
    .select()
    .single();
  if (error) console.error("[api] createCategory error:", rpcError?.message, error.code, error.message);
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
  // Try RPC first (security definer — bypasses RLS recursion)
  const { data: rpcData, error: rpcError } = await supabase.rpc("insert_menu_item", {
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
  if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
    return { data: rpcData[0] as MenuItemRow, error: null };
  }

  // Fallback to direct insert
  const { data, error } = await supabase
    .from("menu_items")
    .insert(item as Record<string, unknown>)
    .select()
    .single();
  if (error) console.error("[api] createMenuItem error:", rpcError?.message, error.code, error.message);
  return { data: data as MenuItemRow | null, error };
}

export async function updateMenuItem(id: string, updates: Partial<MenuItemRow>) {
  // Try RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc("update_menu_item_data", {
    p_item_id: id,
    p_updates: updates,
  });
  if (!rpcError && rpcData) return { data: rpcData as MenuItemRow, error: null };

  // Fallback to direct update
  const { data, error } = await supabase
    .from("menu_items")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) console.error("[api] updateMenuItem error:", rpcError?.message, error.code, error.message);
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

export async function getAllUsers(): Promise<UserRow[]> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as UserRow[]) ?? [];
}

export async function updateRestaurantPlan(id: string, plan: RestaurantRow["plan"]) {
  const { data, error } = await supabase
    .from("restaurants")
    .update({ plan } as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  return { data: data as RestaurantRow | null, error };
}

export async function updateRestaurantActive(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from("restaurants")
    .update({ is_active: isActive } as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  return { data: data as RestaurantRow | null, error };
}

export async function deleteRestaurant(id: string) {
  return supabase.from("restaurants").delete().eq("id", id);
}

export async function getRestaurantItemCount(restaurantId: string): Promise<number> {
  const { count } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);
  return count ?? 0;
}

export type { MenuItemExtra };
