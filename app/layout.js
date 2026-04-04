import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

export const metadata = {
  title: 'Sekolah Visioner — Platform Penyelarasan Budaya Sekolah',
  description: 'Jadikan visi sekolahmu hidup — bukan sekadar banner di dinding.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={geist.variable}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  )
}