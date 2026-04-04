'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function VisiPage() {
  const { id } = useParams()
  const supabase = createClient()

  const [school, setSchool] = useState(null)
  const [vision, setVision] = useState(null)
  const [statement, setStatement] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('schools').select('*').eq('id', id).single()
      setSchool(s)
      const { data: v } = await supabase.from('visions').select('*').eq('school_id', id).single()
      if (v) {
        setVision(v)
        setStatement(v.vision_statement || '')
      }
    }
    load()
  }, [id])

  const generate = async () => {
    if (!vision) return
    setAiLoading(true)
    setStatement('')

    const values = (vision.selected_values || [])
      .map((v, i) => `${i + 1}. ${v}${vision.value_definitions?.[v] ? ` (${vision.value_definitions[v]})` : ''}`)
      .join(', ')

    const int = vision.intention || {}
    const intentionText = `individu yang ${int.q1 || '...'}, ${int.q2 || '...'}, dan ${int.q3 || '...'}. Mampu ${int.q4 || '...'} dan berkontribusi dengan cara ${int.q5 || '...'}`

    const kom = vision.komitmen || {}
    const komitmenText = [kom.k1, kom.k2, kom.k3].filter(Boolean).join('; ')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'visi',
          data: {
            school: school?.name,
            values,
            intention: intentionText,
            komitmen: komitmenText,
          },
        }),
      })
      const json = await res.json()
      if (json.error === 'limit_reached') {
  setAiResult(`⚠️ ${json.message}`)
  setAiLoading(false)
  return
}
      setStatement(json.result)
      setSaved(false)
    } catch (e) {
      setStatement('Gagal generate. Coba lagi.')
    }
    setAiLoading(false)
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('visions').update({ vision_statement: statement, updated_at: new Date() }).eq('school_id', id)
    setSaving(false)
    setSaved(true)
  }

  const isReady = vision?.selected_values?.length === 3 && vision?.intention?.q1 && vision?.komitmen?.k1

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href={`/school/${id}`} className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← {school?.name || 'Sekolah'}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">Visi Final</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">✨ Visi Final V+I+C</h1>
          <p className="text-slate-500 text-sm mt-1">AI akan merangkai Nilai, Intention, dan Komitmen menjadi satu pernyataan visi yang kuat</p>
        </div>

        {/* SUMMARY */}
        {vision && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Nilai</div>
              <div className="text-sm text-slate-700">
                {vision.selected_values?.length > 0
                  ? vision.selected_values.join(' · ')
                  : <span className="text-slate-400">Belum diisi</span>}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Intention</div>
              <div className="text-sm text-slate-700">
                {vision.intention?.q1
                  ? `${vision.intention.q1}, ${vision.intention.q2}, ${vision.intention.q3}`
                  : <span className="text-slate-400">Belum diisi</span>}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Komitmen</div>
              <div className="text-sm text-slate-700">
                {vision.komitmen?.k1
                  ? vision.komitmen.k1.substring(0, 60) + '...'
                  : <span className="text-slate-400">Belum diisi</span>}
              </div>
            </div>
          </div>
        )}

        {!isReady && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="text-sm font-semibold text-amber-700 mb-1">⚠️ Belum lengkap</div>
            <p className="text-xs text-amber-600">Lengkapi Nilai, Intention, dan Komitmen terlebih dahulu sebelum generate visi.</p>
            <div className="flex gap-3 mt-3">
              <Link href={`/school/${id}/nilai`} className="text-xs text-amber-700 font-semibold hover:underline">→ Nilai</Link>
              <Link href={`/school/${id}/intention`} className="text-xs text-amber-700 font-semibold hover:underline">→ Intention</Link>
              <Link href={`/school/${id}/komitmen`} className="text-xs text-amber-700 font-semibold hover:underline">→ Komitmen</Link>
            </div>
          </div>
        )}

        {/* GENERATE */}
        <button
          onClick={generate}
          disabled={aiLoading || !isReady}
          className="w-full bg-[#0D1B35] hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition mb-6"
        >
          {aiLoading ? '✨ Merancang visi...' : '✨ Generate Pernyataan Visi dengan AI'}
        </button>

        {/* RESULT */}
        {statement && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Pernyataan Visi</div>
            <div className="bg-gradient-to-br from-teal-50 to-slate-50 border-2 border-teal-200 rounded-xl p-6 mb-5">
              <p className="text-slate-800 text-base font-medium leading-relaxed italic text-center">
                "{statement}"
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Edit / Sempurnakan:</label>
              <textarea
                value={statement}
                onChange={e => { setStatement(e.target.value); setSaved(false) }}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {saving ? 'Menyimpan...' : saved ? '✓ Visi Tersimpan' : '💾 Simpan Visi'}
              </button>
              <button
                onClick={generate}
                disabled={aiLoading}
                className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
              >
                🔄 Generate Ulang
              </button>
            </div>
          </div>
        )}

        {saved && (
          <div className="flex justify-end">
            <Link href={`/school/${id}`} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl transition">
              Kembali ke Sekolah →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}