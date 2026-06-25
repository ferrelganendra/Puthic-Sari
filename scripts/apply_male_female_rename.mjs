import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

console.log('Renaming Male → Pria and Female → Wanita in categories + products...')

const { data: catData, error: catErr } = await supabase
  .from('categories')
  .update({ name: 'Pria' })
  .eq('name', 'Male')
  .select('id, name')

const { data: catData2, error: catErr2 } = await supabase
  .from('categories')
  .update({ name: 'Wanita' })
  .eq('name', 'Female')
  .select('id, name')

if (catErr) console.log('Categories Male→Pria error:', catErr.message)
else console.log('Renamed:', catData)
if (catErr2) console.log('Categories Female→Wanita error:', catErr2.message)
else console.log('Renamed:', catData2)

const { data: prodData, error: prodErr } = await supabase
  .from('products')
  .update({ category: 'Pria' })
  .eq('category', 'Male')
  .select('id, name, category')

const { data: prodData2, error: prodErr2 } = await supabase
  .from('products')
  .update({ category: 'Wanita' })
  .eq('category', 'Female')
  .select('id, name, category')

if (prodErr) console.log('Products Male→Pria error:', prodErr.message)
else console.log('Renamed products:', prodData)
if (prodErr2) console.log('Products Female→Wanita error:', prodErr2.message)
else console.log('Renamed products:', prodData2)
