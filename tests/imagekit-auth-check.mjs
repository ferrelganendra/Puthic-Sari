import crypto from 'node:crypto'
import handler, { createUploadAuth, parseBearerToken } from '../api/imagekit-auth.js'

let pass = 0
let fail = 0

function check(name, condition) {
 if (condition) {
  pass += 1
  console.log('PASS', name)
 } else {
  fail += 1
  console.log('FAIL', name)
 }
}

function mockResponse() {
 return {
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(name, value) { this.headers[name.toLowerCase()] = value },
  end(body = '') { this.body = body },
 }
}

check('Bearer token parsed case-insensitively', parseBearerToken({ headers: { authorization: 'bearer abc123' } }) === 'abc123')
check('missing Bearer token returns null', parseBearerToken({ headers: {} }) === null)

process.env.VITE_IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/fqdpfuwjf/'
const assetUrl = await import('../src/lib/assetUrl.js')
const imagekitAssets = (await import('../src/data/imagekitAssets.js')).default
check('ImageKit URL passes through unchanged',
 assetUrl.productImageUrl('https://ik.imagekit.io/fqdpfuwjf/products/test.jpg') === 'https://ik.imagekit.io/fqdpfuwjf/products/test.jpg')
check('asset inventory contains required migrated entries', ['videos/behind-the-bouquet.mp4', 'site-assets/logo.jpeg'].every((key) => imagekitAssets[key]))
check('migration inventory includes video', imagekitAssets['videos/behind-the-bouquet.mp4'] === 'migrated/videos/behind-the-bouquet.mp4')
check('migration inventory has no empty URLs', Object.values(imagekitAssets).every(Boolean))

const migratedVideo = 'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/videos/behind-the-bouquet.mp4'
check('migrated Supabase video URL maps to ImageKit',
 assetUrl.videoUrl(migratedVideo) === 'https://ik.imagekit.io/fqdpfuwjf/migrated/videos/behind-the-bouquet.mp4')
const assetUrlFallback = assetUrl.productImageUrl('https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/product-images/product-photos/Unmigrated/x.jpeg')
check('unmapped Supabase URL falls back to proxy', assetUrlFallback === `/api/img?p=${encodeURIComponent('product-images/product-photos/Unmigrated/x.jpeg')}`)
const oldVideoFallback = assetUrl.videoUrl('not-migrated.mp4')
check('unmapped video falls back to Supabase', oldVideoFallback === 'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public/videos/not-migrated.mp4')

const productForm = await import('node:fs').then(({ readFileSync }) => readFileSync(new URL('../src/components/admin/ProductForm.jsx', import.meta.url), 'utf8'))
const bannersPage = await import('node:fs').then(({ readFileSync }) => readFileSync(new URL('../src/components/admin/BannersPage.jsx', import.meta.url), 'utf8'))
const authSource = await import('node:fs').then(({ readFileSync }) => readFileSync(new URL('../api/imagekit-auth.js', import.meta.url), 'utf8'))
check('product uploads use ImageKit products folder', productForm.includes("uploadImageFiles(files, 'products')") && !productForm.includes('.storage'))
check('banner uploads use ImageKit banners folder', bannersPage.includes("uploadImage(file, 'banners')") && !bannersPage.includes('.storage'))
check('auth endpoint verifies Supabase admin role', authSource.includes('auth.getUser(accessToken)') && authSource.includes(".from('profiles')") && authSource.includes("profile?.role !== 'admin'"))
check('private key stays server-only', !productForm.includes('IMAGEKIT_PRIVATE_KEY') && !bannersPage.includes('IMAGEKIT_PRIVATE_KEY'))

const auth = createUploadAuth({
 privateKey: 'test-private-key',
 publicKey: 'public_test-key',
 now: 1700000000,
 token: 'fixed-token',
})
const expected = crypto.createHmac('sha1', 'test-private-key').update('fixed-token1700000300').digest('hex')
check('auth expiry is five minutes', auth.expire === 1700000300)
check('auth signature matches ImageKit HMAC-SHA1', auth.signature === expected)
check('auth response excludes private key', !Object.hasOwn(auth, 'privateKey'))

const missingTokenResponse = mockResponse()
await handler({ method: 'POST', headers: {} }, missingTokenResponse)
check('handler rejects missing token', missingTokenResponse.statusCode === 401)

const wrongMethodResponse = mockResponse()
await handler({ method: 'GET', headers: {} }, wrongMethodResponse)
check('handler rejects wrong method', wrongMethodResponse.statusCode === 405)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
