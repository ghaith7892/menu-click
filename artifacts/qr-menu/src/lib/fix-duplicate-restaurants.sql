-- ================================================================
-- FIX: Duplicate restaurants caused by timeout bug in auth-context
-- Run this in Supabase SQL Editor (safe — shows results before deleting)
-- ================================================================

-- ── STEP 1: DIAGNOSE ─────────────────────────────────────────────
-- Show owners who have more than one restaurant (the duplicate problem)
SELECT
  r.owner_id,
  u.email,
  COUNT(*)          AS restaurant_count,
  array_agg(r.id ORDER BY r.created_at ASC)   AS restaurant_ids,
  array_agg(r.name ORDER BY r.created_at ASC) AS restaurant_names,
  array_agg(r.created_at ORDER BY r.created_at ASC) AS created_ats
FROM public.restaurants r
JOIN public.users u ON u.id = r.owner_id
GROUP BY r.owner_id, u.email
ORDER BY restaurant_count DESC;

-- ── STEP 2: SEE WHICH RESTAURANT HAS DATA ────────────────────────
-- For each restaurant, show how many categories and items it has
SELECT
  r.id,
  r.name            AS restaurant_name,
  u.email           AS owner_email,
  r.created_at,
  COUNT(DISTINCT c.id)  AS category_count,
  COUNT(DISTINCT m.id)  AS item_count
FROM public.restaurants r
JOIN public.users u ON u.id = r.owner_id
LEFT JOIN public.categories c ON c.restaurant_id = r.id
LEFT JOIN public.menu_items m ON m.restaurant_id = r.id
GROUP BY r.id, r.name, u.email, r.created_at
ORDER BY u.email, r.created_at ASC;

-- ── STEP 3: DELETE EMPTY DUPLICATES ──────────────────────────────
-- Keeps ONLY the restaurant with the most data per owner.
-- If tied, keeps the OLDEST one (first created).
-- Dry-run first: this SELECT shows what will be deleted.
SELECT r.id, r.name, u.email, r.created_at,
       (SELECT COUNT(*) FROM public.categories c WHERE c.restaurant_id = r.id) AS cats,
       (SELECT COUNT(*) FROM public.menu_items m  WHERE m.restaurant_id  = r.id) AS items
FROM public.restaurants r
JOIN public.users u ON u.id = r.owner_id
WHERE r.id NOT IN (
  -- For each owner, pick the restaurant with the most items+categories (oldest if tied)
  SELECT DISTINCT ON (owner_id)
    r2.id
  FROM public.restaurants r2
  LEFT JOIN public.categories c2 ON c2.restaurant_id = r2.id
  LEFT JOIN public.menu_items  m2 ON m2.restaurant_id  = r2.id
  GROUP BY r2.id, r2.owner_id, r2.created_at
  ORDER BY r2.owner_id,
           COUNT(DISTINCT m2.id) + COUNT(DISTINCT c2.id) DESC,
           r2.created_at ASC
)
ORDER BY u.email;

-- ── STEP 4: EXECUTE THE DELETE (uncomment when satisfied with STEP 3 results)
-- DELETE FROM public.restaurants
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (owner_id)
--     r2.id
--   FROM public.restaurants r2
--   LEFT JOIN public.categories c2 ON c2.restaurant_id = r2.id
--   LEFT JOIN public.menu_items  m2 ON m2.restaurant_id  = r2.id
--   GROUP BY r2.id, r2.owner_id, r2.created_at
--   ORDER BY r2.owner_id,
--            COUNT(DISTINCT m2.id) + COUNT(DISTINCT c2.id) DESC,
--            r2.created_at ASC
-- );

-- ── STEP 5: FIX THE RPC — always return the data-rich restaurant ──
-- This ensures get_restaurant_by_owner never returns an empty duplicate again.
CREATE OR REPLACE FUNCTION public.get_restaurant_by_owner(p_owner_id uuid)
RETURNS SETOF public.restaurants
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Return the restaurant that has the most data (categories + items).
  -- Falls back to oldest by created_at if all have equal data.
  SELECT r.*
  FROM public.restaurants r
  LEFT JOIN (
    SELECT restaurant_id, COUNT(*) AS item_count
    FROM public.menu_items
    GROUP BY restaurant_id
  ) m ON m.restaurant_id = r.id
  LEFT JOIN (
    SELECT restaurant_id, COUNT(*) AS cat_count
    FROM public.categories
    GROUP BY restaurant_id
  ) c ON c.restaurant_id = r.id
  WHERE r.owner_id = p_owner_id
  ORDER BY
    COALESCE(m.item_count, 0) + COALESCE(c.cat_count, 0) DESC,
    r.created_at ASC
  LIMIT 1;
$$;

-- ── STEP 6: VERIFY ───────────────────────────────────────────────
-- After running STEP 4, confirm each owner now has exactly one restaurant
-- with their data intact:
-- SELECT u.email, r.name, r.created_at,
--   (SELECT COUNT(*) FROM public.categories c WHERE c.restaurant_id = r.id) AS cats,
--   (SELECT COUNT(*) FROM public.menu_items  m WHERE m.restaurant_id  = r.id) AS items
-- FROM public.restaurants r
-- JOIN public.users u ON u.id = r.owner_id
-- ORDER BY u.email;
