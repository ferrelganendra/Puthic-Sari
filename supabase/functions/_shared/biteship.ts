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

export type BiteshipDestination = {
  postalCode: number
  areaId?: string
  latitude?: number
  longitude?: number
}

function origin() {
  return {
    contactName: Deno.env.get('BITESHIP_ORIGIN_CONTACT_NAME') || 'Puthic Sari',
    contactPhone: Deno.env.get('BITESHIP_ORIGIN_CONTACT_PHONE') || '6285117606161',
    address: Deno.env.get('BITESHIP_ORIGIN_ADDRESS') || 'Jl. Perumnas, Ngropoh, Condongcatur, Kec. Depok, Sleman, DI Yogyakarta 55283',
    postalCode: Number(Deno.env.get('BITESHIP_ORIGIN_POSTAL_CODE') || 55283),
    latitude: Number(Deno.env.get('BITESHIP_ORIGIN_LATITUDE') || 0),
    longitude: Number(Deno.env.get('BITESHIP_ORIGIN_LONGITUDE') || 0),
  }
}

function hasCoordinates(originData: ReturnType<typeof origin>, destination: BiteshipDestination) {
  return Boolean(originData.latitude && originData.longitude && destination.latitude && destination.longitude)
}

function isInstantRate(rate: BiteshipRate) {
  return ['gojek', 'grab'].includes(rate.courierCompany.toLowerCase()) || rate.courierService.toLowerCase() === 'instant'
}

async function courierList() {
  const configuredCouriers = Deno.env.get('BITESHIP_COURIERS')
  if (configuredCouriers) return configuredCouriers

  const data = await request('/v1/couriers', { method: 'GET' })
  const codes = Array.from(new Set(
    (data.couriers || [])
      .map((courier: Record<string, unknown>) => String(courier.courier_code || '').trim())
      .filter(Boolean),
  ))
  if (!codes.length) throw new Error('Tidak ada kurir aktif dari Biteship.')
  return codes.join(',')
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

export async function searchAreas(input: string) {
  const query = input.trim()
  if (query.length < 3) return []

  const data = await request(`/v1/maps/areas?countries=ID&type=single&input=${encodeURIComponent(query)}`, { method: 'GET' })
  return (data.areas || []).map((area: Record<string, unknown>) => ({
    id: String(area.id || ''),
    name: String(area.name || ''),
    city: String(area.administrative_division_level_2_name || ''),
    district: String(area.administrative_division_level_3_name || ''),
    province: String(area.administrative_division_level_1_name || ''),
    postalCode: String(area.postal_code || ''),
  })).filter((area: Record<string, string>) => area.id && area.name)
}

export async function getRates(destination: BiteshipDestination, items: Array<Record<string, unknown>>) {
  const originData = origin()

  if (testModeEnabled()) {
    return dummyRates()
  }

  try {
    const coordinatesReady = hasCoordinates(originData, destination)
    const data = await request('/v1/rates/couriers', {
      method: 'POST',
      body: JSON.stringify({
        ...(coordinatesReady
          ? {
              origin_latitude: originData.latitude,
              origin_longitude: originData.longitude,
              destination_latitude: destination.latitude,
              destination_longitude: destination.longitude,
            }
          : {
              origin_postal_code: originData.postalCode,
              ...(destination.areaId ? { destination_area_id: destination.areaId } : { destination_postal_code: destination.postalCode }),
            }),
        couriers: await courierList(),
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
      .filter((rate: BiteshipRate) => coordinatesReady || !isInstantRate(rate))
      .sort((a: BiteshipRate, b: BiteshipRate) => a.price - b.price)
  } catch (error) {
    if (testModeEnabled()) return dummyRates()
    throw error
  }
}

export async function resolveSelectedRate(destination: BiteshipDestination, items: Array<Record<string, unknown>>, selectedRate: Partial<BiteshipRate>) {
  const rates = await getRates(destination, items)
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

  const metadata = (order.metadata || {}) as Record<string, unknown>
  const destinationAreaId = String(metadata.destination_area_id || '').trim()
  const destinationLatitude = Number(metadata.destination_latitude || 0)
  const destinationLongitude = Number(metadata.destination_longitude || 0)
  const selectedCourier = order.selected_courier as BiteshipRate
  const destination = { postalCode: Number(order.destination_postal_code || 0), latitude: destinationLatitude, longitude: destinationLongitude }
  const coordinatesReady = hasCoordinates(originData, destination)
  if (isInstantRate(selectedCourier) && !coordinatesReady) {
    throw new Error('Gojek/Grab Instant butuh koordinat toko dan alamat tujuan. Pilih layanan reguler atau lengkapi koordinat.')
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
      ...(coordinatesReady ? { origin_coordinate: { latitude: originData.latitude, longitude: originData.longitude } } : {}),
      destination_contact_name: order.customer_name,
      destination_contact_phone: order.customer_phone,
      destination_address: order.destination_address,
      destination_note: order.destination_note || undefined,
      destination_postal_code: order.destination_postal_code,
      ...(destinationAreaId ? { destination_area_id: destinationAreaId } : {}),
      ...(coordinatesReady ? { destination_coordinate: { latitude: destinationLatitude, longitude: destinationLongitude } } : {}),
      courier_company: selectedCourier.courierCompany,
      courier_type: selectedCourier.courierService,
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

export async function getLabel(biteshipOrderId: string) {
  if (testModeEnabled()) {
    return { url: null, test_mode: true, message: 'Mode test — label tidak tersedia.' }
  }

  const data = await request(`/v1/orders/${biteshipOrderId}/label`, { method: 'GET' })
  return data
}

export async function schedulePickup(biteshipOrderId: string) {
  if (testModeEnabled()) {
    return { status: 'pickup_scheduled', test_mode: true, message: 'Mode test — pickup tidak dijadwalkan secara nyata.' }
  }

  const data = await request(`/v1/orders/${biteshipOrderId}/pickup`, { method: 'POST', body: '{}' })
  return data
}
