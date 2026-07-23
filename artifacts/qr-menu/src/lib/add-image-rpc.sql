-- =============================================
-- Run this ONCE in Supabase SQL Editor
-- Adds a secure RPC to fetch a single item's image
-- =============================================

create or replace function public.get_menu_item_image(p_item_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select image
  from public.menu_items
  where id = p_item_id
    and exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id
        and r.owner_id = auth.uid()
    )
  limit 1;
$$;
