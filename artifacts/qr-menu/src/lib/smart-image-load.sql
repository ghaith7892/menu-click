-- ================================================================
-- SMART IMAGE LOADING — run ONCE in Supabase SQL Editor
-- ================================================================
-- What this does:
--   Storage URL images (https://…) are tiny strings (~200 bytes).
--   The old get_menu_items_no_image stripped ALL images, even URLs.
--   This version includes URLs in Phase 1 (fast, no extra request)
--   and only skips base64 blobs (which are 100-500 KB each).
--
-- Result: restaurants using Supabase Storage get instant images.
--         Restaurants with old base64 images still work (Phase 2 batch).
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_menu_items_no_image(p_restaurant_id uuid)
RETURNS TABLE (
  id            uuid,
  restaurant_id uuid,
  category_id   uuid,
  name          text,
  name_en       text,
  description   text,
  price         numeric,
  is_popular    boolean,
  is_available  boolean,
  extras        jsonb,
  sort_order    integer,
  created_at    timestamptz,
  image         text          -- ← included if it's a Storage URL, NULL if base64
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    id, restaurant_id, category_id,
    name, name_en, description,
    price, is_popular, is_available,
    extras, sort_order, created_at,
    -- Return URL images (tiny strings) — skip base64 blobs (huge)
    CASE
      WHEN image LIKE 'http%' THEN image
      ELSE NULL
    END AS image
  FROM public.menu_items
  WHERE restaurant_id = p_restaurant_id
  ORDER BY sort_order ASC, created_at ASC;
$$;

-- Refresh PostgREST schema cache (important after RETURNS TABLE change)
NOTIFY pgrst, 'reload schema';
