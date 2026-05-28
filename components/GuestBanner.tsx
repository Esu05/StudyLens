'use client'

import { useGuest } from '@/context/GuestContext'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'

export default function GuestBanner() {
  const { isGuest } = useGuest()
  const { colors } = useTheme()

  if (!isGuest) return null

  return (
    <div
      className="flex items-center justify-between px-7 py-2.5 border-b text-sm"
      style={{ background: colors.card3, borderColor: colors.border }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[#1c1a18]">👋 You're in guest mode</span>
        <span className="text-xs text-[#4a4540]">— your data won't be saved after you close the browser</span>
      </div>
      <Link
        href="/signup"
        className="px-4 py-1.5 bg-[#1c1a18] text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
      >
        Sign up to save →
      </Link>
    </div>
  )
}