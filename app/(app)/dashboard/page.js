import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const firstName = profile?.full_name?.split(' ')[0] || 'Kepala Sekolah'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOPBAR */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-sm">🏫</div>
          <span className="font-bold text-slate-800">Sekolah Visioner</span>
        </div>

        <div className="flex items-center gap-4">
  <Link href="/billing" className="text-sm text-amber-600 font-semibold hover:underline">
    ⭐ Upgrade Pro
  </Link>
  <span className="text-sm text-slate-500">{user.email}</span>
  <form action="/api/auth/logout" method="POST">
    <button className="text-sm text-slate-500 hover:text-slate-800 transition">Keluar</button>
  </form>
</div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* GREETING */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">Selamat datang, {firstName}! 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau perjalanan penyelarasan visi sekolah Anda</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Total Sekolah', value: schools?.length || 0, icon: '🏫', color: 'bg-teal-50 text-teal-700' },
            { label: 'Paket Aktif', value: profile?.plan === 'pro' ? 'Pro' : 'Gratis', icon: '⭐', color: 'bg-amber-50 text-amber-700' },
            { label: 'Status Visi', value: schools?.length > 0 ? 'Aktif' : 'Belum mulai', icon: '🎯', color: 'bg-blue-50 text-blue-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <div className="text-2xl font-black text-slate-800">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* SCHOOLS */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">Sekolah Anda</h2>
          <Link
            href="/school/new"
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            + Tambah Sekolah
          </Link>
        </div>

        {schools?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="text-5xl mb-4">🏫</div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Belum ada sekolah</h3>
            <p className="text-slate-500 text-sm mb-6">Tambahkan sekolah pertama Anda untuk mulai merancang visi</p>
            <Link
              href="/school/new"
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-3 rounded-xl transition inline-block"
            >
              + Tambah Sekolah Pertama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {schools.map((school) => (
              <Link
                key={school.id}
                href={`/school/${school.id}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md p-6 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-xl">🏫</div>
                  <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-3 py-1 rounded-full">
                    {school.level || 'Sekolah'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 group-hover:text-teal-600 transition">{school.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{school.principal_name || 'Kepala sekolah belum diisi'}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {new Date(school.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-teal-600 font-semibold group-hover:underline">Buka →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}