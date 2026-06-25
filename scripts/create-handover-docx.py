import html
import zipfile
from pathlib import Path

out = Path('handover/Puthic-Sari-Handover-Mas-Andri.docx')
out.parent.mkdir(exist_ok=True)

sections = [
    ('Handover Website Puthic Sari', [
        'Dokumen ini dibuat untuk Mas Andri sebagai pegangan operasional website Puthic Sari.',
        'Bahasa dibuat sederhana agar bisa dipakai tanpa latar belakang teknis.',
        'Status: LIVE. Website sudah aktif di https://puthic-sari.vercel.app dan siap menerima pesanan customer.',
    ]),
    ('1. Akun yang Perlu Dipegang Sendiri', [
        'Supabase: tempat menyimpan data website seperti produk, pesanan, pelanggan, review, dan pengaturan admin.',
        'Midtrans: layanan pembayaran online yang menampilkan halaman bayar ke customer dan memberi kabar ke website kalau pembayaran berhasil/gagal.',
        'Biteship: layanan cek ongkir dan pengiriman, supaya customer bisa dapat pilihan kurir dan harga kirim.',
        'Vercel: tempat website dipasang agar bisa diakses online oleh customer.',
        'Domain registrar: tempat membeli dan mengatur nama domain, misalnya puthicsari.com.',
    ]),
    ('2. Cara Sederhana Ganti Mode Testing ke Mode Live', [
        'Di Midtrans, gunakan Client Key dan Server Key production, bukan sandbox/testing.',
        'Di pengaturan environment website, pastikan VITE_MIDTRANS_IS_PRODUCTION=true dan MIDTRANS_IS_PRODUCTION=true.',
        'Di Biteship, gunakan API key production. Jangan gunakan key yang diawali biteship_test.',
        'Pastikan SHIPPING_TEST_MODE=false supaya ongkir yang keluar adalah harga real, bukan dummy.',
        'Setelah mengganti key, deploy ulang website di Vercel agar perubahan dipakai website live.',
        'Jangan mengganti key langsung di kode website. Simpan hanya di pengaturan environment/platform.',
    ]),
    ('3. Cara Reset Password Kalau Lupa', [
        'Supabase: buka halaman login Supabase, klik forgot password, ikuti email reset dari Supabase.',
        'Midtrans: buka dashboard Midtrans, klik lupa password, ikuti email reset dari Midtrans.',
        'Biteship: buka dashboard Biteship, klik forgot password, ikuti email reset dari Biteship.',
        'Vercel: login memakai email/GitHub yang terhubung. Kalau lupa, reset dari halaman login Vercel atau GitHub.',
        'Domain registrar: buka tempat beli domain, klik lupa password, pastikan email pemilik domain masih aktif.',
    ]),
    ('4. Gambaran Sederhana Website Ini Berjalan Bagaimana', [
        'Tampilan depan: halaman yang dilihat customer, seperti homepage, koleksi produk, detail produk, keranjang, checkout, dan halaman akun.',
        'Database: Supabase menyimpan data produk, pesanan, alamat customer, review, admin, dan status pengiriman.',
        'Pembayaran: saat customer checkout, website meminta Midtrans membuat transaksi. Midtrans menampilkan halaman bayar. Setelah bayar, Midtrans mengirim kabar balik ke website.',
        'Pengiriman: website meminta harga ongkir ke Biteship berdasarkan alamat dan isi pesanan. Setelah pesanan dibayar, data pengiriman bisa dibuat/diupdate.',
        'Alur checkout: customer pilih produk, masuk keranjang, isi data alamat, pilih ongkir, bayar via Midtrans, lalu pesanan masuk ke Supabase.',
    ]),
    ('5. Hal yang Harus Dijaga Rahasia', [
        'API key: seperti kunci rumah digital. Kalau bocor, orang lain bisa memakai layanan atas nama Puthic Sari.',
        'Environment variables: tempat menyimpan kunci rahasia website. Jangan dikirim di chat umum atau masuk ke screenshot.',
        'Supabase Service Role Key: kunci super admin database. Kalau bocor, orang bisa baca/ubah/hapus data.',
        'Midtrans Server Key: kunci untuk membuat dan memeriksa pembayaran. Kalau bocor, bisa disalahgunakan untuk transaksi palsu atau akses data pembayaran.',
        'Biteship API Key: kunci untuk akses ongkir/pengiriman. Kalau bocor, bisa dipakai orang lain dan menimbulkan biaya/risiko operasional.',
        'Password dashboard: jangan dibagikan. Kalau perlu akses developer, buat akses sementara atau akun terpisah.',
    ]),
    ('6. Kalau Ada Error, Hubungi Siapa', [
        'Kontak developer: [isi nama developer]',
        'WhatsApp developer: [isi nomor WhatsApp developer]',
        'Email developer: [isi email developer]',
        'Saat melapor error, kirim: screenshot, jam kejadian, halaman yang dibuka, dan langkah yang dilakukan customer.',
    ]),
    ('7. Checklist Go-Live (Sudah Selesai)', [
        'Supabase migrations production sudah diterapkan sampai migration 004.',
        'Test keamanan role admin di production sudah PASS (self-escalation diblokir).',
        'Midtrans sudah memakai key production (MIDTRANS_IS_PRODUCTION=true).',
        'Biteship sudah memakai key production (biteship_live) dan SHIPPING_TEST_MODE=false.',
        'Website sudah deploy ke Vercel production: https://puthic-sari.vercel.app',
        'All automated regression tests 14/14 PASS.',
        'Google Maps tampil normal.',
    ]),
    ('8. Keamanan yang Sudah Diperkuat (Migration 003 + 004)', [
        'Migration 003 menghapus policy lama yang membolehkan siapa saja insert/update role admin di profil sendiri.',
        'Tanpa migration 003, user biasa bisa daftar akun lalu langsung jadi admin — ini bahaya besar.',
        'Migration 004 menambah trigger pengaman yang memblokir user mengubah role diri sendiri.',
        'Misalnya kalau ada yang coba ubah role sendiri jadi admin lewat aplikasi, sistem akan membatalkan perubahan itu.',
        'Hanya sistem internal (service role) yang boleh mengubah role — misalnya kalau Mas Andri mau jadikan orang lain admin.',
        'Singkatnya: sekarang tidak ada jalan pintas jadi admin lewat aplikasi. Harus lewat database langsung.',
    ]),
    ('9. Catatan Status Saat Ini', [
        'Website LIVE di https://puthic-sari.vercel.app.',
        'Automated test lokal 14/14 PASS.',
        'Migrations 001-004 sudah didorong ke Supabase production.',
        'Self-escalation role admin sudah diblokir (migration 003 + 004).',
        'Payment Midtrans sudah memakai production key. Untuk test pembayaran, gunakan test card dari dashboard Midtrans (bukan uang sungguhan).',
        'Ongkir sudah memakai Biteship production — pastikan saldo Biteship cukup untuk operasional.',
    ]),
]

def p(text, style=None):
    style_xml = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ''
    return f'<w:p>{style_xml}<w:r><w:t>{html.escape(text)}</w:t></w:r></w:p>'

body = []
for i, (title, items) in enumerate(sections):
    body.append(p(title, 'Title' if i == 0 else 'Heading1'))
    for item in items:
        body.append(p(item))

document = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {''.join(body)}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>'''

styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr><w:pPr><w:spacing w:after="160"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="34"/></w:rPr><w:pPr><w:spacing w:after="280"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="28"/></w:rPr><w:pPr><w:spacing w:before="260" w:after="160"/></w:pPr></w:style>
</w:styles>'''

content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>'''

rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/document.xml', document)
    z.writestr('word/styles.xml', styles)
    z.writestr('word/_rels/document.xml.rels', doc_rels)

print(out)
