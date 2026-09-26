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
process.env.VITE_IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/fqdpfuwjf/'
const mod = await import('../src/lib/assetUrl.js')
const abs = 'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/product-images/product-photos/Unmigrated/x.jpeg'
// Path yang belum dimigrasikan tetap fallback ke proxy dengan SINGLE encode.
check('productImageUrl(abs) -> single-encode fallback (no double)',
  mod.productImageUrl(abs) === `/api/img?p=${encodeURIComponent('product-images/product-photos/Unmigrated/x.jpeg')}`)
const migrated = 'https://ik.imagekit.io/fqdpfuwjf/migrated/product-images/6f72c006b3e1eed7-1787315722639-ffupbdl5cjt.jpg'
check('migrated ImageKit product URL routes via proxy (bypasses ISP block)',
  mod.productImageUrl(migrated) === `/api/img?p=${encodeURIComponent('migrated/product-images/6f72c006b3e1eed7-1787315722639-ffupbdl5cjt.jpg')}`)
check('videoUrl(migrated) -> Supabase Range-compatible URL (unblocked by ISP)',
  mod.videoUrl('behind-the-bouquet.mp4') === 'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/videos/behind-the-bouquet.mp4')
check('URL non-supabase untouched', mod.productImageUrl('https://maps.gstatic.com/x.png') === 'https://maps.gstatic.com/x.png')

// 7. query param p dengan path ImageKit migrated
{
  const res = mockRes()
  await handler({ query: { p: 'migrated/product-images/3d30fc96db7e26f3-WhatsApp-Image-2026-05-13-at-13.16.34.jpeg' } }, res)
  check('query p (imagekit migrated) -> 200 + immutable cache', res.statusCode === 200 && res.headers['cache-control'] === 'public, max-age=31536000, immutable')
  check('body non-empty for imagekit', res.body && res.body.length > 1000)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
