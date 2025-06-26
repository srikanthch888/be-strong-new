/*
  # Strong Strong Fitness App Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `fitness_routes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `distance` (numeric)
      - `difficulty_level` (text)
      - `duration_minutes` (integer)
      - `route_type` (text - running, walking, cycling, etc.)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
    
    - `saved_routes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `route_id` (uuid, references fitness_routes)
      - `status` (text - to-do, completed, favorite)
      - `saved_at` (timestamp)
      - `completed_at` (timestamp, optional)
      - `notes` (text, optional)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Profiles are publicly readable but only editable by owner
    - Routes can be created by any authenticated user and are publicly readable
    - Saved routes are private to each user

  3. Functions
    - Auto-create profile on user signup
    - Update timestamps on profile changes
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fitness_routes table
CREATE TABLE IF NOT EXISTS fitness_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  distance numeric(8,2) NOT NULL DEFAULT 0,
  difficulty_level text NOT NULL DEFAULT 'beginner',
  duration_minutes integer DEFAULT 0,
  route_type text NOT NULL DEFAULT 'running',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create saved_routes table
CREATE TABLE IF NOT EXISTS saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  route_id uuid REFERENCES fitness_routes(id) NOT NULL,
  status text NOT NULL DEFAULT 'to-do',
  saved_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text DEFAULT '',
  UNIQUE(user_id, route_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are publicly readable"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for fitness_routes
CREATE POLICY "Routes are publicly readable"
  ON fitness_routes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create routes"
  ON fitness_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own routes"
  ON fitness_routes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for saved_routes
CREATE POLICY "Users can view own saved routes"
  ON saved_routes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save routes"
  ON saved_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved routes"
  ON saved_routes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved routes"
  ON saved_routes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample routes for testing
INSERT INTO fitness_routes (name, description, distance, difficulty_level, duration_minutes, route_type) VALUES
('Central Park Loop', 'A scenic 6.1 mile loop through Central Park with rolling hills', 6.10, 'intermediate', 45, 'running'),
('Riverside Walk', 'Easy 2 mile walk along the riverside path', 2.00, 'beginner', 30, 'walking'),
('Mountain Trail Challenge', 'Challenging 8 mile trail run with steep climbs', 8.00, 'advanced', 75, 'trail-running'),
('City Bike Tour', '12 mile cycling route through downtown', 12.00, 'intermediate', 50, 'cycling'),
('Beach Boardwalk', 'Relaxing 3 mile walk along the beach', 3.00, 'beginner', 40, 'walking');