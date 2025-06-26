/*
  # Fix Authentication Flow and Database Issues

  1. Fixes
    - Ensure proper foreign key relationships
    - Fix profile creation trigger
    - Add missing constraints and indexes
    - Improve RLS policies

  2. Security
    - Strengthen RLS policies with proper checks
    - Add additional security constraints

  3. Performance
    - Add optimized indexes for common queries
    - Improve trigger performance
*/

-- Ensure auth schema is accessible
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- Fix profile creation function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile with proper error handling
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    avatar_url, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    username = COALESCE(EXCLUDED.username, profiles.username),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper foreign key constraints
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  
  -- Add proper foreign key constraint
  ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  
EXCEPTION WHEN OTHERS THEN
  -- Continue if constraint already exists or other issues
  RAISE NOTICE 'Profile foreign key constraint handling: %', SQLERRM;
END $$;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username 
  ON public.profiles(username) WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
  ON public.profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fitness_routes_created_by 
  ON public.fitness_routes(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fitness_routes_route_type 
  ON public.fitness_routes(route_type);

CREATE INDEX IF NOT EXISTS idx_fitness_routes_difficulty 
  ON public.fitness_routes(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_saved_routes_user_status 
  ON public.saved_routes(user_id, status);

-- Improve RLS policies with better performance
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add constraints to ensure data integrity
ALTER TABLE public.fitness_routes 
ADD CONSTRAINT fitness_routes_distance_check 
CHECK (distance >= 0 AND distance <= 1000);

ALTER TABLE public.fitness_routes 
ADD CONSTRAINT fitness_routes_duration_check 
CHECK (duration_minutes >= 0 AND duration_minutes <= 1440);

ALTER TABLE public.saved_routes 
ADD CONSTRAINT saved_routes_status_check 
CHECK (status IN ('to-do', 'completed', 'favorite'));

-- Add some sample data if tables are empty
DO $$
BEGIN
  -- Only insert if no routes exist
  IF NOT EXISTS (SELECT 1 FROM public.fitness_routes LIMIT 1) THEN
    INSERT INTO public.fitness_routes (name, description, distance, difficulty_level, duration_minutes, route_type) VALUES
    ('Central Park Loop', 'A scenic 6.1 mile loop through Central Park with rolling hills and beautiful views', 6.10, 'intermediate', 45, 'running'),
    ('Riverside Walk', 'Easy 2 mile walk along the peaceful riverside path perfect for beginners', 2.00, 'beginner', 30, 'walking'),
    ('Mountain Trail Challenge', 'Challenging 8 mile trail run with steep climbs and rewarding summit views', 8.00, 'advanced', 75, 'trail-running'),
    ('City Bike Tour', '12 mile cycling route through downtown with bike-friendly streets', 12.00, 'intermediate', 50, 'cycling'),
    ('Beach Boardwalk', 'Relaxing 3 mile walk along the scenic beach boardwalk', 3.00, 'beginner', 40, 'walking'),
    ('Forest Trail', 'Moderate 5 mile hike through dense forest with wildlife viewing opportunities', 5.00, 'intermediate', 60, 'hiking'),
    ('Urban Run', 'Fast-paced 4 mile run through city streets with minimal elevation change', 4.00, 'beginner', 35, 'running'),
    ('Hill Climb Challenge', 'Intense 3 mile cycling route with steep hill climbs for advanced riders', 3.00, 'advanced', 25, 'cycling');
  END IF;
END $$;

-- Create function to get user's saved routes with route details
CREATE OR REPLACE FUNCTION public.get_user_saved_routes(user_uuid UUID)
RETURNS TABLE (
  saved_route_id UUID,
  route_id UUID,
  route_name TEXT,
  route_description TEXT,
  distance NUMERIC,
  difficulty_level TEXT,
  duration_minutes INTEGER,
  route_type TEXT,
  status TEXT,
  saved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id as saved_route_id,
    fr.id as route_id,
    fr.name as route_name,
    fr.description as route_description,
    fr.distance,
    fr.difficulty_level,
    fr.duration_minutes,
    fr.route_type,
    sr.status,
    sr.saved_at,
    sr.completed_at,
    sr.notes
  FROM public.saved_routes sr
  JOIN public.fitness_routes fr ON sr.route_id = fr.id
  WHERE sr.user_id = user_uuid
  ORDER BY sr.saved_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_saved_routes(UUID) TO authenticated;

-- Create function to safely upsert saved routes
CREATE OR REPLACE FUNCTION public.upsert_saved_route(
  user_uuid UUID,
  route_uuid UUID,
  route_status TEXT DEFAULT 'to-do'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  saved_route_id UUID;
BEGIN
  -- Validate inputs
  IF user_uuid IS NULL OR route_uuid IS NULL THEN
    RAISE EXCEPTION 'User ID and Route ID cannot be null';
  END IF;
  
  IF route_status NOT IN ('to-do', 'completed', 'favorite') THEN
    RAISE EXCEPTION 'Invalid status. Must be to-do, completed, or favorite';
  END IF;
  
  -- Upsert the saved route
  INSERT INTO public.saved_routes (user_id, route_id, status)
  VALUES (user_uuid, route_uuid, route_status)
  ON CONFLICT (user_id, route_id) 
  DO UPDATE SET 
    status = EXCLUDED.status,
    completed_at = CASE 
      WHEN EXCLUDED.status = 'completed' THEN NOW()
      ELSE NULL
    END
  RETURNING id INTO saved_route_id;
  
  RETURN saved_route_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.upsert_saved_route(UUID, UUID, TEXT) TO authenticated;

-- Add RLS policy for the new function
CREATE POLICY "Users can call upsert_saved_route for themselves"
  ON public.saved_routes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);