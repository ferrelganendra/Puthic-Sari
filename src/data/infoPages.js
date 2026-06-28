import { siteAssetUrl } from '../lib/assetUrl.js'

export const infoPageLinks = [
 { label: 'Bisnis Kami', slug: 'bisnis-kami' },
 { label: 'Tentang Kami', slug: 'tentang-kami' },
 { label: 'FAQ', slug: 'faq' },
 { label: 'Cara Memesan', slug: 'cara-memesan' },
 { label: 'Syarat dan Ketentuan', slug: 'syarat-ketentuan' },
 { label: 'Kebijakan Privasi', slug: 'kebijakan-privasi' },
]

export const infoPages = {
 'bisnis-kami': {
  label: 'Bisnis Kami',
  eyebrow: 'Puthic Sari',
  title: 'We Sell the Sign of Love.',
  intro: 'Hadiah bukan tentang harga, tapi tentang niat dan makna. Setiap buket kami rangkai dengan ketelitian dan cinta. Untuk perayaan kecil atau besar, kami siap bantu kamu membuatnya berkesan.',
   heroImage: siteAssetUrl('/footer/founder-graduation.jpeg'),
   heroAlt: 'Founder Puthic Sari saat wisuda',
  quote: 'Setiap bunga memiliki makna, dan tugas kami adalah membantu menyampaikan perasaan itu dengan cara yang paling indah.',
  quoteBy: 'Sisi',
  sections: [
   {
    title: 'Research & Design Philosophy',
    body: 'Di tengah berkembangnya industri florist modern, kami percaya bahwa customer tidak hanya mencari bunga yang cantik, tetapi juga pengalaman yang personal, berkesan, dan berkualitas. Karena itu, Puthic Sari hadir dengan pendekatan yang mengutamakan detail, estetika, dan ketulusan dalam setiap proses pengerjaan. Kami terus mengembangkan desain yang elegan, modern, dan timeless agar setiap rangkaian dapat cocok untuk berbagai momen spesial. Inspirasi kami datang dari warna-warna alam, tren florist modern, serta karakter unik dari setiap pelanggan yang mempercayakan momennya kepada kami. Sebelum sebuah rangkaian dibuat, kami memulai semuanya dari proses observasi dan eksplorasi ide. Kami memilih bunga dengan standar kualitas tertentu agar setiap rangkaian tetap proporsional, dan memiliki tampilan premium ketika sampai ke tangan customer.',
   },
   {
    title: 'Production',
    body: 'Setiap produk Puthic Sari dibuat secara handmade oleh tim florist kami. Kami percaya bunga bukan produk pabrik yang bisa dibuat tanpa rasa. Karena itu, setiap rangkaian dirakit satu per satu dengan komposisi yang dipikirkan secara matang — mulai dari arah bunga, keseimbangan warna, volume, hingga finishing wrapping. Dalam proses pengerjaan, kami juga melakukan quality checking. Kami ingin setiap customer menerima bunga yang terlihat sama indahnya seperti ketika pertama kali dibayangkan.',
   },
   {
    title: 'Packaging and Delivery',
    body: 'Setiap bouquet dikemas dengan perlindungan tambahan agar tetap aman selama perjalanan. Untuk produk tertentu, kami juga menyesuaikan metode pengiriman supaya bunga tetap tampil maksimal saat diterima. Kami selalu berusaha memastikan bahwa rasa bahagia yang ingin dikirim pelanggan bisa sampai dengan utuh — bukan hanya bunganya, tetapi juga kesannya.',
   },
  ],
  highlights: ['Handmade', 'Quality Checking', 'Premium Packaging'],
  gallery: [
   { src: siteAssetUrl('/footer/florist-table-vertical.jfif'), alt: 'Peralatan dan bunga untuk proses wrapping' },
   { src: siteAssetUrl('/footer/bouquet-box.jpeg'), alt: 'Buket Puthic Sari dalam kotak hadiah' },
  ],
 },
 'tentang-kami': {
  label: 'Tentang Kami',
  eyebrow: 'Puthic Sari',
  title: 'Florist dengan Sentuhan Personal.',
  intro: 'Puthic Sari adalah brand florist yang menghadirkan rangkaian bunga dengan sentuhan elegan, hangat, dan personal. Kami memadukan seni merangkai bunga dengan detail visual modern agar setiap produk tidak hanya terlihat cantik, tetapi juga memiliki karakter dan emosi di dalamnya.',
   heroImage: siteAssetUrl('/footer/logo-puthic-sari.jpeg'),
   heroAlt: 'Logo Puthic Sari',
  quote: null,
  quoteBy: null,
  sections: [
   {
    title: 'Koleksi Produk',
    body: 'Website ini menampilkan koleksi buket Puthic Sari beserta foto, kategori, dan harga. Setiap produk dirancang untuk berbagai momen spesial.',
   },
   {
    title: 'Bantuan Order',
    body: 'Pelanggan dapat menghubungi Puthic Sari melalui WhatsApp jika membutuhkan bantuan sebelum memesan.',
   },
   {
    title: 'Offline Store',
    body: 'Puthic Sari memiliki toko offline di Yogyakarta. Kini Puthic Sari sudah mempunyai toko offline di Yogyakarta.',
   },
   {
    title: 'Terima Kasih',
    body: 'Kepercayaan pelanggan adalah alasan terbesar Puthic Sari terus berkembang. Setiap repeat order, setiap pesan manis dari pelanggan, dan setiap cerita bahagia yang dibagikan kembali menjadi bagian penting dari perjalanan kami. Terima kasih sudah mempercayakan momen spesial Anda kepada Puthic Sari 🌷',
   },
  ],
  highlights: ['Elegan', 'Hangat', 'Personal'],
  gallery: [
   { src: siteAssetUrl('/footer/bouquet-box.jpeg'), alt: 'Buket warna pink dalam gift box' },
   { src: siteAssetUrl('/footer/florist-table-wide.jfif'), alt: 'Detail proses florist' },
  ],
 },
 faq: {
  label: 'FAQ',
  eyebrow: 'Bantuan',
  title: 'Pertanyaan yang paling sering ditanyakan.',
  intro: 'Ringkasan informasi pemesanan, pembayaran, pengiriman, retur, dan toko offline Puthic Sari.',
  heroImage: siteAssetUrl('/footer/bouquet-box.jpeg'),
  heroAlt: 'Buket Puthic Sari dalam kotak hadiah',
  faqs: [
   {
    q: 'Apakah saya membutuhkan akun untuk memesan?',
    a: 'Jika kamu pelanggan baru, kami akan mengarahkan untuk mendaftarkan akun dengan alamat email aktif dan nomor telepon yang akan diverifikasi lewat WhatsApp. Kamu tidak perlu mendaftar ulang ketika ingin melakukan pembelian selanjutnya.',
   },
   {
    q: 'Kapan barang saya diproses?',
    a: 'Hai Kak, terima kasih sudah berkenan dengan produk Puthic Sari! 🌸\n\nEstimasi barang sampai bisa dicek di bagian ekspedisi ya, Kak 💕\n1. Order luar kota di atas jam 14.00 dikirim keesokan harinya. (Drop off atau pick up ekspedisi pukul 17.00–20.00, Senin sampai Sabtu)\n2. Order instan diproses 1–3 jam, di atas jam 18.00 dikirim besoknya.\n3. Hari Minggu libur pengiriman.',
   },
   {
    q: 'Bagaimana syarat & ketentuan pengembalian barang?',
    a: 'Wajib menyertakan bukti video unboxing tanpa terputus. Batas pengembalian produk adalah 3 hari setelah barang diterima berdasarkan system. Form Label pengiriman jangan hilang. Untuk retur produk tidak boleh dalam keadaan rusak. Complain dan Retur hanya bisa diajukan jika ada kesalahan dari pihak kami.',
   },
   {
    q: 'Bisakah saya menambahkan alamat berbeda pada akun saya?',
    a: 'Ya, kamu bisa menambahkan beberapa alamat pengiriman di halaman akun kamu.',
   },
   {
    q: 'Apakah saya bisa memesan barang dan dikirim ke beberapa alamat?',
    a: 'Untuk pengiriman ke beberapa alamat, silakan lakukan pemesanan terpisah untuk masing-masing alamat.',
   },
   {
    q: 'Bisakah saya mengubah alamat pengiriman setelah pesanan saya diproses/dikirim?',
    a: 'Perubahan alamat hanya bisa dilakukan sebelum pesanan diproses. Segera hubungi kami via WhatsApp jika ada perubahan.',
   },
   {
    q: 'Berapa lama batas waktu untuk melakukan pembayaran?',
    a: 'Pembayaran harus diselesaikan dalam 1x24 jam setelah pesanan dibuat. Lewat dari itu, pesanan akan otomatis dibatalkan.',
   },
   {
    q: 'Bagaimana cara untuk melacak pesanan saya?',
    a: 'Kamu akan mendapatkan nomor resi pengiriman melalui WhatsApp atau email setelah pesanan dikirim.',
   },
   {
    q: 'Apakah saya bisa membatalkan pesanan?',
    a: 'Pembatalan hanya bisa dilakukan sebelum pesanan masuk tahap produksi. Segera hubungi kami via WhatsApp untuk pembatalan.',
   },
   {
    q: 'Apakah Puthic Sari punya toko offline?',
    a: 'Kini Puthic Sari sudah mempunyai toko offline di Yogyakarta.\n\nJl. Perumnas, Ngropoh, Condongcatur, Kec. Depok, Sleman, DIY 55283.\nBuka setiap hari pukul 10.00–21.00 WIB.',
   },
  ],
 },
 'cara-memesan': {
  label: 'Cara Memesan',
  eyebrow: 'Order Guide',
  title: 'Cara memesan melalui website.',
  intro: 'Pilih produk, isi data pesanan, lalu lanjutkan pembayaran sesuai metode yang tersedia.',
  heroImage: siteAssetUrl('/footer/florist-table-vertical.jfif'),
  heroAlt: 'Proses persiapan buket',
  steps: [
   'Buat akun dengan email aktif dan nomor WhatsApp.',
   'Pilih produk yang kamu suka, tambahkan ke keranjang.',
   'Masukkan alamat pengiriman dan pilih metode pengiriman.',
   'Lakukan pembayaran sesuai metode yang tersedia.',
   'Pesananmu akan kami proses dan dikirimkan sesuai estimasi.',
   'Lacak pesananmu dengan nomor resi yang kami kirimkan via WhatsApp.',
  ],
  notice: 'Butuh bantuan? Chat kami via WhatsApp di +62 851-1760-6161.',
 },
 'syarat-ketentuan': {
  label: 'Syarat dan Ketentuan',
  eyebrow: 'Terms',
  title: 'Dengan menggunakan layanan Puthic Sari, kamu menyetujui syarat berikut.',
  intro: 'Jika ada yang kurang jelas, hubungi Puthic Sari melalui WhatsApp.',
  heroImage: siteAssetUrl('/footer/florist-table-wide.jfif'),
  heroAlt: 'Bunga dan alat florist di atas meja kerja',
  sections: [
   { title: 'Pemesanan', body: 'Semua pesanan dianggap sah setelah pembayaran dikonfirmasi. Kami berhak membatalkan pesanan jika terjadi ketidaksesuaian stok.' },
   { title: 'Pembayaran', body: 'Pembayaran harus diselesaikan dalam 1x24 jam setelah pesanan dibuat. Keterlambatan pembayaran dapat mengakibatkan pembatalan otomatis.' },
   { title: 'Produk', body: 'Foto produk dapat memiliki perbedaan warna karena pencahayaan dan tampilan layar.' },
   { title: 'Pengiriman', body: 'Estimasi pengiriman dapat berubah tergantung layanan kurir dan lokasi tujuan.' },
   { title: 'Retur & Complain', body: 'Jika ada kendala pada pesanan, hubungi kami melalui WhatsApp dan sertakan informasi pesanan.' },
  ],
 },
 'kebijakan-privasi': {
  label: 'Kebijakan Privasi',
  eyebrow: 'Privacy',
  title: 'Kebijakan penggunaan data pelanggan.',
  intro: 'Data pelanggan digunakan untuk kebutuhan akun, transaksi, pengiriman, dan layanan pelanggan.',
  heroImage: siteAssetUrl('/footer/bouquet-box.jpeg'),
  heroAlt: 'Buket Puthic Sari siap dikirim',
  sections: [
   { title: 'Data yang Dikumpulkan', body: 'Nama, alamat email, nomor telepon, dan alamat pengiriman yang kamu berikan saat membuat akun atau melakukan pemesanan.' },
   { title: 'Penggunaan Data', body: 'Data digunakan untuk memproses pesanan, menghubungi pelanggan, mengatur pengiriman, memberi update pesanan, dan meningkatkan layanan.' },
   { title: 'Berbagi Data', body: 'Data tidak dijual ke pihak lain. Informasi tertentu dapat dibagikan ke mitra pengiriman hanya untuk kebutuhan pengantaran pesanan.' },
   { title: 'Keamanan Data', body: 'Kami membatasi penggunaan data untuk kebutuhan layanan dan transaksi.' },
   { title: 'Hak Kamu', body: 'Kamu berhak mengakses, memperbarui, atau menghapus data pribadi. Hubungi kami melalui WhatsApp untuk permintaan tersebut.' },
  ],
 },
}

export const infoPageSlugs = Object.keys(infoPages)
