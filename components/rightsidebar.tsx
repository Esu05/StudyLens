'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'next/navigation'

interface RightSidebarProps {
  timeline?: { time: string; label: string; desc: string; active?: boolean }[]
}

export default function RightSidebar({ timeline }: RightSidebarProps) {
  const supabase = createClient()
  const { colors } = useTheme()
  const [eventDates, setEventDates] = useState<string[]>([])
  const [todayEvents, setTodayEvents] = useState<any[]>([])
  const [tomorrowEvents, setTomorrowEvents] = useState<any[]>([])
  const router = useRouter()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  const todayDate = now.getDate()

  const today = now.toISOString().split('T')[0]
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0]

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true })
    if (data) {
      const mapped = data.map(n => ({
        id: n.id,
        title: n.message.split('||')[0] || n.message,
        description: n.message.split('||')[1] || '',
        date: n.scheduled_at?.split('T')[0] || today,
        time: n.scheduled_at?.split('T')[1]?.slice(0, 5) || '',
        color: n.message.split('||')[2] || colors.card1
      }))
      setEventDates(mapped.map(e => e.date))
      setTodayEvents(mapped.filter(e => e.date === today))
      setTomorrowEvents(mapped.filter(e => e.date === tomorrow))
    }
  }

  const buildTimeline = () => {
    if (timeline) return timeline
    if (todayEvents.length > 0) {
      return todayEvents.map(e => ({
        time: e.time || '--:--',
        label: e.title,
        desc: e.description || 'Scheduled event',
        active: false
      }))
    }
    return [
      { time: '09:00', label: 'Flashcards', desc: "Review today's cards" },
      { time: '11:00', label: 'Quiz', desc: 'Test your knowledge', active: true },
      { time: '15:00', label: 'AI Planner', desc: 'Start a new topic' },
      { time: '18:00', label: 'Revision', desc: 'Spaced repetition session' },
    ]
  }

  const finalTimeline = buildTimeline()

  return (
    <div className="w-64 shrink-0 flex flex-col gap-4">

      {/* Calendar */}
      <div
        className="rounded-2xl p-5 border"
        style={{ background: colors.cardBg, borderColor: colors.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[#1c1a18]">{monthName}</p>
          <div className="flex gap-1">
            <button className="text-[#8a857e] hover:text-[#1c1a18] px-1 text-sm transition-colors">‹</button>
            <button className="text-[#8a857e] hover:text-[#1c1a18] px-1 text-sm transition-colors">›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-[#8a857e] uppercase py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = day === todayDate
            const isTomorrow = day === todayDate + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasEvent = eventDates.includes(dateStr)

            let bg = 'transparent'
            let textColor = '#4a4540'
            let ring = ''

            if (isToday) { bg = '#1c1a18'; textColor = '#fff' }
            else if (hasEvent && isTomorrow) { bg = colors.card1; ring = 'ring-2 ring-[#1c1a18]' }
            else if (hasEvent) { bg = colors.card1 }

            return (
              <div
                key={day}
                className={`text-center text-xs py-1.5 rounded-full cursor-pointer transition-all font-medium ${ring}`}
                style={{ background: bg, color: textColor }}
                onMouseEnter={e => { if (!isToday && !hasEvent) e.currentTarget.style.background = colors.bg }}
                onMouseLeave={e => { if (!isToday && !hasEvent) e.currentTarget.style.background = 'transparent' }}
              >
                {day}
              </div>
            )
          })}
        </div>

        <button
            onClick={() => router.push('/schedule')}
            className="w-full mt-4 py-2 bg-[#1c1a18] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            + Add event
        </button>
      </div>

      {/* Tomorrow's events */}
      {tomorrowEvents.length > 0 && (
        <div
          className="rounded-2xl p-4 border"
          style={{ background: colors.cardBg, borderColor: colors.border }}
        >
          <p className="text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">Tomorrow</p>
          <div className="flex flex-col gap-2">
            {tomorrowEvents.map((e, i) => (
              <div
                key={i}
                className="rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ background: e.color }}
              >
                {e.time && <span className="text-[10px] font-semibold text-[#4a4540]">{e.time}</span>}
                <span className="text-xs font-medium text-[#1c1a18] truncate">{e.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div
        className="rounded-2xl p-5 border flex-1"
        style={{ background: colors.cardBg, borderColor: colors.border }}
      >
        <p className="text-sm font-semibold text-[#1c1a18] mb-4">
          {todayEvents.length > 0 ? "Today's events" : "Today's timeline"}
        </p>
        <div className="flex flex-col gap-3">
          {finalTimeline.map((item, i) => (
            <div key={i} className="flex gap-3">
              <p className="text-[11px] text-[#8a857e] font-medium min-w-9 pt-2">{item.time}</p>
              <div
                className="flex-1 rounded-xl p-3"
                style={{ background: item.active ? colors.card3 : colors.bg }}
              >
                <p className="text-xs font-semibold text-[#1c1a18]">{item.label}</p>
                <p className="text-[11px] text-[#8a857e] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
          {finalTimeline.length === 0 && (
            <p className="text-xs text-[#8a857e]">No events today</p>
          )}
        </div>
      </div>

    </div>
  )
}