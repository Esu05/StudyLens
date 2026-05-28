'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RightSidebar from '@/components/rightsidebar'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'

type SyllabusItem = {
  id: string
  subject: string
  chapter: string
  is_complete: boolean
}

type GroupedSyllabus = {
  [subject: string]: SyllabusItem[]
}

export default function SyllabusPage() {
  const supabase = createClient()
  const { colors } = useTheme()
  const { isGuest, guestData, updateGuestData } = useGuest()
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([])
  const [grouped, setGrouped] = useState<GroupedSyllabus>({})
  const [loading, setLoading] = useState(true)
  const [newSubject, setNewSubject] = useState('')
  const [newChapter, setNewChapter] = useState('')
  const [adding, setAdding] = useState(false)
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([])

  useEffect(() => { fetchSyllabus() }, [isGuest, guestData.syllabus])

  useEffect(() => {
    const g: GroupedSyllabus = {}
    syllabus.forEach(item => {
      if (!g[item.subject]) g[item.subject] = []
      g[item.subject].push(item)
    })
    setGrouped(g)
    setExpandedSubjects(Object.keys(g))
  }, [syllabus])

  const fetchSyllabus = async () => {
    if (isGuest) {
      setSyllabus(guestData.syllabus as SyllabusItem[])
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('syllabus')
      .select('*')
      .eq('user_id', user.id)
      .order('subject')
    if (data) setSyllabus(data)
    setLoading(false)
  }

  const addChapter = async () => {
    if (!newSubject.trim() || !newChapter.trim()) return
    setAdding(true)

    if (isGuest) {
      const newItem: SyllabusItem = {
        id: Date.now().toString(),
        subject: newSubject.trim(),
        chapter: newChapter.trim(),
        is_complete: false
      }
      const updated = [...guestData.syllabus, newItem]
      updateGuestData('syllabus', updated)
      setSyllabus(prev => [...prev, newItem])
      setNewChapter('')
      setAdding(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('syllabus')
      .insert({ user_id: user.id, subject: newSubject.trim(), chapter: newChapter.trim(), is_complete: false })
      .select().single()
    if (data) { setSyllabus(prev => [...prev, data]); setNewChapter('') }
    setAdding(false)
  }

  const toggleComplete = async (id: string, current: boolean) => {
    if (isGuest) {
      const updated = guestData.syllabus.map((s: any) =>
        s.id === id ? { ...s, is_complete: !current } : s
      )
      updateGuestData('syllabus', updated)
      setSyllabus(prev => prev.map(s => s.id === id ? { ...s, is_complete: !current } : s))
      return
    }
    await supabase.from('syllabus').update({ is_complete: !current }).eq('id', id)
    setSyllabus(prev => prev.map(s => s.id === id ? { ...s, is_complete: !current } : s))
  }

  const deleteChapter = async (id: string) => {
    if (isGuest) {
      const updated = guestData.syllabus.filter((s: any) => s.id !== id)
      updateGuestData('syllabus', updated)
      setSyllabus(prev => prev.filter(s => s.id !== id))
      return
    }
    await supabase.from('syllabus').delete().eq('id', id)
    setSyllabus(prev => prev.filter(s => s.id !== id))
  }

  const addChapterToSubject = async (subject: string, val: string) => {
    if (isGuest) {
      const newItem: SyllabusItem = {
        id: Date.now().toString(),
        subject,
        chapter: val,
        is_complete: false
      }
      const updated = [...guestData.syllabus, newItem]
      updateGuestData('syllabus', updated)
      setSyllabus(prev => [...prev, newItem])
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('syllabus')
      .insert({ user_id: user.id, subject, chapter: val, is_complete: false })
      .select().single()
    if (data) setSyllabus(prev => [...prev, data])
  }

  const toggleExpand = (subject: string) => {
    setExpandedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    )
  }

  const totalChapters = syllabus.length
  const completedChapters = syllabus.filter(s => s.is_complete).length
  const overallPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        <div>
          <h1 className="text-3xl font-serif text-[#1c1a18]">Syllabus Tracker</h1>
          <p className="text-sm text-[#8a857e] mt-1">Track your subjects and chapters</p>
        </div>

        {/* Overall progress */}
        <div className="rounded-2xl p-5" style={{ background: colors.card1 }}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540]">Overall progress</p>
              <p className="text-4xl font-serif text-[#1c1a18] mt-1">{overallPercent}%</p>
            </div>
            <p className="text-sm text-[#4a4540] font-medium">{completedChapters} / {totalChapters} chapters</p>
          </div>
          <div className="h-2 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#1c1a18] rounded-full transition-all duration-500" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>

        {/* Add chapter form */}
        <div className="rounded-2xl p-5 border" style={{ background: colors.cardBg, borderColor: colors.border }}>
          <p className="text-sm font-semibold text-[#1c1a18] mb-3">Add a chapter</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Subject (e.g. Mathematics)"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
              style={{ borderColor: colors.border, background: colors.bg }}
            />
            <input
              type="text"
              placeholder="Chapter (e.g. Trigonometry)"
              value={newChapter}
              onChange={e => setNewChapter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addChapter()}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
              style={{ borderColor: colors.border, background: colors.bg }}
            />
            <button
              onClick={addChapter}
              disabled={adding || !newSubject.trim() || !newChapter.trim()}
              className="px-5 py-2.5 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {adding ? '...' : '+ Add'}
            </button>
          </div>
        </div>

        {/* Subjects */}
        {loading ? (
          <p className="text-sm text-[#8a857e]">Loading syllabus...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="rounded-2xl p-10 border text-center" style={{ background: colors.cardBg, borderColor: colors.border }}>
            <p className="text-2xl mb-2">▦</p>
            <p className="text-sm font-medium text-[#1c1a18]">No subjects yet</p>
            <p className="text-xs text-[#8a857e] mt-1">Add your first subject and chapter above</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([subject, chapters]) => {
              const done = chapters.filter(c => c.is_complete).length
              const percent = Math.round((done / chapters.length) * 100)
              const isExpanded = expandedSubjects.includes(subject)

              return (
                <div key={subject} className="rounded-2xl border overflow-hidden" style={{ background: colors.cardBg, borderColor: colors.border }}>
                  <div
                    onClick={() => toggleExpand(subject)}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer transition-colors"
                    style={{ background: colors.cardBg }}
                    onMouseEnter={e => (e.currentTarget.style.background = colors.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = colors.cardBg)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#1c1a18]">{subject}</span>
                      <span className="text-xs text-[#8a857e]">{done}/{chapters.length} chapters</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: colors.bg }}>
                        <div className="h-full bg-[#1c1a18] rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-[#4a4540] w-8 text-right">{percent}%</span>
                      <span className="text-[#8a857e] text-sm">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: colors.border }}>
                      {chapters.map(chapter => (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between px-5 py-3 border-b last:border-0 transition-colors"
                          style={{ borderColor: colors.bg, background: colors.cardBg }}
                          onMouseEnter={e => (e.currentTarget.style.background = colors.bg)}
                          onMouseLeave={e => (e.currentTarget.style.background = colors.cardBg)}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleComplete(chapter.id, chapter.is_complete)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                                ${chapter.is_complete ? 'bg-[#1c1a18] border-[#1c1a18]' : 'hover:border-[#1c1a18]'}`}
                              style={!chapter.is_complete ? { borderColor: colors.border } : {}}
                            >
                              {chapter.is_complete && <span className="text-white text-[10px]">✓</span>}
                            </button>
                            <span className={`text-sm transition-all ${chapter.is_complete ? 'line-through text-[#8a857e]' : 'text-[#1c1a18]'}`}>
                              {chapter.chapter}
                            </span>
                          </div>
                          <button onClick={() => deleteChapter(chapter.id)} className="text-[#8a857e] hover:text-red-400 transition-colors text-xs px-2">
                            ✕
                          </button>
                        </div>
                      ))}

                      <div className="px-5 py-3 flex gap-2">
                        <input
                          type="text"
                          placeholder={`Add chapter to ${subject}...`}
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              const val = e.currentTarget.value.trim()
                              e.currentTarget.value = ''
                              await addChapterToSubject(subject, val)
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border text-xs text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                          style={{ borderColor: colors.border, background: colors.bg }}
                        />
                        <span className="text-xs text-[#8a857e] self-center">↵ Enter</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <RightSidebar />
    </div>
  )
}