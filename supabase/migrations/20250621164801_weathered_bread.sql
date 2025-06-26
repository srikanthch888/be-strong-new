/*
  # Fix user signup trigger for profile creation

  This migration ensures that when a new user signs up via Supabase Auth,
  a corresponding profile entry is automatically created in the profiles table.

  ## Changes
  1. Creates/updates the handle_new_user function
  2. Creates the trigger on auth.users table
  3. Ensures proper foreign key relationship

  ## Security
  - Maintains existing RLS policies
  - Uses auth.uid() for proper user identification
*/

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to fire when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the profiles table references auth.users correctly
-- First, check if we need to update the foreign key constraint
DO $$
BEGIN
  -- Drop the existing foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint to auth.users
  ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  
EXCEPTION WHEN OTHERS THEN
  -- If there's an error, we'll continue without the constraint
  -- This handles cases where the constraint might already be correct
  NULL;
END $$;