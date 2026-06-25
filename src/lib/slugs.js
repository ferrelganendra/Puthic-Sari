export const slugify = (value = '') => String(value)
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, '-')
 .replace(/^-+|-+$/g, '')

export const getProductSlug = (product) => {
 if (!product) return ''
 const base = slugify(product.name || product.title || '')
 return product.id ? `${product.id}-${base}` : base
}

export const getProductPath = (product) => `/products/${getProductSlug(product)}`

export const findProductBySlug = (products = [], slug = '') => {
 const target = String(slug).trim()
 return products.find(product => getProductSlug(product) === target || slugify(product.name) === target)
}
