'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
  { label: 'AI Planner', href: '/planner', icon: '✦' },
  { label: 'Flashcards', href: '/flashcards', icon: '◫' },
  { label: 'Quiz', href: '/quiz', icon: '◎' },
]

const planItems = [
  { label: 'Syllabus', href: '/syllabus', icon: '▦' },
  { label: 'Schedule', href: '/schedule', icon: '◷' },
  { label: 'Revisions', href: '/revisions', icon: '↻' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-55 min-h-screen bg-[#1c1a18] flex flex-col px-4 py-7 gap-1 shrink-0">
      
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 pb-6">
        <div className="w-7 h-7 rounded-full bg-[#FFCCE1] flex items-center justify-center text-sm">✦</div>
        <span className="text-white text-lg font-semibold">StudyLens</span>
      </div>

      {/* Study nav */}
      <p className="text-[10px] uppercase tracking-widest text-[#555] px-2 pt-2 pb-1 font-medium">Study</p>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all
            ${pathname === item.href
              ? 'bg-[#FFCCE1] text-[#1c1a18] font-medium'
              : 'text-[#aaa] hover:bg-[#2a2825] hover:text-white'
            }`}
        >
          <span className="w-4 text-center">{item.icon}</span>
          {item.label}
        </Link>
      ))}

      {/* Plan nav */}
      <p className="text-[10px] uppercase tracking-widest text-[#555] px-2 pt-4 pb-1 font-medium">Plan</p>
      {planItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all
            ${pathname === item.href
              ? 'bg-[#FFCCE1] text-[#1c1a18] font-medium'
              : 'text-[#aaa] hover:bg-[#2a2825] hover:text-white'
            }`}
        >
          <span className="w-4 text-center">{item.icon}</span>
          {item.label}
        </Link>
      ))}

      {/* Bottom */}
      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all
            ${pathname === '/settings'
              ? 'bg-[#FFCCE1] text-[#1c1a18] font-medium'
              : 'text-[#aaa] hover:bg-[#2a2825] hover:text-white'
            }`}
        >
          <span className="w-4 text-center">◈</span>
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] text-[#666] hover:bg-[#2a2825] hover:text-white transition-all w-full text-left"
        >
          <span className="w-4 text-center">→</span>
          Log out
        </button>
      </div>
    </div>
  )
}