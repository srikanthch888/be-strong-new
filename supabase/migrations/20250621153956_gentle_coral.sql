/*
  # Enhanced Procrastination Routes Schema

  1. Schema Updates
    - Add `title` field for custom route names
    - Add `status` field for completion tracking  
    - Add `completed_at` timestamp
    - Add `notes` field for user notes

  2. Features Support
    - Custom route titles
    - Completion status tracking
    - User notes and annotations
    - Better indexing for performance
*/

-- Add new columns to support enhanced features
DO $$
BEGIN
  -- Add title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_procrastination_routes' AND column_name = 'title'
  ) THEN
    ALTER TABLE saved_procrastination_routes ADD COLUMN title text;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_procrastination_routes' AND column_name = 'status'
  ) THEN
    ALTER TABLE saved_procrastination_routes ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));
  END IF;

  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_procrastination_routes' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE saved_procrastination_routes ADD COLUMN completed_at timestamptz;
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_procrastination_routes' AND column_name = 'notes'
  ) THEN
    ALTER TABLE saved_procrastination_routes ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- Add indexes for better performance on sorting and filtering
CREATE INDEX IF NOT EXISTS idx_saved_procrastination_routes_status 
  ON saved_procrastination_routes(status);

CREATE INDEX IF NOT EXISTS idx_saved_procrastination_routes_title 
  ON saved_procrastination_routes(title);

CREATE INDEX IF NOT EXISTS idx_saved_procrastination_routes_completed_at 
  ON saved_procrastination_routes(completed_at DESC);