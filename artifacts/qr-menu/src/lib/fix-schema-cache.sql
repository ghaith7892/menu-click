-- ================================================================
-- FIX: get_restaurant_by_owner missing from PostgREST schema cache
-- Run this in Supabase SQL Editor
-- ================================================================

-- STEP 1: Reload the schema cache (fastest fix — try this first)
NOTIFY pgrst, 'reload schema';

-- STEP 2: If STEP 1 alone is not enough, recreate the function so
-- PostgREST picks up the correct signature on next schema reload.
DROP FUNCTION IF EXISTS public.get_restaurant_by_owner(uuid);

CREATE OR REPLACE FUNCTION public.get_restaurant_by_owner(p_owner_id uuid)
RETURNS TABLE(id uuid, name text, plan text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT r.id, r.name, r.plan::text
    FROM public.restaurants r
    WHERE r.owner_id = p_owner_id
    ORDER BY r.created_at ASC
    LIMIT 1;
END;
$$;

-- STEP 3: Reload again after recreation
NOTIFY pgrst, 'reload schema';

-- ================================================================
-- VERIFY: After running the above, this should return your
-- restaurant row without errors:
--
-- SELECT * FROM public.get_restaurant_by_owner('<your-user-uuid>');
-- ================================================================
