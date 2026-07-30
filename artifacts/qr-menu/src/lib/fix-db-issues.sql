-- ============================================================
-- FIX 1: is_admin() infinite recursion
-- ============================================================
-- Problem: is_admin() queries public.users, but the RLS policy
--   "Admins can read all users" on public.users calls is_admin().
--   This creates infinite recursion: query → RLS → is_admin() → query → ...
--
-- Fix: Add SECURITY DEFINER so the function runs as its owner
--   (bypasses RLS on users table, breaking the recursion).
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;


-- ============================================================
-- FIX 2: get_restaurant_by_owner RPC (missing function)
-- ============================================================
-- Problem: Function is missing from the schema cache (or doesn't
--   exist). The app calls this RPC on every login to get the
--   restaurant linked to the logged-in owner.
-- ============================================================

DROP FUNCTION IF EXISTS public.get_restaurant_by_owner(uuid);

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
      r.id, r.owner_id, r.name, r.name_en, r.logo, r.cover_color,
      r.description, r.plan::text, r.tables_count, r.is_active,
      r.currency, r.language::text, r.created_at
    FROM public.restaurants r
    WHERE r.owner_id = p_owner_id
    ORDER BY r.created_at ASC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_restaurant_by_owner(uuid) TO anon, authenticated;


-- ============================================================
-- Reload PostgREST schema cache so both fixes take effect
-- ============================================================
NOTIFY pgrst, 'reload schema';
