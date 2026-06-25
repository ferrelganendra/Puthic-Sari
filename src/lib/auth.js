import { supabase } from './supabase'

/**
 * Get user profile. Admin authority comes only from the profiles table.
 */
export async function ensureProfile(user) {
 if (!user) return null

 // Try to get/create profile in background (best effort)
 try {
  const { data: profile } = await supabase
   .from('profiles')
   .select('*')
   .eq('id', user.id)
   .single()

  if (profile) return profile

  // Try to create profile
   const { data: newProfile } = await supabase
    .from('profiles')
    .insert({ id: user.id, email: user.email, role: 'customer' })
    .select()
    .single()


  if (newProfile) return newProfile
 } catch (e) {
  // Ignore — fallback below
 }

 // Fallback: default to non-admin until profile is readable.
 return { id: user.id, email: user.email, role: 'customer' }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId) {
 try {
  const { data } = await supabase
   .from('profiles')
   .select('role')
   .eq('id', userId)
   .single()

  return data?.role === 'admin'
 } catch (e) {
  return false
 }
}
