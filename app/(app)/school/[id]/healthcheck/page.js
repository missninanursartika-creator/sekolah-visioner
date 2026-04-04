'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const guruQuestions = [
  { dim: 'Modeling', text: 'Perilaku kepala sekolah sehari-hari mencerminkan nilai yang dinyatakan dalam visi sekolah' },
  { dim: 'Modeling', text: 'Ketika kepala sekolah mengambil keputusan sulit, saya bisa melihat nilai sekolah menjadi pertimbangannya' },
  { dim: 'Modeling', text: 'Saya merasa aman dan didukung untuk "hidup" sesuai nilai sekolah dalam praktik mengajar saya' },
  { dim: 'Language', text: 'Nilai-nilai dalam visi sekolah muncul secara natural dalam percakapan harian — rapat, briefing, supervisi' },
  { dim: 'Language', text: 'Saya memahami dengan jelas makna setiap nilai dalam visi sekolah, bukan sekadar hafal kalimatnya' },
  { dim: 'System', text: 'Aturan dan kebijakan sekolah terasa bersumber dari nilai bersama, bukan sekadar instrumen kontrol' },
  { dim: 'System', text: 'Proses penilaian kinerja guru mencerminkan nilai dan tujuan yang ada di visi' },
  { dim: 'System', text: 'Penghargaan dan pengakuan diberikan kepada guru yang mencerminkan nilai sekolah' },
  { dim: 'Story', text: 'Saya pernah mendengar atau menceritakan sendiri kisah nyata dari kelas yang mencerminkan nilai sekolah' },
  { dim: 'Story', text: 'Jika ada orang baru masuk ke sekolah ini, mereka akan langsung merasakan budaya yang berbeda dan bermakna' },
]

const tabs = [
  { id: 'guru', label: '👩‍🏫 Guru', desc: 'Skala 1-5' },
  { id: 'sda', label: '🧒 SD Kelas 1-3', desc: 'Wajah 😞😐😊' },
  { id: 'sdb', label: '📚 SD Kelas 4-6', desc: '4 pilihan' },
  { id: 'smc', label: '🎓 SMP/SMA', desc: 'Skala 1-5' },
]

const sdaQuestions = [
  'Aku suka datang ke sekolah ini',
  'Guru-guruku baik dan mau membantuku',
  'Di sekolah ini, aku boleh bertanya kalau tidak mengerti',
  'Ketika aku berbuat salah, guruku mengajarkan yang benar dengan cara yang baik',
  'Aku merasa aman dan nyaman di sekolah ini',
  'Guruku sering memuji usahaku, bukan hanya nilaiku',
  'Teman-temanku di sini saling membantu satu sama lain',
  'Aku tahu apa yang harus aku lakukan agar menjadi murid yang baik di sekolah ini',
  'Belajar di sini terasa menyenangkan, bukan membosankan',
  'Aku bangga bersekolah di sini',
]

const sdbQuestions = [
  'Aku senang dan semangat pergi ke sekolah ini',
  'Guru-guruku mengajar dengan cara yang menyenangkan dan mudah dipahami',
  'Ketika ada masalah di kelas, guru menyelesaikannya dengan adil',
  'Di sekolah ini, aku diajarkan untuk jadi orang yang baik, bukan hanya pintar',
  'Aku tahu apa yang penting dan dihargai di sekolah ini',
  'Guru-guruku juga melakukan hal-hal yang mereka ajarkan kepada kami',
  'Aku merasa guruku peduli padaku sebagai murid, bukan hanya pada nilaiku',
  'Di sekolah ini, aku belajar hal-hal yang berguna untuk kehidupanku',
  'Aku bisa menceritakan kepada orang tuaku hal baik yang aku pelajari hari ini',
  'Kalau ada teman yang tanya sekolahku bagus atau tidak, aku akan bilang bagus',
]

const smcQuestions = [
  'Aku tahu tujuan sekolah ini, lebih dari sekadar belajar biar lulus ujian',
  'Nilai-nilai yang diajarkan di sekolah ini benar-benar terasa dalam kehidupan sehari-hari',
  'Guru-guruku mengajar dengan cara yang mencerminkan nilai yang mereka ajarkan',
  'Ketika ada masalah, guru atau kepala sekolah menyelesaikannya dengan adil dan konsisten',
  'Aku merasa guru-guru di sini peduli pada perkembanganku sebagai manusia',
  'Aku tahu mengapa aku belajar — ada tujuan yang lebih besar dari sekadar nilai rapor',
  'Pengalaman di sekolah ini membentukku menjadi orang yang lebih baik',
  'Aku merasa nyaman menjadi diri sendiri di sekolah ini',
  'Aku bisa menjelaskan kepada orang lain apa yang membuat sekolah ini berbeda',
  'Jika bisa memilih ulang, aku tetap akan memilih sekolah ini',
]

const questionsMap = { guru: guruQuestions.map(q => q.text), sda: sdaQuestions, sdb: sdbQuestions, smc: smcQuestions }

