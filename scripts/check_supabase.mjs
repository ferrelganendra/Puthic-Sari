import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const [{ data: categories, error: catErr }, { data: occasions, error: occErr }] = await Promise.all([
  supabase.from('categories').select('id, name').order('name'),
  supabase.from('occasions').select('id, name').order('id'),
])

console.log('=== CATEGORIES TABLE ===')
if (catErr) console.log('Error:', catErr.message)
else console.log(JSON.stringify(categories, null, 2))

console.log('\n=== OCCASIONS TABLE ===')
if (occErr) console.log('Error:', occErr.message)
else console.log(JSON.stringify(occasions, null, 2))
