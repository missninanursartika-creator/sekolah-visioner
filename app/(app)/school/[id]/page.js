import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SchoolPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!school) redirect('/dashboard')

  const { data: vision } = await supabase
    .from('visions')
    .select('*')
    .eq('school_id', id)
    .single()

  const { data: diagnoses } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('school_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  const latestDiagnosis = diagnoses?.[0]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOPBAR */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-700 transition text-sm">
          ← Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700">{school.name}</span>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-800">{school.name}</h1>
              <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-3 py-1 rounded-full">
                {school.level}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {school.principal_name} · {school.city}
            </p>
          </div>
        </div>

        {/* MENU UTAMA */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {[
            {
              icon: '🩺',
              title: 'Diagnosis Visi',
              desc: 'Ukur kondisi visi sekolah saat ini',
              href: `/school/${id}/diagnosis`,
              status: latestDiagnosis ? `Skor: ${latestDiagnosis.score}/5` : 'Belum diisi',
              done: !!latestDiagnosis,
            },
            {
              icon: '🧭',
              title: 'Nilai (V)',
              desc: 'Pilih 3 nilai inti sekolah',
              href: `/school/${id}/nilai`,
              status: vision?.selected_values?.length === 3 ? '3 nilai dipilih' : 'Belum dipilih',
              done: vision?.selected_values?.length === 3,
            },
            {
              icon: '🎯',
              title: 'Intention (I)',
              desc: 'Gambarkan profil lulusan ideal',
              href: `/school/${id}/intention`,
              status: vision?.intention?.q1 ? 'Sudah diisi' : 'Belum diisi',
              done: !!vision?.intention?.q1,
            },
            {
              icon: '🤝',
              title: 'Komitmen (C)',
              desc: 'Susun komitmen konkret pemimpin',
              href: `/school/${id}/komitmen`,
              status: vision?.komitmen?.k1 ? 'Sudah diisi' : 'Belum diisi',
              done: !!vision?.komitmen?.k1,
            },
            {
              icon: '✨',
              title: 'Visi Final',
              desc: 'Generate pernyataan visi V+I+C',
              href: `/school/${id}/visi`,
              status: vision?.vision_statement ? 'Sudah dibuat' : 'Belum dibuat',
              done: !!vision?.vision_statement,
            },
            {
              icon: '💗',
              title: 'Vision Health Check',
              desc: 'Ukur seberapa hidup visi setiap bulan',
              href: `/school/${id}/healthcheck`,
              status: 'Lihat instrumen',
              done: false,
            },
            {
              icon: '📄',
              title: 'Laporan PDF',
              desc: 'Cetak laporan lengkap ke PDF',
              href: `/school/${id}/laporan`,
              status: 'Siap dicetak',
              done: false,
            },
          ].map((menu) => (
            <Link
              key={menu.title}
              href={menu.href}
              className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md p-6 transition group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-2xl">
                  {menu.icon}
                </div>
                {menu.done && (
                  <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-2 py-1 rounded-full">
                    ✓ Selesai
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 group-hover:text-teal-600 transition mb-1">
                {menu.title}
              </h3>
              <p className="text-slate-500 text-xs mb-3">{menu.desc}</p>
              <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                {menu.status}
              </div>
            </Link>
          ))}
        </div>

        {/* VISI PREVIEW */}
        {vision?.vision_statement && (
          <div className="bg-[#0D1B35] rounded-2xl p-8 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">
              Pernyataan Visi
            </div>
            <p className="text-white text-lg font-medium leading-relaxed italic">
              "{vision.vision_statement}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}