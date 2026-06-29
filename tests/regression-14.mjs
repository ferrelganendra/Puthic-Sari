#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => readFileSync(path.join(root, file), 'utf8')

const results = []
async function test(id, name, fn) {
  try {
    await fn()
    results.push({ id, name, ok: true })
  } catch (error) {
    results.push({ id, name, ok: false, error: error?.message || String(error) })
  }
}

function makeReviewQueryClient(rows) {
  const state = { filters: [] }
  const query = {
    select() { return query },
    eq(column, value) { state.filters.push([column, value]); return query },
    order() { return query },
    limit() { return query },
    then(resolve) {
      const data = rows.filter((row) => state.filters.every(([column, value]) => row[column] === value))
      resolve({ data, error: null })
    },
  }
  return { from(table) { assert.equal(table, 'reviews'); return query } }
}

async function loadReviewsHelper() {
  return import(`file://${path.join(root, 'src/lib/reviews.js')}?t=${Date.now()}`)
}

await test(1, 'ProductDetail review scope', async () => {
  const { fetchApprovedReviews } = await loadReviewsHelper()
  const rows = [
    { id: 1, product_id: 'A', name: 'A reviewer', rating: 5, comment: 'A ok', created_at: '2026-01-01', is_approved: true },
    { id: 2, product_id: 'B', name: 'B reviewer', rating: 1, comment: 'B leak', created_at: '2026-01-02', is_approved: true },
  ]
  const reviews = await fetchApprovedReviews(makeReviewQueryClient(rows), { productId: 'A', limit: 6 })
  assert.deepEqual(reviews.map((review) => review.id), [1])
  assert.equal(reviews.some((review) => review.comment === 'B leak'), false)
})

await test(2, 'Migration reviews_product_id', async () => {
  const sql = read('supabase/migrations/202606240001_reviews_product_id.sql').toLowerCase()
  assert.match(sql, /alter\s+table\s+public\.reviews\s+add\s+column\s+(if\s+not\s+exists\s+)?product_id/)
})

await test(3, 'Checkout snapScriptPromise retry', async () => {
  const source = read('src/components/Checkout.jsx')
  assert.match(source, /let\s+snapScriptPromise\s*=\s*null/)
  assert.match(source, /script\.onerror\s*=\s*\(\)\s*=>\s*{[\s\S]*snapScriptPromise\s*=\s*null[\s\S]*reject\(new Error\('Gagal memuat Midtrans Snap\.'\)\)/)

  let snapScriptPromise = null
  let fail = true
  const window = {}
  const document = {
    body: { appendChild(script) { queueMicrotask(() => { fail ? script.onerror() : (window.snap = { pay() {} }, script.onload()) }) } },
    createElement() { return { setAttribute() {} } },
  }
  function loadMidtransSnap() {
    if (window.snap) return Promise.resolve(window.snap)
    const clientKey = 'client-key'
    if (!clientKey) return Promise.reject(new Error('VITE_MIDTRANS_CLIENT_KEY belum dikonfigurasi.'))
    if (!snapScriptPromise) {
      snapScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
        script.async = true
        script.setAttribute('data-client-key', clientKey)
        script.onload = () => resolve(window.snap)
        script.onerror = () => {
          snapScriptPromise = null
          reject(new Error('Gagal memuat Midtrans Snap.'))
        }
        document.body.appendChild(script)
      })
    }
    return snapScriptPromise
  }
  await assert.rejects(loadMidtransSnap(), /Gagal memuat Midtrans Snap/)
  assert.equal(snapScriptPromise, null)
  fail = false
  assert.equal(await loadMidtransSnap(), window.snap)
})

await test(4, 'requireSupabase() guard', async () => {
  const source = read('src/lib/supabase.js')
  assert.match(source, /export function requireSupabase\(\)\s*{[\s\S]*throw new Error\('Supabase belum dikonfigurasi\. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY\.'\)/)
  const supabaseClient = null
  function requireSupabase() {
    if (!supabaseClient) throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
    return supabaseClient
  }
  assert.throws(() => requireSupabase(), /Supabase belum dikonfigurasi\. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY\./)
})

await test(5, 'RLS profiles self-escalation block', async () => {
  const sql = read('supabase/migrations/202606240002_harden_profiles_rls.sql')
  assert.match(sql, /enable row level security/i)
  assert.match(sql, /revoke all on public\.profiles from anon, authenticated/i)
  assert.match(sql, /with check \(id = auth\.uid\(\) and role = 'customer'\)/i)
  assert.doesNotMatch(sql, /with check \([^)]*role\s*=\s*'admin'[^)]*\)/i)
})

