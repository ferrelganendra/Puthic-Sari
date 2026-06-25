import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const [{ data: categories }, { data: occasions }, { data: products }] = await Promise.all([
  supabase.from('categories').select('id, name').order('name'),
  supabase.from('occasions').select('id, name').order('id'),
  supabase.from('products').select('id, name, category').order('id'),
])

console.log('=== CATEGORIES TABLE (final) ===')
console.log(JSON.stringify(categories, null, 2))

console.log('\n=== OCCASIONS TABLE (final) ===')
console.log(JSON.stringify(occasions, null, 2))

console.log('\n=== PRODUCTS: Category Distribution ===')
const catCounts = {}
products?.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1 })
console.log(JSON.stringify(catCounts, null, 2))

console.log('\n=== PRODUCTS with Male/Female category? ===')
const bad = products?.filter(p => ['Male', 'Female'].includes(p.category))
if (bad?.length) console.log('FOUND:', bad)
else console.log('None - all renamed to Pria/Wanita ✓')
