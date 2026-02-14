-- 1. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';

-- 2. Grant usage on public schema (just to be safe)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. Grant all privileges on all tables in public to these roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Grant all privileges on all sequences (for auto-increment IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Disable RLS on 'users' table (simplest fix for now)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 6. Verify one table
SELECT * FROM public.users LIMIT 1;
