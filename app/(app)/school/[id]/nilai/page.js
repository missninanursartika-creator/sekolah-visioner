'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const allValues = [
  'Rasa ingin tahu', 'Keberanian', 'Integritas', 'Kolaborasi', 'Kreativitas',
  'Kejujuran', 'Kemandirian', 'Tanggung Jawab', 'Kegembiraan', 'Kepedulian',
  'Disiplin Bermakna', 'Inovasi', 'Penghargaan', 'Pelayanan', 'Kedamaian',
  'Spiritualitas', 'Empati', 'Keadilan', 'Semangat Belajar', 'Kesederhanaan',
  'Keramahan', 'Kepercayaan', 'Kebijaksanaan', 'Ketangguhan', 'Keteladanan',
  'Kebersamaan', 'Keterbukaan', 'Ketulusan', 'Kedisiplinan', 'Keikhlasan',
]

export default function NilaiPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [school, setSchool] = useState(null)
  const [selected, setSelected] = useState([])
  const [defs, setDefs] = useState({})
  const [customValue, setCustomValue] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('schools').select('*').eq('id', id).single()
      setSchool(s)
      const { data: v } = await supabase.from('visions').select('*').eq('school_id', id).single()
      if (v) {
        setSelected(v.selected_values || [])
        setDefs(v.value_definitions || {})
        setAiResult('')
      }
    }
    load()
  }, [id])

  const toggleValue = (v) => {
    if (selected.includes(v)) {
      setSelected(selected.filter(x => x !== v))
    } else {
      if (selected.length >= 3) return
      setSelected([...selected, v])
    }
    setSaved(false)
  }

  const addCustom = () => {
    if (!customValue.trim()) return
    if (selected.length >= 3) return
    setSelected([...selected, customValue.trim()])
    setCustomValue('')
    setSaved(false)
  }

  const saveVision = async () => {
    setSaving(true)
    const { data: existing } = await supabase.from('visions').select('id').eq('school_id', id).single()
    if (existing) {
      await supabase.from('visions').update({ selected_values: selected, value_definitions: defs, updated_at: new Date() }).eq('school_id', id)
    } else {
      await supabase.from('visions').insert({ school_id: id, selected_values: selected, value_definitions: defs })
    }
    setSaving(false)
    setSaved(true)
  }

  const analyze = async () => {
    if (selected.length < 3) return
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nilai',
          data: {
            school: school?.name,
            values: selected.map((v, i) => `${i + 1}. ${v}`).join('\n'),
            defs: selected.map(v => `- ${v}: "${defs[v] || 'belum didefinisikan'}"`).join('\n'),
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

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href={`/school/${id}`} className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← {school?.name || 'Sekolah'}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">Nilai (V)</span>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800">🧭 Pilih Nilai Inti</h1>
            <p className="text-slate-500 text-sm mt-1">Pilih tepat 3 nilai yang paling mencerminkan identitas sekolah Anda</p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold text-sm ${selected.length === 3 ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
            {selected.length} / 3 dipilih
          </div>
        </div>

        {/* VALUE CARDS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-5 gap-3 mb-4">
            {allValues.map((v) => (
              <button
                key={v}
                onClick={() => toggleValue(v)}
                className={`p-3 rounded-xl border-2 text-xs font-semibold transition ${
                  selected.includes(v)
                    ? 'border-teal-500 bg-teal-500 text-white'
                    : selected.length >= 3
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-200 text-slate-700 hover:border-teal-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="✏️ Tulis nilai sendiri..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={addCustom}
              disabled={selected.length >= 3}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* DEFINISI */}
        {selected.length === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="font-bold text-slate-800 mb-4">Definisikan Nilai Anda</h2>
            <p className="text-slate-500 text-xs mb-5">Apa arti nyata nilai ini di sekolah Anda? Buat definisi operasional — bukan definisi kamus.</p>
            {selected.map((v) => (
              <div key={v} className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {v} — artinya bagi sekolah kami:
                </label>
                <textarea
                  value={defs[v] || ''}
                  onChange={e => setDefs({ ...defs, [v]: e.target.value })}
                  placeholder={`Nilai ${v} artinya kami memilih... / kami merayakan... / kami menolak...`}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        {selected.length === 3 && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={saveVision}
              disabled={saving}
              className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
            >
              {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan' : 'Simpan Nilai'}
            </button>
            <button
              onClick={analyze}
              disabled={aiLoading}
              className="flex-1 bg-[#0D1B35] hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
            >
              {aiLoading ? 'Menganalisis...' : '🤖 Analisis dengan AI'}
            </button>
          </div>
        )}

        {saved && (
          <div className="flex justify-end mb-4">
            <Link
              href={`/school/${id}/intention`}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Lanjut ke Intention →
            </Link>
          </div>
        )}

        {/* AI RESULT */}
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