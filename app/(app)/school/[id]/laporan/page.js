'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LaporanPage() {
  const { id } = useParams()
  const supabase = createClient()

  const [school, setSchool] = useState(null)
  const [vision, setVision] = useState(null)
  const [diagnosis, setDiagnosis] = useState(null)
  const [healthChecks, setHealthChecks] = useState([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('schools').select('*').eq('id', id).single()
      setSchool(s)
      const { data: v } = await supabase.from('visions').select('*').eq('school_id', id).single()
      setVision(v)
      const { data: d } = await supabase.from('diagnoses').select('*').eq('school_id', id).order('created_at', { ascending: false }).limit(1)
      setDiagnosis(d?.[0])
      const { data: hc } = await supabase.from('health_checks').select('*').eq('school_id', id).order('created_at', { ascending: false })
      setHealthChecks(hc || [])
    }
    load()
  }, [id])

  const generatePDF = async () => {
    setGenerating(true)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageW = 210
    const margin = 20
    const contentW = pageW - margin * 2
    let y = margin

    const addPage = () => {
      doc.addPage()
      y = margin
      doc.setFillColor(13, 27, 53)
      doc.rect(0, 0, 210, 10, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.text('SEKOLAH VISIONER — Laporan Penyelarasan Visi', margin, 7)
      doc.text(school?.name || '', 190, 7, { align: 'right' })
      doc.setTextColor(13, 27, 53)
      y = 18
    }

    const checkPage = (needed = 20) => {
      if (y + needed > 280) addPage()
    }

    // ---- COVER ----
    doc.setFillColor(13, 27, 53)
    doc.rect(0, 0, 210, 297, 'F')
    doc.setFillColor(10, 123, 108)
    doc.rect(0, 200, 210, 97, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN', margin, 60)
    doc.text('PENYELARASAN', margin, 78)
    doc.setTextColor(201, 146, 42)
    doc.text('VISI SEKOLAH', margin, 96)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text(school?.name || '—', margin, 130)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Kepala Sekolah: ${school?.principal_name || '—'}`, margin, 145)
    doc.text(`${school?.level || ''} · ${school?.city || ''}`, margin, 155)
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 165)

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Platform Sekolah Visioner', margin, 215)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Framework V+I+C: Value · Intention · Commitment', margin, 225)

    // ---- PAGE 2: DIAGNOSIS ----
    addPage()

    doc.setFillColor(13, 27, 53)
    doc.rect(margin - 2, y - 4, contentW + 4, 11, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('BAGIAN 1: HASIL DIAGNOSIS VISI', margin + 2, y + 4)
    y += 16
    doc.setTextColor(13, 27, 53)

    const yes = diagnosis ? Object.values(diagnosis.answers || {}).filter(Boolean).length : 0
    const pct = Math.round((yes / 5) * 100)
    const scoreLabels = ['', 'Kritis', 'Perlu Perhatian', 'Berkembang', 'Kuat', 'Luar Biasa']

    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(`${pct}%`, margin, y + 8)
    doc.setFontSize(13)
    doc.setTextColor(10, 123, 108)
    doc.text(scoreLabels[yes] || '—', margin + 22, y + 8)
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${yes} dari 5 indikator terpenuhi`, margin, y + 16)
    y += 24

    const diagQuestions = [
      'Saya bisa menyebutkan visi sekolah tanpa melihat dinding',
      'Saya tahu makna visi bagi cara saya mengajar sehari-hari',
      'Saya pernah merujuk pada visi saat mengambil keputusan di kelas',
      'Siswa saya tahu mengapa mereka belajar di sekolah ini',
      'Saya bangga menceritakan visi sekolah ini kepada orang lain',
    ]

    diagQuestions.forEach((q, i) => {
      checkPage(10)
      const ans = diagnosis?.answers?.[i]
      doc.setTextColor(ans ? 16 : 239, ans ? 185 : 68, ans ? 129 : 68)
      doc.setFontSize(10)
      doc.text(ans ? '✓' : '✗', margin, y)
      doc.setTextColor(13, 27, 53)
      doc.text(q, margin + 8, y)
      y += 8
    })

    // ---- PAGE 3: VISI & NILAI ----
    addPage()

    doc.setFillColor(13, 27, 53)
    doc.rect(margin - 2, y - 4, contentW + 4, 11, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('BAGIAN 2: PERNYATAAN VISI V+I+C', margin + 2, y + 4)
    y += 16
    doc.setTextColor(13, 27, 53)

    if (vision?.vision_statement) {
      doc.setFillColor(245, 247, 250)
      doc.setDrawColor(10, 123, 108)
      doc.setLineWidth(0.8)
      const visiLines = doc.splitTextToSize(`"${vision.vision_statement}"`, contentW - 16)
      const boxH = visiLines.length * 7 + 12
      doc.roundedRect(margin, y, contentW, boxH, 3, 3, 'FD')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'italic')
      visiLines.forEach((line, li) => doc.text(line, margin + 8, y + 10 + li * 7))
      y += boxH + 12
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(13, 27, 53)
    doc.text('TIGA NILAI INTI', margin, y)
    y += 8

    const values = vision?.selected_values || []
    if (values.length > 0) {
      const boxW = (contentW - 12) / 3
      values.forEach((v, i) => {
        const bx = margin + i * (boxW + 6)
        doc.setFillColor(10, 123, 108)
        doc.roundedRect(bx, y, boxW, 10, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(v, bx + boxW / 2, y + 7, { align: 'center' })
        if (vision?.value_definitions?.[v]) {
          doc.setTextColor(100, 100, 100)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          const defLines = doc.splitTextToSize(vision.value_definitions[v], boxW - 4)
          defLines.slice(0, 2).forEach((dl, di) => doc.text(dl, bx + 2, y + 16 + di * 5))
        }
      })
      y += 36
    }

    // KOMITMEN
    checkPage(20)
    y += 8
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(13, 27, 53)
    doc.text('KOMITMEN KEPALA SEKOLAH', margin, y)
    y += 8

    const kom = vision?.komitmen || {}
    ;[kom.k1, kom.k2, kom.k3].filter(Boolean).forEach((k, i) => {
      checkPage(16)
      doc.setFillColor(245, 247, 250)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      const kLines = doc.splitTextToSize(`${i + 1}. ${k}`, contentW - 16)
      const kH = kLines.length * 6 + 8
      doc.roundedRect(margin, y, contentW, kH, 2, 2, 'FD')
      doc.setTextColor(13, 27, 53)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      kLines.forEach((kl, ki) => doc.text(kl, margin + 8, y + 6 + ki * 6))
      y += kH + 4
    })

    // ---- PAGE 4: 90 HARI ----
    addPage()
    doc.setFillColor(13, 27, 53)
    doc.rect(margin - 2, y - 4, contentW + 4, 11, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('BAGIAN 3: RENCANA AKSI 90 HARI', margin + 2, y + 4)
    y += 18

    const phases = [
      { name: 'BULAN 1: TANAM', color: [10, 123, 108], items: ['Workshop V+I+C bersama seluruh guru', 'Visualisasi visi: infografis di setiap ruang kelas', 'Visi masuk orientasi siswa baru', 'Sesi orang tua: visi sebagai janji kepada keluarga'] },
      { name: 'BULAN 2: RAWAT', color: [201, 146, 42], items: ['Mulai setiap rapat dengan Cerita Visi dari guru', 'Supervisi: dimensi profil lulusan jadi fokus', 'Visi Board di ruang guru', 'Review: nilai mana yang sudah terlihat?'] },
      { name: 'BULAN 3: RAYAKAN', color: [139, 92, 246], items: ['Visi Award bulanan: guru yang mencerminkan nilai', 'Showcase kelas: proyek profil lulusan', 'Evaluasi 90 hari: data perubahan budaya', 'Rencana triwulan berikutnya'] },
    ]

    phases.forEach(phase => {
      checkPage(50)
      const [r, g, b] = phase.color
      doc.setFillColor(r, g, b)
      doc.rect(margin, y, contentW, 9, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(phase.name, margin + 4, y + 6)
      y += 13
      doc.setTextColor(13, 27, 53)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      phase.items.forEach(item => {
        doc.setTextColor(r, g, b)
        doc.text('•', margin + 2, y)
        doc.setTextColor(13, 27, 53)
        doc.text(item, margin + 8, y)
        y += 7
      })
      y += 6
    })

    // Health Check
    if (healthChecks.length > 0) {
      addPage()
      doc.setFillColor(13, 27, 53)
      doc.rect(margin - 2, y - 4, contentW + 4, 11, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('BAGIAN 4: VISION HEALTH CHECK', margin + 2, y + 4)
      y += 16

      healthChecks.slice(0, 3).forEach(hc => {
        checkPage(30)
        doc.setFillColor(245, 247, 250)
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.3)
        doc.roundedRect(margin, y, contentW, 24, 2, 2, 'FD')
        doc.setTextColor(10, 123, 108)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const groupLabel = hc.type === 'guru' ? 'Guru' : hc.type === 'sda' ? 'SD Kelas 1-3' : hc.type === 'sdb' ? 'SD Kelas 4-6' : 'SMP/SMA'
        doc.text(`${groupLabel} — Bulan ${hc.month}/${hc.year}`, margin + 4, y + 8)
        doc.setTextColor(13, 27, 53)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Rata-rata skor: ${hc.avg_score}/5`, margin + 4, y + 16)
        y += 28
      })
    }

    // FOOTER
    const pageCount = doc.getNumberOfPages()
    for (let i = 2; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFillColor(245, 247, 250)
      doc.rect(0, 285, 210, 12, 'F')
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(`Halaman ${i} dari ${pageCount}`, margin, 291)
      doc.text('Sekolah Visioner © 2026', 105, 291, { align: 'center' })
      doc.text(new Date().toLocaleDateString('id-ID'), 190, 291, { align: 'right' })
    }

    const filename = `Laporan_Visi_${(school?.name || 'Sekolah').replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(filename)
    setGenerating(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href={`/school/${id}`} className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← {school?.name || 'Sekolah'}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">Laporan PDF</span>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800">📄 Laporan & Cetak PDF</h1>
            <p className="text-slate-500 text-sm mt-1">Laporan lengkap siap presentasi ke yayasan, dinas, atau wali murid</p>
          </div>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            {generating ? 'Membuat PDF...' : '⬇️ Unduh PDF'}
          </button>
        </div>

        {/* PREVIEW */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Profil Sekolah</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">Nama Sekolah</div>
                <div className="font-bold text-slate-800">{school?.name || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Kepala Sekolah</div>
                <div className="font-bold text-slate-800">{school?.principal_name || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Jenjang</div>
                <div className="font-bold text-slate-800">{school?.level || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Kota</div>
                <div className="font-bold text-slate-800">{school?.city || '—'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Diagnosis Visi</div>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black text-slate-800">
                {diagnosis ? `${Object.values(diagnosis.answers || {}).filter(Boolean).length}/5` : '—'}
              </div>
              <div>
                <div className="font-semibold text-slate-700">
                  {diagnosis ? ['', 'Kritis', 'Perlu Perhatian', 'Berkembang', 'Kuat', 'Luar Biasa'][Object.values(diagnosis.answers || {}).filter(Boolean).length] : 'Belum diisi'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Skor diagnosis visi</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pernyataan Visi</div>
            {vision?.vision_statement ? (
              <p className="text-slate-800 italic leading-relaxed">"{vision.vision_statement}"</p>
            ) : (
              <p className="text-slate-400 text-sm">Visi belum dibuat</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tiga Nilai Inti</div>
            <div className="flex gap-3">
              {vision?.selected_values?.length > 0 ? vision.selected_values.map(v => (
                <div key={v} className="flex-1 bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                  <div className="font-bold text-teal-700">{v}</div>
                  {vision.value_definitions?.[v] && (
                    <div className="text-xs text-teal-600 mt-1">{vision.value_definitions[v]}</div>
                  )}
                </div>
              )) : <p className="text-slate-400 text-sm">Nilai belum dipilih</p>}
            </div>
          </div>

          {healthChecks.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Vision Health Check</div>
              <div className="space-y-3">
                {healthChecks.slice(0, 3).map(hc => (
                  <div key={hc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-sm text-slate-700">
                        {hc.type === 'guru' ? 'Guru' : hc.type === 'sda' ? 'SD Kelas 1-3' : hc.type === 'sdb' ? 'SD Kelas 4-6' : 'SMP/SMA'}
                      </div>
                      <div className="text-xs text-slate-500">Bulan {hc.month}/{hc.year}</div>
                    </div>
                    <div className="text-lg font-black text-teal-600">{hc.avg_score}/5</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}