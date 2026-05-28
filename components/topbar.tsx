'use client'

import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { faBell, faMoon, faSun } from '@fortawesome/free-regular-svg-icons'
import { faSearch, faUser, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'

interface TopbarProps {
  name?: string
}

export default function Topbar({ name }: TopbarProps) {
  const { colors } = useTheme()
  const { isGuest, setGuestMode } = useGuest()
  const supabase = createClient()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [userName, setUserName] = useState(name || '')
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUser()
    fetchNotifications()

    // Close dropdowns on outside click
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchUser = async () => {
    if (isGuest) { setUserName('Guest'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
    }
  }

  const fetchNotifications = async () => {
    if (isGuest) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('revision_schedule')
      .select('*, topics(name)')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .eq('is_done', false)
      .limit(5)
    if (data) {
      const notifs = data.map(r => ({
        id: r.id,
        message: `Revision due: ${r.topics?.name}`,
        link: '/revisions'
      }))
      setNotifications(notifs)
      setUnreadCount(notifs.length)
    }
  }

  const handleLogout = async () => {
    if (isGuest) {
      setGuestMode(false)
      router.push('/login')
      return
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      // Navigate based on search term
      const q = search.toLowerCase()
      if (q.includes('flash')) router.push('/flashcards')
      else if (q.includes('quiz')) router.push('/quiz')
      else if (q.includes('syllabus') || q.includes('chapter')) router.push('/syllabus')
      else if (q.includes('revision') || q.includes('revise')) router.push('/revisions')
      else if (q.includes('schedule') || q.includes('event')) router.push('/schedule')
      else if (q.includes('setting')) router.push('/settings')
      else router.push(`/planner?topic=${encodeURIComponent(search)}`)
      setSearch('')
    }
  }

  return (
    <div
      className="flex items-center gap-4 border-b border-black/5 px-7 py-4 relative z-10"
      style={{ background: colors.cardBg, borderColor: colors.border }}
    >
      {/* Search */}
      <div className="relative flex-1">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8a857e]"
        />
        <input
          type="text"
          placeholder="Search pages or press Enter to plan a topic..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full rounded-full border py-2.5 pl-11 pr-5 text-sm text-[#1c1a18] outline-none transition-all placeholder:text-[#8a857e] focus:border-[#1c1a18]"
          style={{ borderColor: colors.border, background: colors.bg }}
        />
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1a18] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
        title="Toggle dark mode (coming soon)"
      >
        <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="text-sm" />
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1a18] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 relative"
        >
          <FontAwesomeIcon icon={faBell} className="text-sm" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div
            className="absolute right-0 top-12 w-72 rounded-2xl border shadow-lg z-50 overflow-hidden"
            style={{ background: colors.cardBg, borderColor: colors.border }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540]">Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-[#8a857e]">No notifications today 🎉</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n, i) => (
                  <Link
                    key={i}
                    href={n.link}
                    onClick={() => setShowNotifs(false)}
                    className="px-4 py-3 text-sm text-[#1c1a18] hover:opacity-80 transition-opacity border-b last:border-0 flex items-center gap-2"
                    style={{ borderColor: colors.border, background: colors.bg }}
                  >
                    <span className="text-base">🔔</span>
                    {n.message}
                  </Link>
                ))}
                <Link
                  href="/revisions"
                  onClick={() => setShowNotifs(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-center text-[#1c1a18] hover:opacity-70"
                >
                  View all revisions →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar + profile dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1a18] text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
        >
          {userName ? userName[0].toUpperCase() : 'U'}
        </button>

        {showProfile && (
          <div
            className="absolute right-0 top-12 w-56 rounded-2xl border shadow-lg z-50 overflow-hidden"
            style={{ background: colors.cardBg, borderColor: colors.border }}
          >
            {/* User info */}
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
              <p className="text-sm font-semibold text-[#1c1a18]">{userName}</p>
              <p className="text-xs text-[#8a857e]">{isGuest ? 'Guest mode' : 'Logged in'}</p>
            </div>

            {/* Menu items */}
            <div className="flex flex-col py-1">
              <Link
                href="/settings"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1c1a18] hover:opacity-70 transition-opacity"
                style={{ background: colors.cardBg }}
              >
                <FontAwesomeIcon icon={faCog} className="text-xs text-[#8a857e]" />
                Settings
              </Link>

              {isGuest && (
                <Link
                  href="/signup"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#1c1a18] hover:opacity-70 transition-opacity"
                  style={{ background: colors.card3 }}
                >
                  <FontAwesomeIcon icon={faUser} className="text-xs" />
                  Sign up to save →
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:opacity-70 transition-opacity w-full text-left border-t"
                style={{ borderColor: colors.border, background: colors.cardBg }}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="text-xs" />
                {isGuest ? 'Exit guest mode' : 'Log out'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}