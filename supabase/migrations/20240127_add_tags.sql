-- Add tags column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.restaurants 
        ADD COLUMN tags text[] not null default '{}';
    END IF;
END $$;
