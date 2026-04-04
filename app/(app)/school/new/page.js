'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewSchoolPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    principal_name: '',
    level: '',
    city: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/login'); return }

  // Cek plan & jumlah sekolah
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const { count } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  if (profile?.plan !== 'pro' && count >= 1) {
    setError('Paket gratis hanya untuk 1 sekolah. Upgrade ke Pro untuk menambah sekolah tidak terbatas.')
    setLoading(false)
    return
  }

  const { data: school, error } = await supabase
    .from('schools')
    .insert({
      owner_id: user.id,
      name: form.name,
      principal_name: form.principal_name,
      level: form.level,
      city: form.city,
    })
    .select()
    .single()

  if (error) {
    setError('Gagal menyimpan. Silakan coba lagi.')
    setLoading(false)
    return
  }

  router.push(`/school/${school.id}`)
}

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">Tambah Sekolah</span>
      </nav>

      <div className="max-w-xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">Tambah Sekolah Baru</h1>
          <p className="text-slate-500 text-sm mt-1">Isi profil sekolah untuk memulai perancangan visi</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama Sekolah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="cth: SDN Harapan Bangsa 01"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama Kepala Sekolah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="principal_name"
                value={form.principal_name}
                onChange={handleChange}
                placeholder="cth: Budi Santoso, S.Pd"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Jenjang Sekolah <span className="text-red-500">*</span>
              </label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              >
                <option value="">Pilih jenjang...</option>
                <option value="TK/PAUD">TK / PAUD</option>
                <option value="SD">SD / Sederajat</option>
                <option value="SMP">SMP / Sederajat</option>
                <option value="SMA">SMA / Sederajat</option>
                <option value="SMK">SMK</option>
                <option value="Pesantren">Pesantren</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="cth: Surabaya"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition"
              >
                {loading ? 'Menyimpan...' : 'Simpan & Lanjutkan →'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}