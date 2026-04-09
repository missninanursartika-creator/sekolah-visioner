'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

const plans = [
  {
    id: 'pro_monthly',
    name: 'Pro Bulanan',
    price: 10000,
    period: '/bulan',
    features: [
      'Sekolah tidak terbatas',
      'Analisis AI tidak terbatas',
      'Vision Health Check guru & murid',
      'Laporan PDF profesional',
      'Panduan workshop lengkap',
      'Prioritas support',
    ],
    popular: false,
  },
  {
    id: 'pro_yearly',
    name: 'Pro Tahunan',
    price: 399000,
    period: '/tahun',
    savings: 'Hemat Rp 21.000',
    features: [
      'Semua fitur Pro Bulanan',
      'Hemat dibanding bulanan',
      'Akses prioritas fitur baru',
      'Konsultasi onboarding 1x',
    ],
    popular: true,
  },
]

function BillingContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  const [profile, setProfile] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: pay } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
      setPayments(pay || [])
    }
    load()
  }, [])

  const handleUpgrade = async (planId) => {
    setLoading(planId)
    setError('')
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(null); return }
      window.location.href = data.paymentUrl
    } catch (e) {
      setError('Gagal memproses pembayaran. Coba lagi.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">Billing & Upgrade</span>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">

        {status === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="text-3xl">🎉</div>
            <div>
              <div className="font-bold text-emerald-700">Pembayaran berhasil!</div>
              <div className="text-sm text-emerald-600">Akun Anda telah diupgrade ke Pro.</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Paket Saat Ini</div>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${profile?.plan === 'pro' ? 'bg-amber-50' : 'bg-slate-100'}`}>
              {profile?.plan === 'pro' ? '⭐' : '🆓'}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-lg">{profile?.plan === 'pro' ? 'Pro' : 'Gratis'}</div>
              <div className="text-sm text-slate-500">
                {profile?.plan === 'pro' ? 'Akses penuh ke semua fitur' : `Analisis AI: ${profile?.ai_usage_count || 0}/3 bulan ini`}
              </div>
            </div>
          </div>
        </div>

        {profile?.plan !== 'pro' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-800">Upgrade ke Pro</h2>
              <p className="text-slate-500 text-sm mt-1">Akses semua fitur tanpa batas</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-8">
              {plans.map((plan) => (
                <div key={plan.id} className={`rounded-2xl p-8 relative ${plan.popular ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200'}`}>
                  {plan.popular && (
                    <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">TERBAIK</div>
                  )}
                  <div className={`text-sm font-semibold mb-2 ${plan.popular ? 'text-teal-200' : 'text-slate-500'}`}>{plan.name}</div>
                  <div className={`text-3xl font-black mb-1 ${plan.popular ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(plan.price)}</div>
                  <div className={`text-sm mb-1 ${plan.popular ? 'text-teal-200' : 'text-slate-400'}`}>{plan.period}</div>
                  {plan.savings && <div className="text-xs font-bold text-amber-400 mb-6">{plan.savings}</div>}
                  {!plan.savings && <div className="mb-6" />}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-start gap-2 text-sm ${plan.popular ? 'text-white' : 'text-slate-600'}`}>
                        <span className={plan.popular ? 'text-teal-200' : 'text-teal-500'}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full py-3 rounded-xl font-bold transition disabled:opacity-50 ${plan.popular ? 'bg-white text-teal-700 hover:bg-teal-50' : 'bg-teal-600 text-white hover:bg-teal-500'}`}
                  >
                    {loading === plan.id ? 'Memproses...' : 'Pilih Paket Ini'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {payments.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Riwayat Pembayaran</div>
            <div className="space-y-3">
              {payments.map(pay => (
                <div key={pay.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-semibold text-sm text-slate-700">{pay.merchant_order_id}</div>
                    <div className="text-xs text-slate-500">{new Date(pay.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-slate-800">{formatCurrency(pay.amount)}</div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${pay.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : pay.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                      {pay.status === 'paid' ? 'Berhasil' : pay.status === 'pending' ? 'Menunggu' : 'Gagal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  )
}
