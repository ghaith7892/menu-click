-- ═══════════════════════════════════════════════════════════════════════════
-- fix-restaurant-rpc.sql
-- Run in Supabase SQL Editor when you see:
--   "Could not find the function public.get_restaurant_by_owner(p_owner_id)
--    in the schema cache"
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1 ─ Drop old version (fixes any signature mismatch from earlier runs)
DROP FUNCTION IF EXISTS public.get_restaurant_by_owner(uuid);

-- Step 2 ─ Recreate with correct signature & all columns
CREATE OR REPLACE FUNCTION public.get_restaurant_by_owner(p_owner_id uuid)
RETURNS TABLE (
  id           uuid,
  owner_id     uuid,
  name         text,
  name_en      text,
  logo         text,
  cover_color  text,
  description  text,
  plan         text,
  tables_count integer,
  is_active    boolean,
  currency     text,
  language     text,
  created_at   timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      r.id,
      r.owner_id,
      r.name,
      r.name_en,
      r.logo,
      r.cover_color,
      r.description,
      r.plan::text,
      r.tables_count,
      r.is_active,
      r.currency,
      r.language::text,
      r.created_at
    FROM restaurants r
    WHERE r.owner_id = p_owner_id
    LIMIT 1;
END;
$$;

-- Step 3 ─ Grant execute to all auth roles
GRANT EXECUTE ON FUNCTION public.get_restaurant_by_owner(uuid)
  TO anon, authenticated, service_role;

-- Step 4 ─ Force PostgREST to reload its schema cache immediately
--          (takes effect within a few seconds — no server restart needed)
NOTIFY pgrst, 'reload schema';

-- ─── Verification ────────────────────────────────────────────────────────────
-- After running, paste your user UUID below and verify it returns your restaurant:
-- SELECT * FROM get_restaurant_by_owner('YOUR-USER-UUID-HERE');
