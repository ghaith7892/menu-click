-- =============================================
-- QR Menu SaaS — Database Schema
-- Run this entire script in Supabase SQL Editor
-- =============================================

-- 1. USERS TABLE (extends Supabase Auth)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'restaurant' check (role in ('admin', 'restaurant')),
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);
create policy "Service can insert users" on public.users
  for insert with check (auth.uid() = id);

-- Admin can read all users
create policy "Admins can read all users" on public.users
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- 2. RESTAURANTS TABLE
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  name_en text,
  logo text default '🍽️',
  cover_color text default '#7c3aed',
  description text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  tables_count integer not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.restaurants enable row level security;
create policy "Owners can manage own restaurants" on public.restaurants
  for all using (auth.uid() = owner_id);
create policy "Anyone can read active restaurants" on public.restaurants
  for select using (is_active = true);

-- Admin can read AND manage ALL restaurants (including inactive)
create policy "Admins can manage all restaurants" on public.restaurants
  for all using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- 3. CATEGORIES TABLE
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  icon text default '🍽️',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Owners manage own categories" on public.categories
  for all using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );
create policy "Anyone can read categories" on public.categories
  for select using (true);

-- 4. MENU_ITEMS TABLE
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  name_en text,
  description text,
  price numeric(10,2) not null default 0,
  image text default '🍽️',
  is_popular boolean not null default false,
  is_available boolean not null default true,
  extras jsonb default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.menu_items enable row level security;
create policy "Owners manage own menu items" on public.menu_items
  for all using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );
create policy "Anyone can read available menu items" on public.menu_items
  for select using (is_available = true);

-- 5. ORDERS TABLE
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number integer not null,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'preparing', 'ready', 'delivered')),
  total numeric(10,2) not null default 0,
  customer_note text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Owners manage own orders" on public.orders
  for all using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );
create policy "Anyone can insert orders" on public.orders
  for insert with check (true);

-- =============================================
-- DB Trigger: auto-create user profile on signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- Enable Realtime for live order updates
-- =============================================
alter publication supabase_realtime add table public.orders;

-- =============================================
-- To create a Super Admin user, run:
-- update public.users set role = 'admin' where email = 'your@email.com';
-- =============================================
