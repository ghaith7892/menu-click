import { supabase } from './supabase';
import type { CategoryRow, MenuItemRow, RestaurantRow } from './types';

/** Safe UUID generator for React Native (no 'uuid' package needed) */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Restaurant ──────────────────────────────────────────────
export async function getRestaurantByOwner(ownerId: string): Promise<RestaurantRow | null> {
  const { data, error } = await supabase.rpc('get_restaurant_by_owner', { p_owner_id: ownerId });

  const isSchemaCacheMiss =
    error &&
    (error.message.includes('schema cache') ||
      error.message.includes('Could not find the function') ||
      (error as unknown as { code?: string }).code === 'PGRST202');

  if (isSchemaCacheMiss) {
    const { data: fb, error: fbErr } = await supabase
      .from('restaurants')
      .select('id, name, plan, currency, language, logo, is_active, tables_count')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    if (fbErr) return null;
    return fb as RestaurantRow;
  }

  if (error) console.error('[api] get_restaurant_by_owner:', error.message);
  return Array.isArray(data) && data.length > 0 ? (data[0] as RestaurantRow) : null;
}

// ─── Categories ──────────────────────────────────────────────
export async function getCategories(restaurantId: string): Promise<CategoryRow[]> {
  const { data, error } = await supabase.rpc('get_categories_by_restaurant', {
    p_restaurant_id: restaurantId,
  });
  if (error) console.error('[api] get_categories_by_restaurant:', error.message);
  return (Array.isArray(data) ? data : []) as CategoryRow[];
}

export async function createCategory(restaurantId: string, name: string, icon = '🍽️') {
  const { data, error } = await supabase.rpc('insert_category', {
    p_id: generateId(),
    p_restaurant_id: restaurantId,
    p_name: name,
    p_icon: icon,
    p_sort_order: 0,
  });
  if (error) console.error('[api] insert_category:', error.message);
  const row = Array.isArray(data) && data.length > 0 ? (data[0] as CategoryRow) : null;
  return { data: row, error };
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.rpc('delete_category', { p_id: id });
  if (error) console.error('[api] delete_category:', error.message);
  return { error };
}

// ─── Menu Items ───────────────────────────────────────────────
export async function getMenuItemsNoImage(restaurantId: string): Promise<MenuItemRow[]> {
  const { data, error } = await supabase.rpc('get_menu_items_no_image', {
    p_restaurant_id: restaurantId,
  });
  if (error) {
    console.error('[api] get_menu_items_no_image:', error.message);
    // Fallback: full RPC, strip images client-side
    const { data: full } = await supabase.rpc('get_menu_items_by_restaurant', {
      p_restaurant_id: restaurantId,
    });
    return ((Array.isArray(full) ? full : []) as MenuItemRow[]).map((r) => ({
      ...r,
      image: null,
    }));
  }
  return (Array.isArray(data) ? data : []) as MenuItemRow[];
}

export async function getMenuItemImage(id: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_menu_item_image', { p_item_id: id });
  if (error) console.error('[api] get_menu_item_image:', error.message);
  return typeof data === 'string' ? data : null;
}

export async function createMenuItem(item: Omit<MenuItemRow, 'created_at'>) {
  const { data, error } = await supabase.rpc('insert_menu_item', {
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
  if (error) console.error('[api] insert_menu_item:', error.message);
  const row = Array.isArray(data) && data.length > 0 ? (data[0] as MenuItemRow) : null;
  return { data: row, error };
}

export async function updateMenuItem(id: string, updates: Partial<MenuItemRow>) {
  const { data, error } = await supabase.rpc('update_menu_item_data', {
    p_item_id: id,
    p_updates: updates,
  });
  if (error) console.error('[api] update_menu_item_data:', error.message);
  return { data: data as MenuItemRow | null, error };
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase.rpc('delete_menu_item', { p_id: id });
  if (error) console.error('[api] delete_menu_item:', error.message);
  return { error };
}

/**
 * Load all item images for a restaurant in one batch request.
 * Falls back to the full RPC if the batch RPC is unavailable.
 */
export async function loadAllImages(restaurantId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase.rpc('get_menu_item_images_batch', {
    p_restaurant_id: restaurantId,
  });
  if (!error && Array.isArray(data)) {
    const map: Record<string, string> = {};
    for (const row of data as { id: string; image: string | null }[]) {
      if (row.id && row.image) map[row.id] = row.image;
    }
    return map;
  }
  // Fallback: full RPC
  const { data: full } = await supabase.rpc('get_menu_items_by_restaurant', {
    p_restaurant_id: restaurantId,
  });
  const map: Record<string, string> = {};
  for (const item of (full as { id: string; image: string | null }[] ?? [])) {
    if (item.id && item.image) map[item.id] = item.image;
  }
  return map;
}

// ─── Image Upload (React Native) ──────────────────────────────
/**
 * Upload a local image URI to Supabase Storage.
 * Uses fetch() → blob for React Native compatibility.
 */
export async function uploadMenuImage(
  localUri: string,
  restaurantId: string
): Promise<string | null> {
  try {
    const ext = localUri.split('.').pop()?.toLowerCase()?.split('?')[0] ?? 'jpg';
    const storagePath = `${restaurantId}/${Date.now()}.${ext}`;

    const response = await fetch(localUri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from('menu-images').upload(storagePath, blob, {
      upsert: true,
      contentType: blob.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });

    if (error) {
      console.error('[api] uploadMenuImage storage:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('menu-images').getPublicUrl(storagePath);
    return data.publicUrl;
  } catch (err) {
    console.error('[api] uploadMenuImage threw:', err);
    return null;
  }
}
