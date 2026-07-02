export function getFinalPrice(product) {
 if (!product) return 0
 const discount = Math.min(100, Math.max(0, Number(product.discount_percent || 0)))
 if (discount > 0) {
  return Math.round(Number(product.price || 0) * (1 - discount / 100))
 }
 return Number(product.price || 0)
}

export function hasDiscount(product) {
 return (product?.discount_percent || 0) > 0
}

export function formatPrice(price) {
 return new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
 }).format(price || 0)
}
