'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const diagQuestions = [
  'Saya bisa menyebutkan visi sekolah kita tanpa melihat dinding',
  'Saya tahu apa makna visi itu bagi cara saya mengajar sehari-hari',
  'Saya pernah merujuk pada visi saat mengambil keputusan di kelas',
  'Siswa saya tahu mengapa mereka belajar di sekolah ini',
  'Saya bangga menceritakan visi sekolah ini kepada orang lain',
]

export default function DiagnosisPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [school, setSchool] = useState(null)
  const [answers, setAnswers] = useState({})
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('schools').select('*').eq('id', id).single()
      setSchool(s)
      const { data: d } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('school_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (d?.[0]) {
        setAnswers(d[0].answers || {})
        setAiResult(d[0].ai_analysis || '')
      }
    }
    load()
  }, [id])

  const setAnswer = (i, val) => {
    setAnswers(prev => ({ ...prev, [i]: val }))
    setSaved(false)
  }

  const score = Object.values(answers).filter(v => v === true).length
  const totalAnswered = Object.keys(answers).length
  const scoreLabels = ['', 'Kritis', 'Perlu Perhatian', 'Berkembang', 'Kuat', 'Luar Biasa']
  const scoreColors = ['', 'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-blue-600', 'text-emerald-600']

  const analyze = async () => {
    setAiLoading(true)
    setAiResult('')

    const answerText = diagQuestions.map((q, i) =>
      `${i + 1}. ${q}: ${answers[i] === true ? '✅ Ya' : '❌ Tidak'}`
    ).join('\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'diagnosis',
          data: {
            school: school?.name,
            answers: answerText,
            score: `${score}/5`,
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
      await supabase.from('diagnoses').insert({
        school_id: id,
        answers,
        score,
        ai_analysis: json.result,
      })
      setSaved(true)
    } catch (e) {
      setAiResult('Gagal terhubung ke AI. Coba lagi.')
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
        <span className="text-sm font-semibold text-slate-700">Diagnosis Visi</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">🩺 Diagnosis Visi</h1>
          <p className="text-slate-500 text-sm mt-1">Jawab dengan jujur — ini titik awal perjalanan Anda</p>
        </div>

        {/* SCORE */}
        {totalAnswered > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-black text-slate-800">{score}/5</div>
              <div className="text-xs text-slate-500 mt-1">dijawab Ya</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${scoreColors[score] || 'text-slate-600'}`}>
                {scoreLabels[score] || '—'}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {score <= 1 && 'Visi belum dirasakan oleh warga sekolah'}
                {score === 2 && 'Visi mulai dikenal tapi belum dihayati'}
                {score === 3 && 'Visi sudah ada awareness, perlu pendalaman'}
                {score === 4 && 'Visi mulai hidup, terus rawat konsistensinya'}
                {score === 5 && 'Visi benar-benar hidup di sekolah Anda!'}
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex justify-end gap-6 mb-3 pr-2">
            <span className="text-xs font-bold text-teal-600">✓ Ya</span>
            <span className="text-xs font-bold text-red-400">✗ Tidak</span>
          </div>
          <div className="space-y-3">
            {diagQuestions.map((q, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                  answers[i] === true
                    ? 'border-teal-400 bg-teal-50'
                    : answers[i] === false
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-sm text-slate-700 leading-relaxed flex-1">
                  {i + 1}. {q}
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setAnswer(i, true)}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg transition ${
                      answers[i] === true
                        ? 'border-teal-500 bg-teal-500 text-white'
                        : 'border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-500'
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setAnswer(i, false)}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg transition ${
                      answers[i] === false
                        ? 'border-red-400 bg-red-400 text-white'
                        : 'border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-400'
                    }`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={analyze}
          disabled={aiLoading || totalAnswered < 5}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition mb-3"
        >
          {aiLoading ? 'Menganalisis...' : '🤖 Analisis dengan AI'}
        </button>

        {totalAnswered < 5 && (
          <p className="text-center text-slate-400 text-sm mb-6">
            Jawab semua {diagQuestions.length} pertanyaan untuk menganalisis ({totalAnswered}/5)
          </p>
        )}

        {/* AI RESULT */}
        {aiResult && (
          <div className="bg-[#0D1B35] rounded-2xl p-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Analisis AI</span>
              {saved && <span className="ml-auto text-xs text-white/40">✓ Tersimpan</span>}
            </div>
            <p className="text-white/85 text-sm leading-relaxed whitespace-pre-line">{aiResult}</p>
          </div>
        )}
      </div>
    </div>
  )
}