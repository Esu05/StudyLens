'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RightSidebar from '@/components/rightsidebar'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'

type Revision = {
  id: string
  topic_id: string
  scheduled_date: string
  interval_days: number
  type: 'manual' | 'ai'
  is_done: boolean
  topics?: { name: string }
}

type Tab = 'today' | 'upcoming' | 'completed' | 'manual'

export default function RevisionsPage() {
  const supabase = createClient()
  const { colors } = useTheme()
  const { isGuest, guestData, updateGuestData } = useGuest()
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [tab, setTab] = useState<Tab>('today')
  const [loading, setLoading] = useState(true)
  const [manualTopic, setManualTopic] = useState('')
  const [manualDate, setManualDate] = useState('')
  const [adding, setAdding] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchRevisions()
    fetchTopics()
  }, [isGuest, guestData.revisions, guestData.topics])

  const fetchRevisions = async () => {
    if (isGuest) {
      const sorted = [...guestData.revisions].sort((a: any, b: any) =>
        a.scheduled_date > b.scheduled_date ? 1 : -1
      )
      setRevisions(sorted as Revision[])
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('revision_schedule')
      .select('*, topics(name)')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true })
    if (data) setRevisions(data)
    setLoading(false)
  }

  const fetchTopics = async () => {
    if (isGuest) {
      setTopics(guestData.topics.map((t: any) => ({ id: t.id, name: t.name })))
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('topics').select('id, name').eq('user_id', user.id)
    if (data) setTopics(data)
  }

  const markDone = async (id: string) => {
    if (isGuest) {
      const updated = guestData.revisions.map((r: any) =>
        r.id === id ? { ...r, is_done: true } : r
      )
      updateGuestData('revisions', updated)
      setRevisions(prev => prev.map(r => r.id === id ? { ...r, is_done: true } : r))
      return
    }
    await supabase.from('revision_schedule').update({ is_done: true, last_reviewed: today }).eq('id', id)
    setRevisions(prev => prev.map(r => r.id === id ? { ...r, is_done: true } : r))
  }

  const addManualRevision = async () => {
    if (!manualTopic || !manualDate) return
    setAdding(true)

    if (isGuest) {
      const topic = guestData.topics.find((t: any) => t.id === manualTopic)
      const newRevision: Revision = {
        id: Date.now().toString(),
        topic_id: manualTopic,
        topics: { name: topic?.name || 'Topic' },
        scheduled_date: manualDate,
        interval_days: 0,
        type: 'manual',
        is_done: false
      }
      const updated = [...guestData.revisions, newRevision]
      updateGuestData('revisions', updated)
      setRevisions(prev => [...prev, newRevision])
      setManualTopic('')
      setManualDate('')
      setAdding(false)
      setTab('upcoming')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('revision_schedule')
      .insert({ user_id: user.id, topic_id: manualTopic, scheduled_date: manualDate, type: 'manual', is_done: false })
      .select('*, topics(name)').single()
    if (data) setRevisions(prev => [...prev, data])
    setManualTopic('')
    setManualDate('')
    setAdding(false)
    setTab('upcoming')
  }

  const todayRevisions = revisions.filter(r => r.scheduled_date === today && !r.is_done)
  const upcomingRevisions = revisions.filter(r => r.scheduled_date > today && !r.is_done)
  const completedRevisions = revisions.filter(r => r.is_done)

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'today', label: 'Due today', count: todayRevisions.length },
    { key: 'upcoming', label: 'Upcoming', count: upcomingRevisions.length },
    { key: 'completed', label: 'Completed', count: completedRevisions.length },
    { key: 'manual', label: '+ Manual' },
  ]

  const RevisionCard = ({ revision }: { revision: Revision }) => (
    <div className="rounded-2xl border p-5 flex items-center justify-between" style={{ background: colors.cardBg, borderColor: colors.border }}>
      <div>
        <p className="text-sm font-semibold text-[#1c1a18]">{revision.topics?.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[#1c1a18]" style={{ background: revision.type === 'ai' ? colors.card4 : colors.card3 }}>
            {revision.type === 'ai' ? '✦ AI' : '◷ Manual'}
          </span>
          <span className="text-xs text-[#8a857e]">
            {new Date(revision.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {revision.interval_days > 0 && (
            <span className="text-xs text-[#8a857e]">· every {revision.interval_days} days</span>
          )}
        </div>
      </div>
      {!revision.is_done ? (
        <button onClick={() => markDone(revision.id)} className="px-4 py-2 bg-[#1c1a18] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity">
          Mark done ✓
        </button>
      ) : (
        <span className="text-xs font-semibold bg-[#1c1a18] px-3 py-1.5 rounded-xl" style={{ color: colors.card2 }}>Done ✓</span>
      )}
    </div>
  )

  const EmptyCard = ({ message }: { message: string }) => (
    <div className="rounded-2xl p-10 border text-center" style={{ background: colors.cardBg, borderColor: colors.border }}>
      <p className="text-sm text-[#8a857e]">{message}</p>
    </div>
  )

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        <div>
          <h1 className="text-3xl font-serif text-[#1c1a18]">Revisions</h1>
          <p className="text-sm text-[#8a857e] mt-1">Stay on top of your spaced repetition schedule</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4" style={{ background: colors.card1 }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540]">Due today</p>
            <p className="text-3xl font-serif text-[#1c1a18] mt-1">{todayRevisions.length}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.card3 }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540]">Upcoming</p>
            <p className="text-3xl font-serif text-[#1c1a18] mt-1">{upcomingRevisions.length}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.card2 }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540]">Completed</p>
            <p className="text-3xl font-serif text-[#1c1a18] mt-1">{completedRevisions.length}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border"
              style={{
                background: tab === t.key ? '#1c1a18' : colors.cardBg,
                color: tab === t.key ? '#fff' : '#4a4540',
                borderColor: tab === t.key ? '#1c1a18' : colors.border
              }}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: tab === t.key ? 'rgba(255,255,255,0.2)' : colors.bg }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#8a857e]">Loading revisions...</p>
        ) : (
          <>
            {tab === 'today' && (
              <div className="flex flex-col gap-3">
                {todayRevisions.length === 0 ? (
                  <div className="rounded-2xl p-10 border text-center" style={{ background: colors.cardBg, borderColor: colors.border }}>
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-sm font-medium text-[#1c1a18]">No revisions due today!</p>
                    <p className="text-xs text-[#8a857e] mt-1">Enjoy your day or get ahead on upcoming ones</p>
                  </div>
                ) : todayRevisions.map(r => <RevisionCard key={r.id} revision={r} />)}
              </div>
            )}

            {tab === 'upcoming' && (
              <div className="flex flex-col gap-3">
                {upcomingRevisions.length === 0
                  ? <EmptyCard message="No upcoming revisions" />
                  : upcomingRevisions.map(r => <RevisionCard key={r.id} revision={r} />)}
              </div>
            )}

            {tab === 'completed' && (
              <div className="flex flex-col gap-3">
                {completedRevisions.length === 0
                  ? <EmptyCard message="No completed revisions yet" />
                  : completedRevisions.map(r => <RevisionCard key={r.id} revision={r} />)}
              </div>
            )}

            {tab === 'manual' && (
              <div className="rounded-2xl p-6 border" style={{ background: colors.cardBg, borderColor: colors.border }}>
                <p className="text-sm font-semibold text-[#1c1a18] mb-1">Schedule a manual revision</p>
                <p className="text-xs text-[#8a857e] mb-4">Pick a topic and set your own revision date</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">Topic</label>
                    <select
                      value={manualTopic}
                      onChange={e => setManualTopic(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                      style={{ borderColor: colors.border, background: colors.bg }}
                    >
                      <option value="">Select a topic</option>
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">Revision date</label>
                    <input
                      type="date"
                      value={manualDate}
                      min={today}
                      onChange={e => setManualDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                      style={{ borderColor: colors.border, background: colors.bg }}
                    />
                  </div>
                  <button
                    onClick={addManualRevision}
                    disabled={adding || !manualTopic || !manualDate}
                    className="w-full py-3 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {adding ? 'Scheduling...' : 'Schedule revision →'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <RightSidebar />
    </div>
  )
}