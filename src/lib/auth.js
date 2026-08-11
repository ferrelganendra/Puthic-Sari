import { supabase } from './supabase'

export async function ensureProfile(user) {
 if (!user) return null

 try {
  const { data: profile } = await supabase
   .from('profiles')
   .select('*')
   .eq('id', user.id)
   .single()

  if (profile) return profile

   const { data: newProfile } = await supabase
    .from('profiles')
    .insert({ id: user.id, email: user.email, role: 'customer' })
    .select()
    .single()


  if (newProfile) return newProfile
 } catch (e) {
  // works until profile loads
 }

 return { id: user.id, email: user.email, role: 'customer' }
}

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
