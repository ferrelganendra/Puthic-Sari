// Self-check: handler proxy (query-param) + assetUrl routing. Node 18+ (fetch global).
import handler from '../api/img.js'

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

// 1. query param p dengan path multi-segmen
{
  const res = mockRes()
  await handler({ query: { p: 'product-images/product-photos/Gerbera + Jute/WhatsApp Image 2026-05-13 at 13.16.34.jpeg' } }, res)
  check('query p -> 200 + immutable cache', res.statusCode === 200 && res.headers['cache-control'] === 'public, max-age=31536000, immutable')
  check('content-type image/jpeg', res.headers['content-type'] === 'image/jpeg')
  check('body non-empty', res.body && res.body.length > 1000)
}

// 2. query param path (backward compat)
{
  const res = mockRes()
  await handler({ query: { path: 'banners/poster-1.jpg' } }, res)
  check('query path -> 200', res.statusCode === 200)
}

// 3. bad bucket -> 404
{
  const res = mockRes()
  await handler({ query: { p: 'evil/x' } }, res)
  check('bad bucket -> 404', res.statusCode === 404)
}

// 4. traversal -> 400
{
  const res = mockRes()
  await handler({ query: { p: 'product-images/../../etc' } }, res)
  check('traversal -> 400', res.statusCode === 400)
}

// 5. file gak ada -> 404
{
  const res = mockRes()
  await handler({ query: { p: 'product-images/nonexistent.jpg' } }, res)
  check('missing -> 404', res.statusCode === 404)
}

// 6. assetUrl routing
const mod = await import('../src/lib/assetUrl.js')
const abs = 'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/product-images/product-photos/Gerbera + Jute/x.jpeg'
check('productImageUrl(abs) -> /api/img?p=... encoded',
  mod.productImageUrl(abs) === `/api/img?p=${encodeURIComponent('product-images/product-photos/Gerbera + Jute/x.jpeg')}`)
check('videoUrl -> tetap supabase', mod.videoUrl('behind-the-bouquet.mp4') === 'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/videos/behind-the-bouquet.mp4')
check('URL non-supabase untouched', mod.productImageUrl('https://maps.gstatic.com/x.png') === 'https://maps.gstatic.com/x.png')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
