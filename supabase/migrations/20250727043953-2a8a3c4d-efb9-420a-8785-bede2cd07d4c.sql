-- Remove the problematic trigger function that references non-existent user_roles table
DROP FUNCTION IF EXISTS public.handle_user_creation() CASCADE;

-- The handle_new_user() function already handles user creation properly
-- so we don't need the handle_user_creation() function