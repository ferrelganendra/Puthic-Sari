import { createSupabaseAdmin } from './supabase.ts'

const DEFAULT_ITEM_WEIGHT = Number(Deno.env.get('BITESHIP_DEFAULT_ITEM_WEIGHT_GRAMS') || 500)
const DEFAULT_ITEM_LENGTH = Number(Deno.env.get('BITESHIP_DEFAULT_ITEM_LENGTH_CM') || 30)
const DEFAULT_ITEM_WIDTH = Number(Deno.env.get('BITESHIP_DEFAULT_ITEM_WIDTH_CM') || 20)
const DEFAULT_ITEM_HEIGHT = Number(Deno.env.get('BITESHIP_DEFAULT_ITEM_HEIGHT_CM') || 10)
const MAX_ITEM_QUANTITY = 10

function positiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback
}

function itemDimensions(product: Record<string, unknown>) {
  return {
    length: positiveNumber(product.length_cm, DEFAULT_ITEM_LENGTH),
    width: positiveNumber(product.width_cm, DEFAULT_ITEM_WIDTH),
    height: positiveNumber(product.height_cm, DEFAULT_ITEM_HEIGHT),
  }
}

function chargeableWeight(product: Record<string, unknown>) {
  const actualWeight = positiveNumber(product.weight_grams, DEFAULT_ITEM_WEIGHT)
  if (!product.length_cm || !product.width_cm || !product.height_cm) return actualWeight
  const { length, width, height } = itemDimensions(product)
  const volumetricWeight = Math.ceil((length * width * height) / 6)
  return Math.max(actualWeight, volumetricWeight)
}

type CartInput = Array<{ id: number | string; quantity?: number | string }>

function finalPrice(product: { price: number; discount_percent?: number | null }) {
  const discount = Math.min(100, Math.max(0, Number(product.discount_percent || 0)))
  if (discount > 0) return Math.round(Number(product.price) * (1 - discount / 100))
  return Number(product.price)
}

export async function buildCheckoutItems(cart: CartInput) {
  const requested = (Array.isArray(cart) ? cart : [])
    .map((item) => {
      const quantity = Number(item.quantity || 1)
      return {
        id: Number(item.id),
        quantity: Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number.isFinite(quantity) ? quantity : 1))),
      }
    })
    .filter((item) => Number.isInteger(item.id) && item.id > 0)

  if (!requested.length) throw new Error('Keranjang kosong.')

  const ids = [...new Set(requested.map((item) => item.id))]
  const supabase = createSupabaseAdmin()
  const { data: products, error } = await supabase
    .from('products')
    .select('id,name,description,category,price,discount_percent,is_active,is_sold_out,weight_grams,length_cm,width_cm,height_cm')
    .in('id', ids)

  if (error) throw error

  const byId = new Map((products || []).map((product) => [Number(product.id), product]))
  const items = requested.map((requestedItem) => {
    const product = byId.get(requestedItem.id)
    if (!product) throw new Error('Produk tidak ditemukan.')
    if (product.is_active === false) throw new Error(`${product.name} tidak aktif.`)
    if (product.is_sold_out) throw new Error(`${product.name} sedang sold out.`)

    const unitPrice = finalPrice(product)
    const dimensions = itemDimensions(product)
    return {
      product,
      productId: Number(product.id),
      name: String(product.name).slice(0, 120),
      description: String(product.description || product.category || 'Buket bunga').slice(0, 180),
      quantity: requestedItem.quantity,
      unitPrice,
      subtotal: unitPrice * requestedItem.quantity,
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      weight: chargeableWeight(product),
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  return { items, subtotal }
}

export function biteshipItems(items: Awaited<ReturnType<typeof buildCheckoutItems>>['items']) {
  return items.map((item) => ({
    name: item.name,
    description: item.description,
    value: item.unitPrice,
    quantity: item.quantity,
    length: item.length,
    width: item.width,
    height: item.height,
    weight: item.weight,
  }))
}

export function biteshipItemsFromOrderRows(items: Array<Record<string, unknown>>) {
  return items.map((item) => {
    const snapshot = (item.product_snapshot || {}) as Record<string, unknown>
    const dimensions = itemDimensions(snapshot)
    return {
      name: String(item.product_name || 'Produk Puthic Sari').slice(0, 120),
      description: String(item.product_description || 'Buket bunga').slice(0, 180),
      value: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      weight: chargeableWeight(snapshot),
    }
  })
}

export function midtransItems(items: Awaited<ReturnType<typeof buildCheckoutItems>>['items'], shippingAmount = 0) {
  const productItems = items.map((item) => ({
    id: String(item.productId),
    price: item.unitPrice,
    quantity: item.quantity,
    name: item.name,
  }))

  if (shippingAmount > 0) {
    productItems.push({
      id: 'shipping',
      price: shippingAmount,
      quantity: 1,
      name: 'Ongkos Kirim',
    })
  }

  return productItems
}

export function orderItemRows(orderId: string, items: Awaited<ReturnType<typeof buildCheckoutItems>>['items']) {
  return items.map((item) => ({
    order_id: orderId,
    product_id: item.productId,
    product_name: item.name,
    product_description: item.description,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    subtotal_amount: item.subtotal,
    product_snapshot: item.product,
  }))
}

export function orderNumber() {
  const random = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `PS-${Date.now()}-${random}`
}
