import { supabase } from "./supabase";
import type { CategoryRow, MenuItemExtra, MenuItemRow, RestaurantRow, UserRow } from "./database.types";

function t0(label: string) {
  const start = performance.now();
  return () => console.debug(`[api] ${label}: ${(performance.now() - start) | 0}ms`);
}

// ─── Restaurant ─────────────────────────────────────────────
export async function getRestaurantByOwner(ownerId: string): Promise<RestaurantRow | null> {
  const done = t0("get_restaurant_by_owner");
  const { data, error } = await supabase.rpc("get_restaurant_by_owner", { p_owner_id: ownerId });
  done();
  if (error) console.error("[api] get_restaurant_by_owner:", error.message);
  return Array.isArray(data) && data.length > 0 ? (data[0] as RestaurantRow) : null;
}

export async function getRestaurantById(id: string): Promise<RestaurantRow | null> {
  const done = t0("get_restaurant_by_id");
  const { data, error } = await supabase.rpc("get_restaurant_by_id", { p_id: id });
  done();
  if (error) console.error("[api] get_restaurant_by_id:", error.message);
  return Array.isArray(data) && data.length > 0 ? (data[0] as RestaurantRow) : null;
}

export async function updateRestaurant(id: string, updates: Partial<RestaurantRow>) {
  const done = t0("update_restaurant_data");
  const { data, error } = await supabase.rpc("update_restaurant_data", {
    p_restaurant_id: id,
    p_updates: updates,
  });
  done();
  if (error) console.error("[api] update_restaurant_data:", error.message);
  return { data: data as RestaurantRow | null, error };
}

// ─── Categories ─────────────────────────────────────────────
export async function getCategories(restaurantId: string): Promise<CategoryRow[]> {
  const done = t0("get_categories_by_restaurant");
  const { data, error } = await supabase.rpc("get_categories_by_restaurant", {
    p_restaurant_id: restaurantId,
  });
  done();
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

/**
 * Slim fetch — NO image column returned from the server.
 * Requires get_menu_items_no_image RPC (see performance-indexes.sql).
 * ~10-50× smaller payload than getMenuItems — use for list views.
 */
export async function getMenuItemsNoImage(restaurantId: string): Promise<MenuItemRow[]> {
  const done = t0("get_menu_items_no_image");
  const { data, error } = await supabase.rpc("get_menu_items_no_image", {
    p_restaurant_id: restaurantId,
  });
  done();
  if (error) {
    console.error("[api] get_menu_items_no_image:", error.message);
    // Fallback: use full RPC but strip image client-side
    return getMenuItemsSlim(restaurantId);
  }
  return ((Array.isArray(data) ? data : []) as MenuItemRow[]).map(row => ({ ...row, image: null }));
}

/** @deprecated Use getMenuItemsNoImage for list views — avoids transferring image blobs */
export async function getMenuItemsSlim(restaurantId: string): Promise<MenuItemRow[]> {
  const done = t0("get_menu_items_by_restaurant (slim)");
  const { data, error } = await supabase.rpc("get_menu_items_by_restaurant", {
    p_restaurant_id: restaurantId,
  });
  done();
  if (error) console.error("[api] getMenuItemsSlim:", error.message);
  return ((Array.isArray(data) ? data : []) as MenuItemRow[]).map(row => ({ ...row, image: null }));
}

/** Full fetch (includes images) — use only when you need all images at once */
export async function getMenuItems(restaurantId: string): Promise<MenuItemRow[]> {
  const done = t0("get_menu_items_by_restaurant (full)");
  const { data, error } = await supabase.rpc("get_menu_items_by_restaurant", {
    p_restaurant_id: restaurantId,
  });
  done();
  if (error) console.error("[api] get_menu_items_by_restaurant:", error.message);
  return (Array.isArray(data) ? data : []) as MenuItemRow[];
}

/** Fetch just the image for a single item — used for the edit modal */
export async function getMenuItemImage(id: string): Promise<string | null> {
  const done = t0(`get_menu_item_image(${id.slice(0, 8)})`);
  const { data, error } = await supabase.rpc("get_menu_item_image", { p_item_id: id });
  done();
  if (error) console.error("[api] getMenuItemImage:", error.message);
  return typeof data === "string" ? data : null;
}

/**
 * Batch fetch: ONE RPC returns all (id, image) pairs for a restaurant.
 * Use this instead of N per-item getMenuItemImage calls.
 * Requires get_menu_item_images_batch RPC (see batch-images-rpc.sql).
 */
export async function getMenuItemImagesBatch(
  restaurantId: string
): Promise<Record<string, string>> {
  const done = t0("get_menu_item_images_batch");
  const { data, error } = await supabase.rpc("get_menu_item_images_batch", {
    p_restaurant_id: restaurantId,
  });
  done();
  if (error) {
    console.error("[api] get_menu_item_images_batch:", error.message);
    return {};
  }
  const map: Record<string, string> = {};
  if (Array.isArray(data)) {
    for (const row of data as { id: string; image: string | null }[]) {
      if (row.id && row.image) map[row.id] = row.image;
    }
  }
  return map;
}

/**
 * Upload an image file to Supabase Storage and return its public URL.
 * Falls back to base64 data URL if upload fails.
 */
export async function uploadMenuImage(file: File, restaurantId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${restaurantId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("menu-images")
    .upload(path, file, { upsert: true });
  if (error) {
    console.error("[api] uploadMenuImage:", error.message);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
  }
  const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(path);
  return urlData.publicUrl;
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
