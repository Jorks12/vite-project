import { supabase } from './supabase'

export type SupabaseUser = {
  id: string
  email: string
  display_name: string
  role: string
}

/**
 * Fetch all users from the public.users table in Supabase.
 * Returns id, email, display_name, and role for each user.
 */
export async function getSupabaseUsers(): Promise<SupabaseUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .order('display_name', { ascending: true })

  if (error) {
    console.warn('Failed to fetch Supabase users:', error.message)
    return []
  }

  return (data ?? []).map((u) => ({
    id: u.id ?? '',
    email: u.email ?? '',
    display_name: u.display_name ?? u.email?.split('@')[0] ?? '',
    role: u.role ?? 'student',
  }))
}
