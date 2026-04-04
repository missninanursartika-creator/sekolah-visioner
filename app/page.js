import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0D1B35] text-white">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-lg">🏫</div>
          <span className="font-bold text-lg">Sekolah Visioner</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition">Masuk</Link>
          <Link href="/register" className="text-sm bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-lg font-semibold transition">
            Daftar Gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-32 grid grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-semibold text-amber-400 uppercase tracking-wider mb-8">
            🏫 Platform Kepala Sekolah Indonesia
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6">
            Jadikan Visi<br />Sekolahmu<br />
            <span className="text-amber-400">Hidup.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed mb-10">
            Bukan sekadar banner di dinding — tapi budaya yang dirasakan setiap hari.
            Diagnosa, rancang, dan ukur penyelarasan visi sekolahmu dengan panduan berbasis AI.
          </p>
          <div className="flex gap-4">
            <Link href="/register" className="bg-teal-600 hover:bg-teal-500 px-6 py-3 rounded-xl font-semibold transition">
              🚀 Mulai Sekarang — Gratis
            </Link>
            <Link href="/login" className="bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 rounded-xl font-semibold transition">
              Masuk
            </Link>
          </div>
          <p className="text-white/30 text-xs mt-5">
            ✓ Tidak perlu kartu kredit &nbsp;·&nbsp; ✓ Data tersimpan aman &nbsp;·&nbsp; ✓ AI powered
          </p>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-2xl p-7">
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-5">Fitur Unggulan</p>
          <ul className="space-y-1">
            {[
              { icon: '🩺', title: 'Diagnosis Visi', desc: 'Ukur kondisi visi sekolah Anda hari ini — jujur, terstruktur, akurat.' },
              { icon: '🧭', title: 'Perancang V+I+C', desc: 'Bangun visi berbasis Nilai, Intention, dan Komitmen — dipandu AI.' },
              { icon: '💗', title: 'Vision Health Check', desc: 'Ukur seberapa hidup visi Anda setiap bulan — guru & murid.' },
              { icon: '📄', title: 'Laporan PDF Profesional', desc: 'Cetak laporan lengkap siap presentasi ke yayasan atau dinas.' },
            ].map((f) => (
              <li key={f.title} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition border-b border-white/5 last:border-0">
                <div className="w-9 h-9 bg-teal-600/30 rounded-lg flex items-center justify-center text-lg flex-shrink-0">{f.icon}</div>
                <div>
                  <div className="font-semibold text-sm text-white">{f.title}</div>
                  <div className="text-white/50 text-xs mt-1 leading-relaxed">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto px-8 pb-32">
        <h2 className="text-3xl font-black text-center mb-4">Pilih Paket</h2>
        <p className="text-white/50 text-center mb-12">Mulai gratis, upgrade kapanpun</p>
        <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="bg-white/4 border border-white/10 rounded-2xl p-8">
            <div className="text-sm font-semibold text-white/50 mb-2">Gratis</div>
            <div className="text-4xl font-black mb-1">Rp 0</div>
            <div className="text-white/40 text-sm mb-8">Selamanya</div>
            <ul className="space-y-3 text-sm text-white/70 mb-8">
              {['1 sekolah', 'Diagnosis visi', 'Perancang V+I+C', '3 analisis AI/bulan'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-teal-400">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/register" className="block text-center bg-white/10 hover:bg-white/15 py-3 rounded-xl font-semibold transition">
              Mulai Gratis
            </Link>
          </div>
          <div className="bg-teal-600 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">POPULER</div>
            <div className="text-sm font-semibold text-teal-200 mb-2">Pro</div>
            <div className="text-4xl font-black mb-1">Rp 299k</div>
            <div className="text-teal-200 text-sm mb-8">/bulan per sekolah</div>
            <ul className="space-y-3 text-sm text-white mb-8">
              {['Sekolah tidak terbatas', 'Semua fitur gratis', 'Analisis AI tidak terbatas', 'Vision Health Check guru & murid', 'Laporan PDF profesional', 'Panduan workshop lengkap'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-white">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/register?plan=pro" className="block text-center bg-white text-teal-700 hover:bg-teal-50 py-3 rounded-xl font-bold transition">
              Mulai Pro
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        © 2026 Sekolah Visioner · Dibuat dengan ❤️ untuk pendidikan Indonesia
      </footer>
    </main>
  )
}