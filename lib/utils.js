import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getScoreLabel(score, max = 5) {
  const pct = (score / max) * 100
  if (pct >= 80) return { label: 'Luar Biasa', color: 'text-emerald-600' }
  if (pct >= 60) return { label: 'Kuat', color: 'text-blue-600' }
  if (pct >= 40) return { label: 'Berkembang', color: 'text-yellow-600' }
  if (pct >= 20) return { label: 'Perlu Perhatian', color: 'text-orange-600' }
  return { label: 'Kritis', color: 'text-red-600' }
}