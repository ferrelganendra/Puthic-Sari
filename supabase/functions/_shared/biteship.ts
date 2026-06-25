import { requireEnv } from './http.ts'

const BITESHIP_BASE_URL = 'https://api.biteship.com'

export type BiteshipRate = {
  courierCompany: string
  courierName?: string
  courierService: string
  courierServiceName?: string
  description?: string
  duration?: string
  price: number
  type?: string
}

function origin() {
  return {
    contactName: Deno.env.get('BITESHIP_ORIGIN_CONTACT_NAME') || 'Puthic Sari',
    contactPhone: Deno.env.get('BITESHIP_ORIGIN_CONTACT_PHONE') || '6285117606161',
    address: Deno.env.get('BITESHIP_ORIGIN_ADDRESS') || 'Jl. Perumnas, Ngropoh, Condongcatur, Kec. Depok, Sleman, DI Yogyakarta 55283',
    postalCode: Number(Deno.env.get('BITESHIP_ORIGIN_POSTAL_CODE') || 55283),
  }
}

function courierList() {
  return Deno.env.get('BITESHIP_COURIERS') || 'gojek,grab,jne,jnt,sicepat,anteraja,tiki'
}

function testModeEnabled() {
  return Deno.env.get('SHIPPING_TEST_MODE') === 'true'
}

function dummyRates(): BiteshipRate[] {
  return [
    {
      courierCompany: 'jne',
      courierName: 'JNE',
      courierService: 'reg',
      courierServiceName: 'Layanan Reguler (TEST)',
      description: 'Estimasi 2-3 hari (mode test)',
      duration: '2-3 hari',
      price: 15000,
      type: 'reg',
    },
    {
      courierCompany: 'sicepat',
      courierName: 'SiCepat',
      courierService: 'best',
      courierServiceName: 'BEST (TEST)',
      description: 'Estimasi 1-2 hari (mode test)',
      duration: '1-2 hari',
      price: 18000,
      type: 'best',
    },
  ]
}

function friendlyError(data: Record<string, unknown>, fallback: string) {
  const message = String(data?.error || data?.message || fallback)
  if (/no sufficient balance/i.test(message)) {
    return 'Saldo Biteship belum cukup untuk cek ongkir. Top up saldo atau hubungi Biteship.'
  }
  return message
}

async function request(path: string, init: RequestInit) {
  const response = await fetch(`${BITESHIP_BASE_URL}${path}`, {
    ...init,
    headers: {
      authorization: requireEnv('BITESHIP_API_KEY'),
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init.headers || {}),
    },
  })
  const data = await response.json().catch(async () => ({ error: await response.text() }))
  if (!response.ok || data?.success === false) {
    throw new Error(friendlyError(data, 'Request Biteship gagal.'))
  }
  return data
}

export async function getRates(destinationPostalCode: number, items: Array<Record<string, unknown>>) {
  const originData = origin()

  if (testModeEnabled()) {
    return dummyRates()
  }

  try {
    const data = await request('/v1/rates/couriers', {
      method: 'POST',
      body: JSON.stringify({
        origin_postal_code: originData.postalCode,
        destination_postal_code: destinationPostalCode,
        couriers: courierList(),
        items,
      }),
    })

    return (data.pricing || [])
      .filter((rate: Record<string, unknown>) => rate.available_for_pickup !== false)
      .map((rate: Record<string, unknown>) => ({
        courierCompany: String(rate.courier_code || ''),
        courierName: String(rate.courier_name || ''),
        courierService: String(rate.courier_service_code || ''),
        courierServiceName: String(rate.courier_service_name || ''),
        description: String(rate.description || ''),
        duration: String(rate.duration || ''),
        price: Number(rate.price || 0),
        type: String(rate.type || ''),
      }))
      .filter((rate: BiteshipRate) => rate.courierCompany && rate.courierService && rate.price >= 0)
      .sort((a: BiteshipRate, b: BiteshipRate) => a.price - b.price)
  } catch (error) {
    if (testModeEnabled()) return dummyRates()
    throw error
  }
}

export async function resolveSelectedRate(destinationPostalCode: number, items: Array<Record<string, unknown>>, selectedRate: Partial<BiteshipRate>) {
  const rates = await getRates(destinationPostalCode, items)
  const match = rates.find((rate: BiteshipRate) => (
    rate.courierCompany === selectedRate.courierCompany &&
    rate.courierService === selectedRate.courierService
  ))
  if (!match) throw new Error('Layanan kurir tidak tersedia. Cek ongkir ulang.')
  return match
}

export async function createShipment(order: Record<string, unknown>, items: Array<Record<string, unknown>>) {
  const originData = origin()

  if (testModeEnabled()) {
    return {
      id: `test-shipment-${order.order_number || Date.now()}`,
      status: 'confirmed',
      courier: { waybill_id: `TEST-WB-${Date.now()}` },
      test_mode: true,
    }
  }

  return await request('/v1/orders', {
    method: 'POST',
    body: JSON.stringify({
      shipper_contact_name: originData.contactName,
      shipper_contact_phone: originData.contactPhone,
      origin_contact_name: originData.contactName,
      origin_contact_phone: originData.contactPhone,
      origin_address: originData.address,
      origin_postal_code: originData.postalCode,
      destination_contact_name: order.customer_name,
      destination_contact_phone: order.customer_phone,
      destination_address: order.destination_address,
      destination_note: order.destination_note || undefined,
      destination_postal_code: order.destination_postal_code,
      courier_company: (order.selected_courier as BiteshipRate).courierCompany,
      courier_type: (order.selected_courier as BiteshipRate).courierService,
      delivery_type: 'now',
      order_note: order.order_note || `Order ${order.order_number}`,
      reference_id: order.order_number,
      metadata: {
        order_id: order.id,
        channel: 'website',
        payment_status: order.payment_status,
      },
      items,
    }),
  })
}
