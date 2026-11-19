-- FreshCart account, demo order history and profile image storage.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status text not null default 'demo_placed' check (status in ('demo_placed','cancelled')),
  item_count integer not null check (item_count > 0),
  created_at timestamptz not null default now()
);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null,
  product_title text not null,
  product_image text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total numeric(12,2) not null check (line_total >= 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profile_insert_own" on public.profiles;
create policy "profile_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

-- Checkout is a single database transaction. The caller cannot choose another owner.
create or replace function public.create_demo_order(items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_total numeric(12,2) := 0;
  v_count integer := 0;
  v_item jsonb;
  v_price numeric(12,2);
  v_qty integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then raise exception 'Cart is empty'; end if;
  for v_item in select value from jsonb_array_elements(items) loop
    v_price := (v_item->>'unit_price')::numeric;
    v_qty := (v_item->>'quantity')::integer;
    if v_price < 0 or v_qty < 1 or v_qty > 99 or coalesce(v_item->>'title','') = '' then raise exception 'Invalid cart item'; end if;
    v_total := v_total + round(v_price * v_qty, 2);
    v_count := v_count + v_qty;
  end loop;
  insert into public.orders(user_id,total_amount,item_count) values (v_user,v_total,v_count) returning id into v_order;
  insert into public.order_items(order_id,product_id,product_title,product_image,unit_price,quantity,line_total)
  select v_order,(x->>'product_id')::bigint,x->>'title',nullif(x->>'image',''),(x->>'unit_price')::numeric,(x->>'quantity')::integer,round((x->>'unit_price')::numeric*(x->>'quantity')::integer,2)
  from jsonb_array_elements(items) x;
  return v_order;
end;
$$;
revoke all on function public.create_demo_order(jsonb) from public, anon;
grant execute on function public.create_demo_order(jsonb) to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.orders, public.order_items to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "avatar_read_public" on storage.objects;
create policy "avatar_read_public" on storage.objects for select to public using (bucket_id = 'avatars');
drop policy if exists "avatar_insert_own" on storage.objects;
create policy "avatar_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "avatar_update_own" on storage.objects;
create policy "avatar_update_own" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "avatar_delete_own" on storage.objects;
create policy "avatar_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
