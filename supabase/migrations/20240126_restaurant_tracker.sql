-- Drop existing tables and policies
drop policy if exists "Users can view all restaurants" on public.restaurants;
drop policy if exists "Users can insert their own restaurants" on public.restaurants;
drop policy if exists "Users can update their own restaurants" on public.restaurants;
drop policy if exists "Users can delete their own restaurants" on public.restaurants;
drop table if exists public.restaurants;

-- Drop existing storage policies
drop policy if exists "Anyone can view restaurant images" on storage.objects;
drop policy if exists "Authenticated users can upload restaurant images" on storage.objects;
drop policy if exists "Users can update their own restaurant images" on storage.objects;
drop policy if exists "Users can delete their own restaurant images" on storage.objects;

-- Create restaurants table
create table public.restaurants (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    latitude numeric not null,
    longitude numeric not null,
    opening_time time not null,
    closing_time time not null,
    recommended_dishes text[] not null default '{}',
    image_url text,
    tags text[] not null default '{}'
);

-- Enable RLS
alter table public.restaurants enable row level security;

-- Create restaurant policies
create policy "Users can view all restaurants"
    on public.restaurants for select
    using (true);

create policy "Users can insert their own restaurants"
    on public.restaurants for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own restaurants"
    on public.restaurants for update
    using (auth.uid() = user_id);

create policy "Users can delete their own restaurants"
    on public.restaurants for delete
    using (auth.uid() = user_id);

-- Create storage bucket
create policy "Public Access"
    on storage.buckets for select
    using ( true );

insert into storage.buckets (id, name, public)
values ('restaurant-images', 'restaurant-images', true)
on conflict (id) do nothing;

-- Create storage policies
create policy "Anyone can view restaurant images"
    on storage.objects for select
    using ( bucket_id = 'restaurant-images' );

create policy "Authenticated users can upload restaurant images"
    on storage.objects for insert
    with check (
        bucket_id = 'restaurant-images'
        and auth.role() = 'authenticated'
    );

create policy "Users can update their own restaurant images"
    on storage.objects for update
    using (
        bucket_id = 'restaurant-images'
        and auth.uid() = owner
    );

create policy "Users can delete their own restaurant images"
    on storage.objects for delete
    using (
        bucket_id = 'restaurant-images'
        and auth.uid() = owner
    );

-- Refresh schema cache
notify pgrst, 'reload schema';
