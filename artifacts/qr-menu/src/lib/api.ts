import { supabase } from "./supabase";
import type { CategoryRow, MenuItemExtra, MenuItemRow, RestaurantRow, UserRow } from "./database.types";

function t0(label: string) {
  const start = performance.now();
  return () => console.debug(`[api] ${label}: ${(performance.now() - start) | 0}ms`);
}

// ─── Supabase image transform ────────────────────────────────
// Disabled after first failure: Supabase image transform requires Pro plan.
// On Free plan /render/image/ returns 404 → every image makes 2 requests
// (transform attempt → 404 → fallback to original) which causes 2-3s delay.
// After first onError we flip this flag and skip transforms for the session.
let _transformSupported = true;

export function reportTransformFailed() {
  if (_transformSupported) {
    _transformSupported = false;
    console.debug("[api] Supabase image transform unsupported — using original URLs");
  }
}

/**
 * Returns a Supabase Storage image transform URL for a given size.
 * Falls back to the original URL if transforms are unsupported (Free plan).
 * Non-Supabase URLs and base64 data URIs are returned unchanged.
 */
export function transformImageUrl(
  src: string | null | undefined,
  width: number,
  height: number,
): string | null {
  if (!src) return null;
  // base64 or external URL — return as-is
  if (!src.includes("/storage/v1/object/public/")) return src;
  // Transform disabled after first 404 (Free plan) — use original directly
  if (!_transformSupported) return src;
  return (
    src.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
    `?width=${width}&height=${height}&resize=cover&quality=80&format=webp`
  );
}

// ─── Image cache ─────────────────────────────────────────────
// Module-level: survives re-renders & React StrictMode double-invocations.
// TTL: 5 minutes — images change rarely; QR scans reuse this instantly.
const _imgCache = new Map<string, { ts: number; map: Record<string, string> }>();
const IMG_CACHE_TTL = 5 * 60 * 1000;

export function getImageCache(restaurantId: string): Record<string, string> | null {
  const e = _imgCache.get(restaurantId);
  if (!e || Date.now() - e.ts > IMG_CACHE_TTL) { _imgCache.delete(restaurantId); return null; }
  return e.map;
}
export function setImageCache(restaurantId: string, map: Record<string, string>) {
  _imgCache.set(restaurantId, { ts: Date.now(), map });
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
    // Fallback: full RPC, strip image client-side
    return getMenuItemsSlim(restaurantId);
  }
  // NOTE: do NOT null out image — updated RPC returns Storage URLs (tiny strings)
  // and only strips base64 blobs. Storage URL items render immediately.
  return (Array.isArray(data) ? data : []) as MenuItemRow[];
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
 * Load ALL images for a restaurant in ONE request, with module-level caching.
 * - Cache hit  → instant, no network call
 * - Cache miss → tries get_menu_item_images_batch, falls back to full RPC
 *
 * Call this AFTER Phase 1 (getMenuItemsNoImage) to fill in any missing images
 * (i.e. old base64 items that the updated no-image RPC correctly skipped).
 */
export async function loadAllImages(restaurantId: string): Promise<Record<string, string>> {
  // Cache hit — return immediately
  const cached = getImageCache(restaurantId);
  if (cached) {
    console.debug(`[api] image cache hit (${Object.keys(cached).length} images)`);
    return cached;
  }

  // Try the batch RPC first (smallest payload — only id+image pairs)
  const done = t0("get_menu_item_images_batch");
  const { data, error } = await supabase.rpc("get_menu_item_images_batch", {
    p_restaurant_id: restaurantId,
  });
  done();

  if (!error && Array.isArray(data) && data.length > 0) {
    const map: Record<string, string> = {};
    for (const row of data as { id: string; image: string | null }[]) {
      if (row.id && row.image) map[row.id] = row.image;
    }
    console.debug(`[api] batch images: ${Object.keys(map).length}`);
    setImageCache(restaurantId, map);
    return map;
  }

  // Batch RPC unavailable (schema cache not refreshed) → full RPC fallback
  if (error) console.warn("[api] batch RPC fallback:", error.message);
  else console.debug("[api] batch returned 0 rows — using full RPC");

  const done2 = t0("get_menu_items_by_restaurant (image fallback)");
  const { data: full, error: fullErr } = await supabase.rpc(
    "get_menu_items_by_restaurant",
    { p_restaurant_id: restaurantId }
  );
  done2();
  if (fullErr) {
    console.error("[api] image fallback failed:", fullErr.message);
    return {};
  }
  const map: Record<string, string> = {};
  for (const item of (full as { id: string; image: string | null }[] ?? [])) {
    if (item.id && item.image) map[item.id] = item.image;
  }
  console.debug(`[api] fallback images: ${Object.keys(map).length}`);
  setImageCache(restaurantId, map);
  return map;
}

/** @deprecated Use loadAllImages — kept for dashboard edit modal */
export async function getMenuItemImagesBatch(
  restaurantId: string
): Promise<Record<string, string>> {
  return loadAllImages(restaurantId);
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
