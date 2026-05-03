-- SUPABASE SCHEMA FOR STEFLOW STORE
-- Copy and paste this into the Supabase SQL Editor

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. USERS TABLE
-- Stores extended user profile information
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  name text,
  phone text,
  currency text default 'USD',
  role text default 'user' check (role in ('user', 'admin')),
  status text default 'Active' check (status in ('Active', 'Inactive', 'Suspended')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  original_price numeric check (original_price >= 0),
  category text,
  subcategory text,
  brand text,
  sku text unique,
  stock int default 0 check (stock >= 0),
  images jsonb default '[]'::jsonb,
  status text default 'Active' check (status in ('Active', 'Inactive', 'OutOfStock')),
  featured boolean default false,
  bestseller boolean default false,
  rating numeric default 0,
  review_count int default 0,
  tags jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CARTS TABLE
create table public.carts (
  user_id uuid references auth.users not null primary key,
  items jsonb default '[]'::jsonb, -- Array of {productId, quantity, price}
  total numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ORDERS TABLE
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text unique not null,
  user_id uuid references auth.users not null,
  items jsonb not null, -- Array of {productId, name, price, quantity, total}
  subtotal numeric not null,
  shipping numeric default 0,
  tax numeric default 0,
  total numeric not null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded')),
  payment_method text default 'Credit Card',
  payment_status text default 'Pending' check (payment_status in ('Pending', 'Paid', 'Failed', 'Refunded')),
  shipping_address jsonb not null,
  billing_address jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ADDRESSES TABLE
create table public.addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  type text default 'shipping' check (type in ('shipping', 'billing', 'both')),
  first_name text not null,
  last_name text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  zip_code text not null,
  country text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. WISHLIST TABLE
create table public.wishlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references public.products not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- 8. COUPONS TABLE
create table public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  name text,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric not null,
  min_purchase numeric default 0,
  max_discount numeric,
  usage_limit int,
  used_count int default 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  status text default 'active' check (status in ('active', 'inactive', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. NOTIFICATIONS TABLE
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text not null,
  type text not null,
  target text, -- e.g., 'all', 'admins', 'specific_users'
  recipients jsonb default '[]'::jsonb,
  scheduled_at timestamp with time zone,
  status text default 'draft',
  stats jsonb default '{"sent": 0, "opened": 0, "clicked": 0}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. FUNCTIONS & TRIGGERS

-- Function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger handle_users_updated_at before update on public.users for each row execute procedure public.handle_updated_at();
create trigger handle_products_updated_at before update on public.products for each row execute procedure public.handle_updated_at();
create trigger handle_carts_updated_at before update on public.carts for each row execute procedure public.handle_updated_at();
create trigger handle_orders_updated_at before update on public.orders for each row execute procedure public.handle_updated_at();
create trigger handle_addresses_updated_at before update on public.addresses for each row execute procedure public.handle_updated_at();
create trigger handle_coupons_updated_at before update on public.coupons for each row execute procedure public.handle_updated_at();
create trigger handle_notifications_updated_at before update on public.notifications for each row execute procedure public.handle_updated_at();

-- Function to automatically create a public user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 11. ROW LEVEL SECURITY (RLS) - Basic Setup
-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.orders enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist enable row level security;
alter table public.coupons enable row level security;
alter table public.notifications enable row level security;

-- NOTE: Since you are using service_role_key in the backend, 
-- it will bypass RLS. For frontend direct access, you would need to add policies here.
