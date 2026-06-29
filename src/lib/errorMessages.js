const rawMessage = (error) => {
  if (!error) return ''
  if (typeof error === 'string') return error
  return String(error.message || error.error || error.details || '')
}

export function explainError(error, fallback = 'Terjadi kendala. Coba ulangi. Jika masih gagal, hubungi admin.') {
  const message = rawMessage(error).trim()

  if (!message) return fallback

  if (/failed to fetch|networkerror|load failed|network request failed|fetch/i.test(message)) {
    return 'Koneksi ke server gagal. Cek internet, lalu coba lagi. Jika tetap gagal, server atau Supabase sedang bermasalah.'
  }
  if (/jwt|session|refresh token|auth session|not authenticated|unauthorized|401/i.test(message)) {
    return 'Sesi login sudah habis atau tidak valid. Silakan login ulang.'
  }
  if (/permission denied|row level security|rls|not authorized|forbidden|403/i.test(message)) {
    return 'Akses ditolak oleh sistem. Akun ini belum punya izin untuk tindakan tersebut.'
  }
  if (/duplicate key|already registered|already exists|23505/i.test(message)) {
    return 'Data sudah ada di sistem. Gunakan data lain atau cek data lama sebelum menyimpan ulang.'
  }
  if (/violates foreign key|23503/i.test(message)) {
    return 'Data terkait belum lengkap atau sudah dihapus. Cek ulang pilihan produk, kategori, atau pesanan.'
  }
  if (/invalid input syntax|invalid value|22p02/i.test(message)) {
    return 'Format data tidak sesuai. Cek kembali angka, tanggal, atau pilihan yang diisi.'
  }
  if (/storage|bucket|object/i.test(message)) {
    return 'Upload file gagal. Pastikan file berupa gambar, ukuran tidak terlalu besar, dan storage Supabase aktif.'
  }
  if (/no sufficient balance|saldo/i.test(message)) {
    return 'Ongkir belum bisa dihitung karena saldo Biteship belum cukup. Top up saldo Biteship, lalu coba lagi.'
  }
  if (/midtrans|snap|payment|pembayaran/i.test(message)) {
    return 'Pembayaran belum bisa diproses. Coba buka pembayaran lagi. Jika gagal terus, cek konfigurasi Midtrans atau hubungi admin.'
  }
  if (/biteship|ongkir|kurir|shipment|waybill|pickup/i.test(message)) {
    return 'Layanan pengiriman bermasalah. Cek alamat, kode pos, kurir, dan saldo Biteship. Jika masih gagal, proses pesanan manual lewat admin.'
  }
  if (/supabase|postgrest|database|relation|column/i.test(message)) {
    return 'Data website belum bisa dibaca/disimpan. Cek koneksi Supabase dan struktur tabel/kolom yang dipakai.'
  }
  if (/env|api_key|client_key|belum dikonfigurasi|not configured/i.test(message)) {
    return 'Konfigurasi server belum lengkap. Cek environment variable di Vercel/Supabase.'
  }

  return fallback
}
