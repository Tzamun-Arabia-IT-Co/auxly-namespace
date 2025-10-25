-- Fix migration tracking for add-admin-role
-- This migration was partially applied, so we need to mark it as complete

INSERT INTO public.pgmigrations (name, run_on) 
VALUES ('1760500000000_add-admin-role', NOW())
ON CONFLICT (name) DO NOTHING;

-- Show all migrations
SELECT * FROM public.pgmigrations ORDER BY run_on;




