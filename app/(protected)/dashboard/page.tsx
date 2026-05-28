'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import RightSidebar from '@/components/rightsidebar'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'

export default function DashboardPage() {
  const supabase = createClient()
  const { colors } = useTheme()
  const { isGuest, guestData } = useGuest()

  const [name, setName] = useState('')
  const [quizCount, setQuizCount] = useState(0)
  const [avgScore, setAvgScore] = useState(0)
  const [weakTopics, setWeakTopics] = useState(0)
  const [syllabusTotal, setSyllabusTotal] = useState(0)
  const [syllabusDone, setSyllabusDone] = useState(0)
  const [dueRevisions, setDueRevisions] = useState<any[]>([])
  const [recentTopics, setRecentTopics] = useState<any[]>([])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  useEffect(() => {
    if (isGuest) {
      loadGuestData()
    } else {
      fetchData()
    }
  }, [isGuest, guestData])

  const loadGuestData = () => {
    setName('Guest')

    // Quiz stats from guest data
    if (guestData.quizResults.length > 0) {
      setQuizCount(guestData.quizResults.length)
      const avg = guestData.quizResults.reduce((acc: number, q: any) => acc + (q.score / q.total) * 100, 0) / guestData.quizResults.length
      setAvgScore(Math.round(avg))
      setWeakTopics(guestData.quizResults.filter((q: any) => q.weak_flag).length)
    }

    // Syllabus from guest data
    setSyllabusTotal(guestData.syllabus.length)
    setSyllabusDone(guestData.syllabus.filter((s: any) => s.is_complete).length)

    // Due revisions from guest data
    const due = guestData.revisions.filter((r: any) => r.scheduled_date === today && !r.is_done)
    setDueRevisions(due.slice(0, 3))

    // Recent sessions from guest data
    setRecentTopics([...guestData.sessions].reverse().slice(0, 3))
  }

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'there'
    setName(fullName)

    const { data: quizData } = await supabase
      .from('quiz_results')
      .select('score, total, weak_flag')
      .eq('user_id', user.id)

    if (quizData && quizData.length > 0) {
      setQuizCount(quizData.length)
      const avg = quizData.reduce((acc, q) => acc + (q.score / q.total) * 100, 0) / quizData.length
      setAvgScore(Math.round(avg))
      setWeakTopics(quizData.filter(q => q.weak_flag).length)
    }

    const { data: syllabusData } = await supabase
      .from('syllabus')
      .select('is_complete')
      .eq('user_id', user.id)

    if (syllabusData) {
      setSyllabusTotal(syllabusData.length)
      setSyllabusDone(syllabusData.filter(s => s.is_complete).length)
    }

    const { data: revData } = await supabase
      .from('revision_schedule')
      .select('*, topics(name)')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .eq('is_done', false)
      .limit(3)

    if (revData) setDueRevisions(revData)

    const { data: topicsData } = await supabase
      .from('sessions')
      .select('*, topics(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    if (topicsData) setRecentTopics(topicsData)
  }

  const syllabusPercent = syllabusTotal > 0 ? Math.round((syllabusDone / syllabusTotal) * 100) : 0
  const firstName = name.split(' ')[0]

  return (
    <div className="flex gap-6 h-full">
      <div className="flex flex-col gap-6 flex-1 min-w-0">

        {/* Greeting */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#8a857e] font-semibold mb-2">
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-5xl font-serif text-[#1c1a18]">{greeting}, {firstName}.</h1>
            <p className="text-sm text-[#8a857e] mt-2">
              {dueRevisions.length > 0 ? `${dueRevisions.length} revisions due today` : 'No revisions due today'} · {weakTopics} weak topics
            </p>
          </div>
          <Link
            href="/planner"
            className="rounded-2xl bg-[#1c1a18] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            + New study session
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative overflow-hidden rounded-[28px] border border-black/5 p-6 transition-all duration-300 hover:-translate-y-1" style={{ background: colors.card1 }}>
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#5b5550]">SYLLABUS</p>
                <span className="rounded-full bg-white/60 px-3 py-1 text-[10px] font-semibold text-[#1c1a18]">progress</span>
              </div>
              <h2 className="mt-5 text-5xl font-bold text-[#1c1a18]">{syllabusPercent}%</h2>
              <p className="mt-1 text-sm text-[#5b5550]">{syllabusDone} of {syllabusTotal} chapters done</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-[#1c1a18]" style={{ width: `${syllabusPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-black/5 p-6 transition-all duration-300 hover:-translate-y-1" style={{ background: colors.card4 }}>
            <div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#5b5550]">QUIZ AVERAGE</p>
                <span className="rounded-full bg-white/60 px-3 py-1 text-[10px] font-semibold text-[#1c1a18]">this week</span>
              </div>
              <h2 className="mt-5 text-5xl font-bold text-[#1c1a18]">{avgScore}%</h2>
              <p className="mt-1 text-sm text-[#5b5550]">{quizCount} quizzes completed</p>
              <div className="mt-5 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i < Math.round(avgScore / 20) ? 'bg-[#1c1a18]' : 'bg-black/10'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-black/5 p-6 transition-all duration-300 hover:-translate-y-1" style={{ background: colors.card2 }}>
            <div className="absolute right-0 top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#5b5550]">WEAK TOPICS</p>
                <span className="rounded-full bg-white/60 px-3 py-1 text-[10px] font-semibold text-[#1c1a18]">needs focus</span>
              </div>
              <h2 className="mt-5 text-5xl font-bold text-[#1c1a18]">{weakTopics}</h2>
              <p className="mt-1 text-sm text-[#5b5550]">Topics needing revision</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-black/5 p-6 transition-all duration-300 hover:-translate-y-1" style={{ background: colors.card3 }}>
            <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#5b5550]">DUE TODAY</p>
                <span className="rounded-full bg-white/60 px-3 py-1 text-[10px] font-semibold text-[#1c1a18]">schedule</span>
              </div>
              <h2 className="mt-5 text-5xl font-bold text-[#1c1a18]">{dueRevisions.length}</h2>
              <p className="mt-1 text-sm text-[#5b5550]">Revision sessions due</p>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-3xl p-6 shadow-sm" style={{ background: colors.card5 }}>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a4540]">Due for revision</p>
              <Link href="/revisions" className="text-sm font-medium text-[#4a4540] hover:text-black">View all →</Link>
            </div>
            {dueRevisions.length === 0 ? (
              <p className="text-sm text-[#8a857e]">No revisions due today 🎉</p>
            ) : (
              <div className="flex flex-col gap-3">
                {dueRevisions.map((rev, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl bg-white/50 px-4 py-4 transition hover:bg-white/70">
                    <div>
                      <p className="text-sm font-semibold text-[#1c1a18]">{rev.topics?.name || 'Topic'}</p>
                      <p className="text-xs text-[#8a857e]">{rev.type} · due today</p>
                    </div>
                    <Link href="/revisions" className="text-sm font-semibold text-[#1c1a18]">Start →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl p-6 shadow-sm" style={{ background: colors.card6 }}>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a4540]">Recent sessions</p>
              <Link href="/planner" className="text-sm font-medium text-[#4a4540] hover:text-black">New session →</Link>
            </div>
            {recentTopics.length === 0 ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[#8a857e]">No sessions yet. Start studying!</p>
                <Link href="/planner" className="rounded-2xl bg-[#1c1a18] px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90">
                  Start AI planner →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentTopics.map((session, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl bg-white/50 px-4 py-4 transition hover:bg-white/70">
                    <div>
                      <p className="text-sm font-semibold text-[#1c1a18]">{session.topics?.name || 'Topic'}</p>
                      <p className="text-xs text-[#8a857e]">
                        {session.created_at ? new Date(session.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Just now'}
                      </p>
                    </div>
                    <span className="text-lg">↗</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RightSidebar />
    </div>
  )
}