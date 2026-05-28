'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RightSidebar from '@/components/rightsidebar'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'

type ScheduleEvent = {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  color: string
}

export default function SchedulePage() {
  const supabase = createClient()
  const { colors } = useTheme()
  const { isGuest, guestData, updateGuestData } = useGuest()
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(selectedDate)
  const [time, setTime] = useState('')
  const [color, setColor] = useState('#FFCCE1')

  const today = new Date().toISOString().split('T')[0]
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())

  useEffect(() => { fetchEvents() }, [isGuest, guestData.events])

  const fetchEvents = async () => {
    if (isGuest) {
      setEvents(guestData.events as ScheduleEvent[])
      setLoading(false)
      return
    }
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
      setEvents(mapped)
    }
    setLoading(false)
  }

  const addEvent = async () => {
    if (!title.trim() || !date) return
    setAdding(true)

    if (isGuest) {
      const newEvent: ScheduleEvent = {
        id: Date.now().toString(),
        title,
        description,
        date,
        time,
        color
      }
      const updated = [...guestData.events, newEvent]
      updateGuestData('events', updated)
      setEvents(prev => [...prev, newEvent])
      setTitle('')
      setDescription('')
      setTime('')
      setColor(colors.card1)
      setShowForm(false)
      setAdding(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const scheduledAt = time ? `${date}T${time}:00` : `${date}T00:00:00`
    const message = `${title}||${description}||${color}`
    const { data } = await supabase
      .from('notifications')
      .insert({ user_id: user.id, message, scheduled_at: scheduledAt, is_read: false })
      .select().single()
    if (data) setEvents(prev => [...prev, { id: data.id, title, description, date, time, color }])
    setTitle('')
    setDescription('')
    setTime('')
    setColor(colors.card1)
    setShowForm(false)
    setAdding(false)
  }

  const deleteEvent = async (id: string) => {
    if (isGuest) {
      const updated = guestData.events.filter((e: any) => e.id !== id)
      updateGuestData('events', updated)
      setEvents(prev => prev.filter(e => e.id !== id))
      return
    }
    await supabase.from('notifications').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const eventDates = events.map(e => e.date)
  const selectedEvents = events.filter(e => e.date === selectedDate)

  const eventColors = [
    colors.card1, colors.card2, colors.card3,
    colors.card4, colors.card5, colors.card6
  ]

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[#1c1a18]">Schedule</h1>
            <p className="text-sm text-[#8a857e] mt-1">Plan and track your study sessions</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setDate(selectedDate) }}
            className="px-5 py-2.5 bg-[#1c1a18] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Add event
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl p-6 border" style={{ background: colors.cardBg, borderColor: colors.border }}>
            <p className="text-sm font-semibold text-[#1c1a18] mb-4">New event</p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Event title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                style={{ borderColor: colors.border, background: colors.bg }}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                style={{ borderColor: colors.border, background: colors.bg }}
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={e => setDate(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                  style={{ borderColor: colors.border, background: colors.bg }}
                />
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                  style={{ borderColor: colors.border, background: colors.bg }}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">Color</p>
                <div className="flex gap-2">
                  {eventColors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-[#1c1a18]' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addEvent}
                  disabled={adding || !title.trim() || !date}
                  className="flex-1 py-3 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add event'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border text-sm font-semibold text-[#1c1a18] hover:border-[#1c1a18] transition-colors"
                  style={{ background: colors.cardBg, borderColor: colors.border }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl p-5 border" style={{ background: colors.cardBg, borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#1c1a18]">{monthName}</p>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="w-7 h-7 rounded-lg text-[#4a4540] transition-colors text-sm" style={{ background: colors.bg }}>‹</button>
              <button onClick={nextMonth} className="w-7 h-7 rounded-lg text-[#4a4540] transition-colors text-sm" style={{ background: colors.bg }}>›</button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-[#8a857e] uppercase py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedFirst }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              const hasEvent = eventDates.includes(dateStr)
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className="relative text-xs py-3.5 rounded-xl transition-all font-medium"
                  style={{
                    background: isSelected ? '#1c1a18' : isToday ? colors.card1 : hasEvent ? colors.card3 : 'transparent',
                    color: isSelected ? '#fff' : '#4a4540',
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a857e]">
            {selectedDate === today ? 'Today' : new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' '}· {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
          </p>

          {selectedEvents.length === 0 ? (
            <div className="rounded-2xl p-8 border text-center" style={{ background: colors.cardBg, borderColor: colors.border }}>
              <p className="text-sm text-[#8a857e]">No events on this day</p>
              <button
                onClick={() => { setShowForm(true); setDate(selectedDate) }}
                className="mt-3 text-xs font-semibold text-[#1c1a18] underline"
              >
                Add one →
              </button>
            </div>
          ) : (
            selectedEvents.map(event => (
              <div
                key={event.id}
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: event.color }}
              >
                <div>
                  <p className="text-sm font-semibold text-[#1c1a18]">{event.title}</p>
                  {event.description && <p className="text-xs text-[#4a4540] mt-0.5">{event.description}</p>}
                  {event.time && <p className="text-xs text-[#4a4540] mt-1">🕐 {event.time}</p>}
                </div>
                <button onClick={() => deleteEvent(event.id)} className="text-[#8a857e] hover:text-red-400 transition-colors text-sm px-2">
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <RightSidebar />
    </div>
  )
}