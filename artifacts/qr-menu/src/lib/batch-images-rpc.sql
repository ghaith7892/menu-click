-- ================================================================
-- Batch image loader: one RPC returns ALL (id, image) pairs for a
-- restaurant instead of N separate per-item calls.
-- Run ONCE in Supabase SQL Editor.
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_menu_item_images_batch(p_restaurant_id uuid)
RETURNS TABLE (id uuid, image text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, image
  FROM public.menu_items
  WHERE restaurant_id = p_restaurant_id
    AND image IS NOT NULL
    AND image <> '';
$$;
