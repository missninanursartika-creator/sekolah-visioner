'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const pppDimensi = [
  { id: 'beriman', icon: '🕌', label: 'Beriman & Bertakwa', desc: 'Akhlak mulia & iman' },
  { id: 'berkewargaan', icon: '🌍', label: 'Berkewargaan Global', desc: 'Wawasan global & lokal' },
  { id: 'bernalar', icon: '🧠', label: 'Bernalar Kritis', desc: 'Analisis & evaluasi' },
  { id: 'kreatif', icon: '💡', label: 'Kreatif', desc: 'Inovasi & ide baru' },
  { id: 'kolaboratif', icon: '🤝', label: 'Kolaboratif', desc: 'Kerja sama tim' },
  { id: 'mandiri', icon: '🦅', label: 'Mandiri', desc: 'Regulasi diri' },
  { id: 'wellbeing', icon: '💚', label: 'Sehat (Well-being)', desc: 'Fisik & mental' },
  { id: 'komunikatif', icon: '💬', label: 'Komunikatif', desc: 'Ekspresi & literasi' },
]

export default function IntentionPage() {
  const { id } = useParams()
  const supabase = createClient()

  const [school, setSchool] = useState(null)
  const [pppSelected, setPppSelected] = useState([])
  const [intention, setIntention] = useState({ q1: '', q2: '', q3: '', q4: '', q5: '' })
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
      setPppSelected(v.ppp_selected || [])
      setIntention({
        q1: v.intention?.q1 || '',
        q2: v.intention?.q2 || '',
        q3: v.intention?.q3 || '',
        q4: v.intention?.q4 || '',
        q5: v.intention?.q5 || '',
      })
    }
  }
  load()
}, [id])

  const togglePPP = (pid) => {
    if (pppSelected.includes(pid)) {
      setPppSelected(pppSelected.filter(x => x !== pid))
    } else {
      if (pppSelected.length >= 4) return
      setPppSelected([...pppSelected, pid])
    }
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    const { data: existing } = await supabase.from('visions').select('id').eq('school_id', id).single()
    if (existing) {
      await supabase.from('visions').update({ ppp_selected: pppSelected, intention, updated_at: new Date() }).eq('school_id', id)
    } else {
      await supabase.from('visions').insert({ school_id: id, ppp_selected: pppSelected, intention })
    }
    setSaving(false)
    setSaved(true)
  }

  const analyze = async () => {
    setAiLoading(true)
    setAiResult('')
    const pppLabels = pppSelected.map(pid => pppDimensi.find(d => d.id === pid)?.label).filter(Boolean).join(', ')
    const statement = `individu yang ${intention.q1}, ${intention.q2}, dan ${intention.q3}. Mereka mampu ${intention.q4} dan berkontribusi dengan cara ${intention.q5}`
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'intention',
          data: { school: school?.name, statement, ppp: pppLabels },
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

  const isReady = intention.q1 && intention.q2 && intention.q3 && intention.q4 && intention.q5

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href={`/school/${id}`} className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← {school?.name || 'Sekolah'}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">Intention (I)</span>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">🎯 Rancang Intention</h1>
          <p className="text-slate-500 text-sm mt-1">Manusia seperti apa yang ingin Anda bentuk? Bukan soal nilai ujian — tapi tentang karakter.</p>
        </div>

        {/* PPP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Pilih Dimensi Profil Pelajar Pancasila</h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${pppSelected.length === 4 ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
              {pppSelected.length} / 4 dipilih
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {pppDimensi.map((d) => (
              <button
                key={d.id}
                onClick={() => togglePPP(d.id)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  pppSelected.includes(d.id)
                    ? 'border-teal-500 bg-teal-50'
                    : pppSelected.length >= 4
                    ? 'border-slate-200 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="text-2xl mb-1">{d.icon}</div>
                <div className="text-xs font-bold text-slate-800">{d.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* WORKSHEET */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-2">Gambaran Siswa Ideal</h2>
          <p className="text-slate-500 text-xs mb-5">Lengkapi kalimat berikut untuk menggambarkan profil lulusan sekolah Anda</p>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-loose">
              "Lima tahun dari sekarang, siswa kami adalah individu yang{' '}
              <input type="text" value={intention.q1} onChange={e => { setIntention({ ...intention, q1: e.target.value }); setSaved(false) }}
                placeholder="karakter 1" className="inline border-b-2 border-teal-400 bg-transparent px-1 focus:outline-none w-32" />,{' '}
              <input type="text" value={intention.q2} onChange={e => { setIntention({ ...intention, q2: e.target.value }); setSaved(false) }}
                placeholder="karakter 2" className="inline border-b-2 border-teal-400 bg-transparent px-1 focus:outline-none w-32" />, dan{' '}
              <input type="text" value={intention.q3} onChange={e => { setIntention({ ...intention, q3: e.target.value }); setSaved(false) }}
                placeholder="karakter 3" className="inline border-b-2 border-teal-400 bg-transparent px-1 focus:outline-none w-32" />.
              Mereka mampu{' '}
              <input type="text" value={intention.q4} onChange={e => { setIntention({ ...intention, q4: e.target.value }); setSaved(false) }}
                placeholder="kemampuan" className="inline border-b-2 border-teal-400 bg-transparent px-1 focus:outline-none w-40" />{' '}
              dan berkontribusi dengan cara{' '}
              <input type="text" value={intention.q5} onChange={e => { setIntention({ ...intention, q5: e.target.value }); setSaved(false) }}
                placeholder="kontribusi" className="inline border-b-2 border-teal-400 bg-transparent px-1 focus:outline-none w-40" />."
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={save}
            disabled={saving || !isReady}
            className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
          >
            {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan' : 'Simpan Intention'}
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
            <Link href={`/school/${id}/komitmen`} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl transition">
              Lanjut ke Komitmen →
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