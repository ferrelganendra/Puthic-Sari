// Self-check: handler proxy + assetUrl routing. Node 18+ (fetch global).
import handler from '../api/img/[...path].js'

function mockRes() {
  const res = { statusCode: 200, headers: {}, body: null,
    setHeader(k, v) { this.headers[k] = v }, end(d) { this.body = d } }
  return res
}

let pass = 0, fail = 0
function check(name, cond) {
  if (cond) { pass++; console.log('PASS', name) }
  else { fail++; console.log('FAIL', name) }
}

// 1. path decoded (spasi beneran, seperti dari Vercel query)
{
  const res = mockRes()
  await handler({ query: { path: ['product-images', 'product-photos', 'Gerbera + Jute', 'WhatsApp Image 2026-05-13 at 13.16.34.jpeg'] } }, res)
  check('abs url -> 200 + immutable cache', res.statusCode === 200 && res.headers['cache-control'] === 'public, max-age=31536000, immutable')
  check('content-type image/jpeg', res.headers['content-type'] === 'image/jpeg')
  check('body non-empty', res.body && res.body.length > 1000)
}

// 2. Bukan bucket valid -> 404
{
  const res = mockRes()
  await handler({ query: { path: ['evil', 'x'] } }, res)
  check('bad bucket -> 404', res.statusCode === 404)
}

// 3. Path traversal ditolak
{
  const res = mockRes()
  await handler({ query: { path: ['product-images', '..', '..', 'etc'] } }, res)
  check('traversal -> 400', res.statusCode === 400)
}

// 4. File gak ada -> 404
{
  const res = mockRes()
  await handler({ query: { path: ['product-images', 'nonexistent.jpg'] } }, res)
  check('missing file -> 404', res.statusCode === 404)
}

// 5. assetUrl routing
const mod = await import('../src/lib/assetUrl.js')
const abs = 'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/product-images/product-photos/Gerbera + Jute/x.jpeg'
check('productImageUrl(abs supabase) -> /api/img/... (no double slash)',
  mod.productImageUrl(abs) === '/api/img/product-images/product-photos/Gerbera + Jute/x.jpeg')
check('videoUrl -> tetap supabase', mod.videoUrl('behind-the-bouquet.mp4') === 'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/videos/behind-the-bouquet.mp4')
check('URL non-supabase untouched', mod.productImageUrl('https://maps.gstatic.com/x.png') === 'https://maps.gstatic.com/x.png')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