export default function HealthCheckPage() {
  const { id } = useParams()
  const supabase = createClient()

  const [school, setSchool] = useState(null)
  const [activeTab, setActiveTab] = useState('guru')
  const [answers, setAnswers] = useState({ guru: {}, sda: {}, sdb: {}, smc: {} })
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('schools').select('*').eq('id', id).single()
      setSchool(s)
    }
    load()
  }, [id])

  const setAnswer = (group, idx, val) => {
    setAnswers(prev => ({ ...prev, [group]: { ...prev[group], [idx]: val } }))
  }

  const analyze = async () => {
    setAiLoading(true)
    setAiResult('')
    const groupAnswers = answers[activeTab]
    const questions = questionsMap[activeTab]
    const avgScore = Object.values(groupAnswers).length
      ? (Object.values(groupAnswers).reduce((a, b) => a + b, 0) / Object.values(groupAnswers).length).toFixed(1)
      : 0

    const answerText = questions.map((q, i) => `${i + 1}. ${q}: ${groupAnswers[i] || '(belum diisi)'}`).join('\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'healthcheck',
          data: {
            school: school?.name,
            group: activeTab,
            avgScore,
            answers: answerText,
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

      await supabase.from('health_checks').insert({
        school_id: id,
        type: activeTab,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        answers: groupAnswers,
        avg_score: avgScore,
        ai_analysis: json.result,
      })
    } catch (e) {
      setAiResult('Gagal terhubung ke AI.')
    }
    setAiLoading(false)
  }

  const renderGuruQuestions = () => {
    let lastDim = ''
    return guruQuestions.map((q, i) => {
      const dimHeader = q.dim !== lastDim ? (() => { lastDim = q.dim; return true })() : false
      return (
        <div key={i}>
          {dimHeader && (
            <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mt-5 mb-3 pb-2 border-b border-slate-100">
              Dimensi {q.dim}
            </div>
          )}
          <div className="mb-4">
            <p className="text-sm text-slate-700 mb-2">{i + 1}. {q.text}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  onClick={() => setAnswer('guru', i, v)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition ${
                    answers.guru[i] === v
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-teal-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
              <span>Sangat tidak setuju</span>
              <span>Sangat setuju</span>
            </div>
          </div>
        </div>
      )
    })
  }

  const renderEmojiQuestions = (group, questions) => (
    questions.map((q, i) => (
      <div key={i} className="mb-4">
        <p className="text-sm text-slate-700 mb-2">{i + 1}. {q}</p>
        <div className="flex gap-3">
          {[{ v: 1, e: '😞' }, { v: 2, e: '😐' }, { v: 3, e: '😊' }].map(({ v, e }) => (
            <button
              key={v}
              onClick={() => setAnswer(group, i, v)}
              className={`flex-1 py-3 rounded-xl border-2 text-2xl transition ${
                answers[group][i] === v
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-300'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    ))
  )

  const renderFreqQuestions = (questions) => (
    questions.map((q, i) => (
      <div key={i} className="mb-4">
        <p className="text-sm text-slate-700 mb-2">{i + 1}. {q}</p>
        <div className="flex gap-2">
          {[{ v: 1, l: 'Tidak pernah' }, { v: 2, l: 'Kadang' }, { v: 3, l: 'Sering' }, { v: 4, l: 'Selalu' }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setAnswer('sdb', i, v)}
              className={`flex-1 py-2 px-1 rounded-lg border-2 text-xs font-semibold transition ${
                answers.sdb[i] === v
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-teal-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    ))
  )

  const renderScaleQuestions = (group, questions) => (
    questions.map((q, i) => (
      <div key={i} className="mb-4">
        <p className="text-sm text-slate-700 mb-2">{i + 1}. {q}</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              onClick={() => setAnswer(group, i, v)}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition ${
                answers[group][i] === v
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-teal-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    ))
  )

  const currentAnswers = answers[activeTab]
  const answeredCount = Object.keys(currentAnswers).length

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href={`/school/${id}`} className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← {school?.name || 'Sekolah'}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">Vision Health Check</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">💗 Vision Health Check</h1>
          <p className="text-slate-500 text-sm mt-1">Ukur seberapa hidup visi sekolah — diisi setiap akhir bulan</p>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setAiResult('') }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* QUESTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          {activeTab === 'guru' && renderGuruQuestions()}
          {activeTab === 'sda' && renderEmojiQuestions('sda', sdaQuestions)}
          {activeTab === 'sdb' && renderFreqQuestions(sdbQuestions)}
          {activeTab === 'smc' && renderScaleQuestions('smc', smcQuestions)}
        </div>

        <button
          onClick={analyze}
          disabled={aiLoading || answeredCount < 10}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition mb-3"
        >
          {aiLoading ? 'Menganalisis...' : '🤖 Analisis Hasil dengan AI'}
        </button>

        {answeredCount < 10 && (
          <p className="text-center text-slate-400 text-sm mb-4">
            Jawab semua 10 pertanyaan untuk menganalisis ({answeredCount}/10)
          </p>
        )}

        {aiResult && (
          <div className="bg-[#0D1B35] rounded-2xl p-6 mt-4">
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