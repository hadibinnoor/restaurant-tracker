-- Create restaurant_images table
create table if not exists public.restaurant_images (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    image_url text not null
);

-- Enable RLS
alter table public.restaurant_images enable row level security;

-- Create policies
create policy "Users can view all restaurant images"
    on public.restaurant_images for select
    using (true);

create policy "Users can insert images for their restaurants"
    on public.restaurant_images for insert
    with check (
        auth.uid() = (
            select user_id
            from public.restaurants
            where id = restaurant_id
        )
    );

create policy "Users can update images for their restaurants"
    on public.restaurant_images for update
    using (
        auth.uid() = (
            select user_id
            from public.restaurants
            where id = restaurant_id
        )
    );

create policy "Users can delete images for their restaurants"
    on public.restaurant_images for delete
    using (
        auth.uid() = (
            select user_id
            from public.restaurants
            where id = restaurant_id
        )
    );

-- Create index for faster lookups
create index restaurant_images_restaurant_id_idx on public.restaurant_images(restaurant_id);

-- Refresh schema cache
notify pgrst, 'reload schema';
