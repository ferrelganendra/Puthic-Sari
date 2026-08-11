import { Component } from 'react'
import { explainError } from '../lib/errorMessages'

export default class ErrorBoundary extends Component {
 constructor(props) {
  super(props)
  this.state = { hasError: false, error: null }
 }

 static getDerivedStateFromError(error) {
  return { hasError: true, error }
 }

  componentDidCatch(error, info) {
   if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info)
  }


 handleReset() {
  this.setState({ hasError: false, error: null })
  window.location.reload()
 }

 render() {
   if (this.state.hasError) {
    const message = explainError(this.state.error, 'Halaman ini mengalami masalah. Coba muat ulang. Jika masih muncul, cek koneksi Supabase/Vercel atau hubungi pengembang.')
    return (
     <div className="min-h-[50vh] flex items-center justify-center p-8 text-center">
     <div>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
       <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
       </svg>
      </div>
       <h2 className="text-lg font-semibold text-gray-800 mb-2">Halaman belum bisa ditampilkan</h2>
       <p className="text-sm text-gray-500 mb-5">{message}</p>
      <button
       onClick={() => this.handleReset()}
       className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
      >
       Muat Ulang
      </button>
     </div>
    </div>
   )
  }
  return this.props.children
 }
}
