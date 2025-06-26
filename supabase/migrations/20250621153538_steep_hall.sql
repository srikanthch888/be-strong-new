/*
  # Add Procrastination Routes Feature

  1. New Tables
    - `saved_procrastination_routes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `original_task` (text)
      - `route_steps` (jsonb array)
      - `created_at` (timestamp)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `saved_procrastination_routes` table
    - Add policies for authenticated users to manage their own routes
*/

CREATE TABLE IF NOT EXISTS saved_procrastination_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_task text NOT NULL,
  route_steps jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE saved_procrastination_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own procrastination routes"
  ON saved_procrastination_routes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own procrastination routes"
  ON saved_procrastination_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own procrastination routes"
  ON saved_procrastination_routes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own procrastination routes"
  ON saved_procrastination_routes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_saved_procrastination_routes_user_id 
  ON saved_procrastination_routes(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_procrastination_routes_created_at 
  ON saved_procrastination_routes(created_at DESC);