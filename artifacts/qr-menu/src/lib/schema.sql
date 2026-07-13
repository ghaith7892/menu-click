-- ================================================================
-- MenuClick — Complete Database Setup Script
-- Run this ONCE in Supabase SQL Editor (safe to re-run)
-- ================================================================

-- ================================================================
-- SECTION 1: DROP OLD POLICIES (to avoid "already exists" errors)
-- ================================================================

drop policy if exists "Users can read own data"          on public.users;
drop policy if exists "Users can update own data"        on public.users;
drop policy if exists "Service can insert users"         on public.users;
drop policy if exists "Admins can read all users"        on public.users;

drop policy if exists "Owners can manage own restaurants"  on public.restaurants;
drop policy if exists "Anyone can read active restaurants" on public.restaurants;
drop policy if exists "Admins can manage all restaurants"  on public.restaurants;

drop policy if exists "Owners manage own categories"   on public.categories;
drop policy if exists "Anyone can read categories"     on public.categories;

drop policy if exists "Owners manage own menu items"         on public.menu_items;
drop policy if exists "Anyone can read available menu items" on public.menu_items;

drop policy if exists "Owners manage own orders"  on public.orders;
drop policy if exists "Anyone can insert orders"  on public.orders;


-- ================================================================
-- SECTION 2: CREATE TABLES
-- ================================================================

-- 1. USERS (extends Supabase Auth)
create table if not exists public.users (
  id         uuid        primary key references auth.users(id) on delete cascade,
  name       text        not null,
  email      text        not null unique,
  role       text        not null default 'restaurant'
               check (role in ('admin', 'restaurant')),
  created_at timestamptz not null default now()
);

-- 2. RESTAURANTS
create table if not exists public.restaurants (
  id           uuid          primary key default gen_random_uuid(),
  owner_id     uuid          not null references public.users(id) on delete cascade,
  name         text          not null,
  name_en      text,
  logo         text          default '🍽️',
  cover_color  text          default '#7c3aed',
  description  text,
  plan         text          not null default 'free'
                 check (plan in ('free', 'pro', 'enterprise')),
  tables_count integer       not null default 5,
  is_active    boolean       not null default true,
  currency     text          not null default 'SAR',
  language     text          not null default 'ar'
                 check (language in ('ar', 'en')),
  created_at   timestamptz   not null default now()
);

-- Add new columns safely if table already existed without them
alter table public.restaurants add column if not exists currency text not null default 'SAR';
alter table public.restaurants add column if not exists language text not null default 'ar';

-- 3. CATEGORIES
create table if not exists public.categories (
  id            uuid        primary key default gen_random_uuid(),
  restaurant_id uuid        not null references public.restaurants(id) on delete cascade,
  name          text        not null,
  icon          text        default '🍽️',
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

-- 4. MENU ITEMS
create table if not exists public.menu_items (
  id            uuid          primary key default gen_random_uuid(),
  restaurant_id uuid          not null references public.restaurants(id) on delete cascade,
  category_id   uuid          not null references public.categories(id) on delete cascade,
  name          text          not null,
  name_en       text,
  description   text,
  price         numeric(10,2) not null default 0,
  image         text,
  is_popular    boolean       not null default false,
  is_available  boolean       not null default true,
  extras        jsonb         default '[]'::jsonb,
  sort_order    integer       not null default 0,
  created_at    timestamptz   not null default now()
);

-- 5. ORDERS
create table if not exists public.orders (
  id            uuid          primary key default gen_random_uuid(),
  restaurant_id uuid          not null references public.restaurants(id) on delete cascade,
  table_number  integer       not null,
  items         jsonb         not null default '[]'::jsonb,
  status        text          not null default 'pending'
                  check (status in ('pending', 'preparing', 'ready', 'delivered')),
  total         numeric(10,2) not null default 0,
  customer_note text,
  created_at    timestamptz   not null default now()
);


-- ================================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY
-- ================================================================

alter table public.users       enable row level security;
alter table public.restaurants enable row level security;
alter table public.categories  enable row level security;
alter table public.menu_items  enable row level security;
alter table public.orders      enable row level security;


-- ================================================================
-- SECTION 4: RLS POLICIES
-- ================================================================

-- ── users ──────────────────────────────────────────────────────
create policy "Users can read own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on public.users for update
  using (auth.uid() = id);

create policy "Service can insert users"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Admins can read all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ── restaurants ────────────────────────────────────────────────
create policy "Owners can manage own restaurants"
  on public.restaurants for all
  using (auth.uid() = owner_id);

create policy "Anyone can read active restaurants"
  on public.restaurants for select
  using (is_active = true);

create policy "Admins can manage all restaurants"
  on public.restaurants for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ── categories ─────────────────────────────────────────────────
create policy "Owners manage own categories"
  on public.categories for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Anyone can read categories"
  on public.categories for select
  using (true);

-- ── menu_items ─────────────────────────────────────────────────
create policy "Owners manage own menu items"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Anyone can read available menu items"
  on public.menu_items for select
  using (is_available = true);

-- ── orders ─────────────────────────────────────────────────────
create policy "Owners manage own orders"
  on public.orders for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Anyone can insert orders"
  on public.orders for insert
  with check (true);


-- ================================================================
-- SECTION 5: AUTO-CREATE USER PROFILE ON SIGN UP (DB Trigger)
-- ================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'restaurant')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ================================================================
-- SECTION 6: STORAGE BUCKET FOR DISH & COVER IMAGES
-- ================================================================

-- Create public bucket (anyone can view images via URL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

-- Drop old storage policies first
drop policy if exists "Public can read menu images"                on storage.objects;
drop policy if exists "Authenticated users can upload menu images" on storage.objects;
drop policy if exists "Users can update their own menu images"     on storage.objects;
drop policy if exists "Users can delete their own menu images"     on storage.objects;

-- Anyone can READ (view) images
create policy "Public can read menu images"
  on storage.objects for select
  using (bucket_id = 'menu-images');

-- Logged-in users can UPLOAD
create policy "Authenticated users can upload menu images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images');

-- Users can UPDATE their own uploads
create policy "Users can update their own menu images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images' and auth.uid() = owner);

-- Users can DELETE their own uploads
create policy "Users can delete their own menu images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images' and auth.uid() = owner);


-- ================================================================
-- SECTION 7: REALTIME (live order updates in dashboard)
-- ================================================================

alter publication supabase_realtime add table public.orders;


-- ================================================================
-- ✅ DONE — All tables, RLS policies, trigger, bucket created
--
-- 👑 To promote a user to Super Admin:
--    update public.users set role = 'admin' where email = 'your@email.com';
-- ================================================================
