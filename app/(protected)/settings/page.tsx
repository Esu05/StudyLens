'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import RightSidebar from '@/components/rightsidebar'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'
import type { ThemeKey } from '@/context/ThemeContext'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { isGuest, clearGuestData } = useGuest()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [notifications, setNotifications] = useState({
    revisions: false,
    quizReminders: false,
    dailySummary: false,
  })
  const [notifPermission, setNotifPermission] = useState<string>('default')

  useEffect(() => {
    if (isGuest) {
      setName('Guest User')
      setEmail('guest@studylens.app')
      setLoading(false)
    } else {
      fetchUser()
    }
    const savedNotifs = localStorage.getItem('studylens_notifications')
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs))
    if ('Notification' in window) setNotifPermission(Notification.permission)
  }, [isGuest])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setName(user.user_metadata?.full_name || '')
    setEmail(user.email || '')
    setLoading(false)
  }

  const saveProfile = async () => {
    if (isGuest) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name }
    })
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const toggleNotification = async (key: string, value: boolean) => {
    if (value && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotifPermission(permission)
      if (permission !== 'granted') {
        alert('Please allow notifications in your browser settings to enable this.')
        return
      }
    }
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
    localStorage.setItem('studylens_notifications', JSON.stringify(updated))
    if (value && notifPermission === 'granted') {
      new Notification('StudyLens', {
        body: `${key === 'revisions' ? 'Revision reminders' : key === 'quizReminders' ? 'Quiz reminders' : 'Daily summary'} enabled!`,
      })
    }
  }

  const exportData = async () => {
    setExporting(true)

    if (isGuest) {
      // Export guest data from localStorage
      const guestData = localStorage.getItem('studylens_guest_data')
      const data = guestData ? JSON.parse(guestData) : {}
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), mode: 'guest', ...data }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `studylens_guest_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExporting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [sessions, flashcards, quizResults, syllabus, revisions] = await Promise.all([
      supabase.from('sessions').select('*, topics(name)').eq('user_id', user.id),
      supabase.from('flashcards').select('*, topics(name)').eq('user_id', user.id),
      supabase.from('quiz_results').select('*, topics(name)').eq('user_id', user.id),
      supabase.from('syllabus').select('*').eq('user_id', user.id),
      supabase.from('revision_schedule').select('*, topics(name)').eq('user_id', user.id),
    ])
    const exportData = {
      exported_at: new Date().toISOString(),
      user: { name, email },
      sessions: sessions.data || [],
      flashcards: flashcards.data || [],
      quiz_results: quizResults.data || [],
      syllabus: syllabus.data || [],
      revision_schedule: revisions.data || [],
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `studylens_export_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const deleteAccount = async () => {
    setDeleting(true)

    if (isGuest) {
      clearGuestData()
      router.push('/login')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await Promise.all([
      supabase.from('sessions').delete().eq('user_id', user.id),
      supabase.from('flashcards').delete().eq('user_id', user.id),
      supabase.from('quiz_results').delete().eq('user_id', user.id),
      supabase.from('quiz_questions').delete().eq('user_id', user.id),
      supabase.from('syllabus').delete().eq('user_id', user.id),
      supabase.from('revision_schedule').delete().eq('user_id', user.id),
      supabase.from('notifications').delete().eq('user_id', user.id),
      supabase.from('topics').delete().eq('user_id', user.id),
    ])
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/login')
  }

  const colorThemes = [
    { key: 'default', label: 'Pastel', colors: ['#FFCCE1', '#CDE5D9', '#F2EBCC', '#BCD8EC'] },
    { key: 'warm', label: 'Warm', colors: ['#FFD4A3', '#FFEAA3', '#FFB8B8', '#FFD4C2'] },
    { key: 'cool', label: 'Cool', colors: ['#B8D4FF', '#B8FFE8', '#D4B8FF', '#B8F0FF'] },
    { key: 'mono', label: 'Mono', colors: ['#E8E8E8', '#D0D0D0', '#B8B8B8', '#F5F5F5'] },
  ]

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        <div>
          <h1 className="text-3xl font-serif text-[#1c1a18]">Settings</h1>
          <p className="text-sm text-[#8a857e] mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d8]">
          <p className="text-sm font-semibold text-[#1c1a18] mb-4">Profile</p>
          {loading ? (
            <p className="text-sm text-[#8a857e]">Loading...</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1c1a18] flex items-center justify-center text-white text-xl font-semibold">
                  {name ? name[0].toUpperCase() : 'G'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1c1a18]">{name}</p>
                  <p className="text-xs text-[#8a857e]">{isGuest ? 'Guest mode — data not saved' : email}</p>
                </div>
              </div>

              {/* Show sign up prompt for guest */}
              {isGuest ? (
                <div className="bg-[#F2EBCC] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#1c1a18]">You're in guest mode</p>
                  <p className="text-xs text-[#4a4540] mt-1">Sign up to save your progress, flashcards and revision history permanently.</p>
                  <button
                    onClick={() => router.push('/signup')}
                    className="mt-3 w-full py-2.5 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Sign up to save →
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">Full name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#e8e2d8] text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-[#e8e2d8] text-sm text-[#8a857e] bg-[#f5f0e8] cursor-not-allowed"
                    />
                    <p className="text-xs text-[#8a857e] mt-1">Email cannot be changed</p>
                  </div>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-full py-3 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saved ? '✓ Profile saved!' : saving ? 'Saving...' : 'Save profile'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d8]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-[#1c1a18]">Notifications</p>
            {notifPermission === 'denied' && <span className="text-xs text-red-500 font-medium">Blocked in browser</span>}
            {notifPermission === 'granted' && <span className="text-xs text-green-600 font-medium">✓ Allowed</span>}
          </div>
          <p className="text-xs text-[#8a857e] mb-4">Browser notifications for study reminders</p>
          <div className="flex flex-col gap-4">
            {[
              { key: 'revisions', label: 'Revision reminders', desc: 'Get notified when a revision is due today' },
              { key: 'quizReminders', label: 'Quiz reminders', desc: 'Daily reminder to take a quiz' },
              { key: 'dailySummary', label: 'Daily summary', desc: "Morning summary of today's study plan" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1c1a18]">{item.label}</p>
                  <p className="text-xs text-[#8a857e]">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key, !notifications[item.key as keyof typeof notifications])}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${notifications[item.key as keyof typeof notifications] ? 'bg-[#1c1a18]' : 'bg-[#e8e2d8]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${notifications[item.key as keyof typeof notifications] ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d8]">
          <p className="text-sm font-semibold text-[#1c1a18] mb-1">Dashboard theme</p>
          <p className="text-xs text-[#8a857e] mb-4">Saved automatically — reloads on next visit</p>
          <div className="grid grid-cols-2 gap-3">
            {colorThemes.map(t => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key as ThemeKey)}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${theme === t.key ? 'border-[#1c1a18]' : 'border-[#e8e2d8] hover:border-[#4a4540]'}`}
              >
                <div className="flex gap-1.5 mb-2">
                  {t.colors.map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-xs font-semibold text-[#1c1a18]">{t.label}</p>
                {theme === t.key && <p className="text-[10px] text-[#8a857e] mt-0.5">Currently active</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d8]">
          <p className="text-sm font-semibold text-[#1c1a18] mb-4">Account</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-3 border-b border-[#f5f0e8]">
              <div>
                <p className="text-sm font-medium text-[#1c1a18]">Export my data</p>
                <p className="text-xs text-[#8a857e]">{isGuest ? 'Download your guest session data' : 'Download all your study data as JSON'}</p>
              </div>
              <button
                onClick={exportData}
                disabled={exporting}
                className="px-4 py-2 border border-[#e8e2d8] rounded-xl text-xs font-semibold text-[#1c1a18] hover:border-[#1c1a18] transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>

            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-red-500">{isGuest ? 'Clear guest data' : 'Delete account'}</p>
                  <p className="text-xs text-[#8a857e]">{isGuest ? 'Clear all guest session data and go back to login' : 'Permanently delete all your data'}</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-red-200 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  {isGuest ? 'Clear' : 'Delete'}
                </button>
              </div>
            ) : (
              <div className="py-3 flex flex-col gap-3">
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-600">Are you sure?</p>
                  <p className="text-xs text-red-400 mt-1">
                    {isGuest
                      ? 'This will clear all your guest data and return you to the login page.'
                      : 'This will permanently delete all your topics, flashcards, quiz results, and progress. This cannot be undone.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Clearing...' : isGuest ? 'Yes, clear data' : 'Yes, delete everything'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 border border-[#e8e2d8] text-[#1c1a18] rounded-xl text-xs font-semibold hover:border-[#1c1a18] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      <RightSidebar />
    </div>
  )
}