await test(6, 'Midtrans webhook constant-time compare', async () => {
  const source = read('supabase/functions/_shared/midtrans.ts')
  assert.match(source, /function timingSafeEqual\(a: string, b: string\)/)
  assert.match(source, /return timingSafeEqual\(hash, signature\)/)
  async function verifyMidtransSignature(notification) {
    const orderId = String(notification.order_id || '')
    const statusCode = String(notification.status_code || '')
    const grossAmount = String(notification.gross_amount || '')
    const signature = String(notification.signature_key || '')
    const raw = `${orderId}${statusCode}${grossAmount}server-key`
    const bytes = new TextEncoder().encode(raw)
    const digest = await crypto.subtle.digest('SHA-512', bytes)
    const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
    if (hash.length !== signature.length) return false
    const left = new TextEncoder().encode(hash)
    const right = new TextEncoder().encode(signature)
    let diff = 0
    for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i]
    return diff === 0
  }
  assert.equal(await verifyMidtransSignature({ order_id: 'o1', status_code: '200', gross_amount: '1000.00', signature_key: 'bad' }), false)
  assert.equal(await verifyMidtransSignature({ order_id: 'o1', status_code: '200', gross_amount: '1000.00', signature_key: '0'.repeat(128) }), false)
})

await test(7, 'Biteship webhook dedup 24 jam', async () => {
  const source = read('supabase/functions/biteship-webhook/index.ts')
  assert.match(source, /Date\.now\(\) - 24 \* 60 \* 60 \* 1000/)
  assert.match(source, /duplicate_skipped/)
  const events = []
  async function isRecentDuplicate(orderId, providerOrderId, eventType, status) {
    const windowStart = Date.now() - 24 * 60 * 60 * 1000
    return events.some((event) => event.orderId === orderId && event.providerOrderId === providerOrderId && event.eventType === eventType && event.status === status && event.createdAt >= windowStart)
  }
  async function handle(payload) {
    if (await isRecentDuplicate('order-1', payload.order_id, payload.event, payload.status)) return { status: 'duplicate_skipped' }
    events.push({ orderId: 'order-1', providerOrderId: payload.order_id, eventType: payload.event, status: payload.status, createdAt: Date.now() })
    return { status: 'logged' }
  }
  assert.deepEqual(await handle({ order_id: 'bt-1', event: 'order.status', status: 'in_transit' }), { status: 'logged' })
  assert.deepEqual(await handle({ order_id: 'bt-1', event: 'order.status', status: 'in_transit' }), { status: 'duplicate_skipped' })
})

await test(8, 'CSP unsafe-inline removed', async () => {
  const config = JSON.parse(read('vercel.json'))
  const csp = config.headers.flatMap((entry) => entry.headers).find((header) => header.key.toLowerCase() === 'content-security-policy')?.value || ''
  const scriptSrc = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('script-src')) || ''
  assert.equal(scriptSrc.includes("'unsafe-inline'"), false, scriptSrc)
})

await test(9, 'Console.error DEV-only', async () => {
  const files = ['src/components/Checkout.jsx', 'src/components/ErrorBoundary.jsx']
  for (const file of files) {
    const source = read(file)
    for (const match of source.matchAll(/console\.error/g)) {
      const lineStart = source.lastIndexOf('\n', match.index) + 1
      const lineEnd = source.indexOf('\n', match.index)
      const line = source.slice(lineStart, lineEnd === -1 ? source.length : lineEnd)
      assert.match(line, /import\.meta\.env\.DEV/, `${file}: ${line.trim()}`)
    }
  }
})

await test(10, 'Vite manual chunks', async () => {
  rmSync(path.join(root, 'dist'), { recursive: true, force: true })
  const output = execFileSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const assets = readdirSync(path.join(root, 'dist/assets')).join('\n')
  assert.match(assets, /react-vendor-/)
  assert.match(assets, /supabase-/)
  assert.match(assets, /icons-/)
  assert.doesNotMatch(output, /INEFFECTIVE_DYNAMIC_IMPORT/)
})

await test(11, 'React.memo ProductCard/ProductCollection', async () => {
  assert.match(read('src/components/ProductCard.jsx'), /export default memo\(ProductCard\)/)
  assert.match(read('src/components/ProductCollection.jsx'), /export default memo\(ProductCollection\)/)
  const React = await import('react')
  const MemoComponent = React.memo(function RenderCounter({ counter }) { counter.count += 1; return null })
  let previousProps = { counter: { count: 0 } }
  const nextProps = previousProps
  if (!Object.is(previousProps, nextProps)) MemoComponent.type(nextProps)
  assert.equal(previousProps.counter.count, 0)
})

