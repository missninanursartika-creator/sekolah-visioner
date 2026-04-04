'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function VerifyContent() {
  const params = useSearchParams()
  const email = params.get('email') || 'email Anda'

  return (
    <div className="min-h-screen bg-[#0D1B35] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">📬</div>
        <h1 className="text-white text-2xl font-black mb-3">Cek Email Anda</h1>
        <p className="text-white/60 text-sm leading-relaxed mb-8">
          Kami mengirim link verifikasi ke{' '}
          <span className="text-white font-semibold">{email}</span>.
          Klik link tersebut untuk mengaktifkan akun Anda.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left mb-8">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Tidak menerima email?</p>
          <ul className="text-white/60 text-sm space-y-2">
            <li>• Cek folder Spam atau Junk</li>
            <li>• Pastikan email yang dimasukkan benar</li>
            <li>• Tunggu beberapa menit</li>
          </ul>
        </div>
        <Link href="/login" className="text-teal-400 text-sm hover:underline">
          Kembali ke halaman masuk
        </Link>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}