/*
  # Fix user signup trigger

  1. Changes
     - Add missing trigger to automatically create profile entries when new users sign up
     - This trigger calls the existing `handle_new_user()` function whenever a user is inserted into `auth.users`

  2. Security
     - No RLS changes needed as the existing policies are sufficient
     - The trigger function already has SECURITY DEFINER to run with elevated privileges

  3. Notes
     - This resolves the "Database error saving new user" error during signup
     - The function extracts user metadata (username, full_name) from the auth signup data
*/

-- Create the trigger that calls handle_new_user() when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();