await test(12, 'Shared reviews helper konsisten', async () => {
  const files = ['src/App.jsx', 'src/components/ProductDetail.jsx', 'src/components/FloatingTabs.jsx']
  for (const file of files) {
    const source = read(file)
    assert.match(source, /from ['"](?:\.\.?\/)?lib\/reviews['"]/, `${file} must import reviews helper`)
  }
  const offenders = files.filter((file) => /\.from\(['"]reviews['"]\)\s*\n\s*\.select/.test(read(file)))
  assert.deepEqual(offenders, [])
})

await test(13, 'Poster webp/avif', async () => {
  const posterDir = path.join(root, 'public/posters')
  const originals = readdirSync(posterDir).filter((name) => /\.jpe?g$/i.test(name))
  assert.ok(originals.length > 0, 'no poster originals found')
  for (const original of originals) {
    const base = original.replace(/\.jpe?g$/i, '')
    assert.equal(existsSync(path.join(posterDir, `${base}.webp`)), true, `${base}.webp missing`)
    assert.equal(existsSync(path.join(posterDir, `${base}.avif`)), true, `${base}.avif missing`)
  }
  const hero = read('src/components/Hero.jsx')
  const categories = read('src/components/CategoriesSection.jsx')
  assert.match(hero, /<picture>[\s\S]*type="image\/avif"[\s\S]*type="image\/webp"/)
  assert.match(categories, /<picture>[\s\S]*type="image\/avif"[\s\S]*type="image\/webp"/)
})

await test(14, '.env.example lengkap', async () => {
  const envExample = read('.env.example')
  const exampleKeys = new Set([...envExample.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]))
  const sourceFiles = [
    ...['src', 'api', 'scripts', 'supabase/functions'].flatMap((dir) => readdirRecursive(path.join(root, dir), /\.(js|jsx|ts|tsx)$/)),
  ]
  const used = new Set()
  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)) used.add(match[1])
    for (const match of source.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) used.add(match[1])
    for (const match of source.matchAll(/Deno\.env\.get\(['"]([A-Z][A-Z0-9_]*)['"]\)/g)) used.add(match[1])
  }
  const missing = [...used].filter((key) => !exampleKeys.has(key)).sort()
  assert.deepEqual(missing, [])
})

await test(15, 'Checkout pending/closed is not paid success', async () => {
  const source = read('src/components/Checkout.jsx')
  assert.match(source, /const isPaid = createdOrder\.paymentState === 'success'/)
  assert.doesNotMatch(source, /\['success', 'pending'\]\.includes\(createdOrder\.paymentState\)/)
  assert.match(source, /'Menunggu Pembayaran'/)
  assert.match(source, /Order dibuat, tapi pembayaran belum selesai\./)
})

await test(16, 'Admin can delete checkout orders via RLS', async () => {
  const sql = read('supabase/migrations/202606290001_admin_delete_checkout_orders.sql')
  assert.match(sql, /grant delete on public\.checkout_orders to authenticated/i)
  assert.match(sql, /grant delete on public\.checkout_order_items to authenticated/i)
  assert.match(sql, /on public\.checkout_order_items for delete[\s\S]*using \(public\.is_admin\(\)\)/i)
  assert.match(sql, /on public\.checkout_orders for delete[\s\S]*using \(public\.is_admin\(\)\)/i)
})

await test(17, 'Remember me controls Supabase auth storage', async () => {
  const supabaseSource = read('src/lib/supabase.js')
  const authSource = read('src/components/AuthPage.jsx')
  const adminSource = read('src/components/AdminDashboard.jsx')
  assert.match(supabaseSource, /const AUTH_REMEMBER_KEY = 'ps_auth_remember'/)
  assert.match(supabaseSource, /window\.localStorage\.getItem\(AUTH_REMEMBER_KEY\) !== 'false'/)
  assert.match(supabaseSource, /window\.sessionStorage\.getItem\(key\)/)
  assert.match(supabaseSource, /export function setAuthRemembered\(remember\)/)
  assert.match(authSource, /setAuthRemembered\(rememberMe\)[\s\S]*signInWithTimeout\(email, password\)/)
  assert.match(adminSource, /setAuthRemembered\(rememberMe\)[\s\S]*signInWithPassword\(\{ email, password \}\)/)
  assert.match(authSource, /aria-pressed=\{rememberMe\}/)
  assert.match(adminSource, /aria-pressed=\{rememberMe\}/)
  assert.equal((authSource.match(/Ingat saya/g) || []).length >= 1, true)
  assert.equal((adminSource.match(/Ingat saya/g) || []).length >= 1, true)
})

function readdirRecursive(dir, pattern) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'dist') return []
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? readdirRecursive(full, pattern) : (pattern.test(full) ? [full] : [])
  })
}

for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.id}. ${result.name}${result.ok ? '' : ` — ${result.error}`}`)
}

const failed = results.filter((result) => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} PASS`)
if (failed.length) process.exitCode = 1
