import { FaWhatsapp } from 'react-icons/fa'

export default function WhatsAppWidget() {
  const phone = '6285117606161'
  const message = encodeURIComponent('Halo Puthic Sari! Saya mau tanya soal buket bunga...')

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
      title="Chat via WhatsApp"
      aria-label="Chat via WhatsApp"
    >
      <FaWhatsapp className="text-2xl" />
    </a>
  )
}
