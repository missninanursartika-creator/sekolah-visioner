'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function KomitmenPage() {
  const { id } = useParams()
  const supabase = createClient()

  const [school, setSchool] = useState(null)
  const [komitmen, setKomitmen] = useState({ k1: '', k2: '', k3: '' })
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('schools').select('*').eq('id', id).single()
      setSchool(s)
      const { data: v } = await supabase.from('visions').select('*').eq('school_id', id).single()
      if (v) setKomitmen(v.komitmen || { k1: '', k2: '', k3: '' })
    }
    load()
  }, [id])

  const save = async () => {
    setSaving(true)
    const { data: existing } = await supabase.from('visions').select('id').eq('school_id', id).single()
    if (existing) {
      await supabase.from('visions').update({ komitmen, updated_at: new Date() }).eq('school_id', id)
    } else {
      await supabase.from('visions').insert({ school_id: id, komitmen })
    }
    setSaving(false)
    setSaved(true)
  }

  const analyze = async () => {
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'komitmen',
          data: {
            school: school?.name,
            k1: komitmen.k1 || '(kosong)',
            k2: komitmen.k2 || '(kosong)',
            k3: komitmen.k3 || '(kosong)',
          },
        }),
      })
      const json = await res.json()
      if (json.error === 'limit_reached') {
  setAiResult(`⚠️ ${json.message}`)
  setAiLoading(false)
  return
}
      setAiResult(json.result)
    } catch (e) {
      setAiResult('Gagal terhubung ke AI.')
    }
    setAiLoading(false)
  }

  const isReady = komitmen.k1 && komitmen.k2 && komitmen.k3

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href={`/school/${id}`} className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← {school?.name || 'Sekolah'}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">Komitmen (C)</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">🤝 Susun Komitmen</h1>
          <p className="text-slate-500 text-sm mt-1">Komitmen mengubah visi dari deklarasi menjadi kontrak nyata</p>
        </div>

        {/* TIPS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-xs font-bold text-red-600 mb-2">❌ Hindari</div>
            <p className="text-xs text-red-700">"Kami berkomitmen memberikan pendidikan terbaik" — terlalu umum, tidak terukur</p>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <div className="text-xs font-bold text-teal-600 mb-2">✅ Contoh kuat</div>
            <p className="text-xs text-teal-700">"Saya akan supervisi minimal 3 kelas setiap minggu dan beri feedback berbasis nilai"</p>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="space-y-5">
            {[
              { key: 'k1', label: 'Komitmen 1 — Sebagai Pemimpin', placeholder: 'Saya akan... (spesifik, ada frekuensi/ukuran)' },
              { key: 'k2', label: 'Komitmen 2 — Untuk Guru', placeholder: 'Saya akan memberikan/memastikan... setiap...' },
              { key: 'k3', label: 'Komitmen 3 — Untuk Siswa', placeholder: 'Siswa di sekolah ini akan merasakan...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <textarea
                  value={komitmen[key]}
                  onChange={e => { setKomitmen({ ...komitmen, [key]: e.target.value }); setSaved(false) }}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={save}
            disabled={saving || !isReady}
            className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
          >
            {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan' : 'Simpan Komitmen'}
          </button>
          <button
            onClick={analyze}
            disabled={aiLoading || !isReady}
            className="flex-1 bg-[#0D1B35] hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
          >
            {aiLoading ? 'Menganalisis...' : '🤖 Analisis dengan AI'}
          </button>
        </div>

        {saved && (
          <div className="flex justify-end mb-4">
            <Link href={`/school/${id}/visi`} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl transition">
              Lanjut ke Visi Final →
            </Link>
          </div>
        )}

        {aiResult && (
          <div className="bg-[#0D1B35] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Analisis AI</span>
            </div>
            <p className="text-white/85 text-sm leading-relaxed whitespace-pre-line">{aiResult}</p>
          </div>
        )}
      </div>
    </div>
  )
}