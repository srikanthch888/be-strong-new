import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type FitnessRoute = {
  id: string
  name: string
  description: string
  distance: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes: number
  route_type: string
  created_by: string
  created_at: string
}

export type SavedRoute = {
  id: string
  user_id: string
  route_id: string
  status: 'to-do' | 'completed' | 'favorite'
  saved_at: string
  completed_at: string | null
  notes: string
  fitness_routes?: FitnessRoute
}

export type ProcrastinationStep = {
  name: string
  description: string
  timeInvestment: string
  benefit: string
}

export type SavedProcrastinationRoute = {
  id: string
  user_id: string
  original_task: string
  title?: string | null
  route_steps: ProcrastinationStep[]
  status: 'active' | 'completed' | 'archived'
  created_at: string
  completed_at: string | null
  notes: string
  is_active: boolean
}