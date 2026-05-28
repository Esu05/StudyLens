'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RightSidebar from '@/components/rightsidebar'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'

type Flashcard = {
  id: string
  topic_id: string
  front: string
  back: string
  status: 'new' | 'learning' | 'review' | 'mastered'
  topics?: { name: string }
}

export default function FlashcardsPage() {
  const supabase = createClient()
  const { colors } = useTheme()
  const { isGuest, guestData, updateGuestData } = useGuest()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [filtered, setFiltered] = useState<Flashcard[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [flipped, setFlipped] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchFlashcards() }, [isGuest, guestData.flashcards])

  useEffect(() => {
    let result = flashcards
    if (selectedTopic !== 'All') result = result.filter(f => f.topics?.name === selectedTopic)
    if (selectedStatus !== 'All') result = result.filter(f => f.status === selectedStatus)
    setFiltered(result)
  }, [selectedTopic, selectedStatus, flashcards])

  const fetchFlashcards = async () => {
    if (isGuest) {
      const data = guestData.flashcards as Flashcard[]
      setFlashcards(data)
      setFiltered(data)
      const uniqueTopics = [...new Set(data.map(f => f.topics?.name).filter(Boolean))] as string[]
      setTopics(uniqueTopics)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('flashcards')
      .select('*, topics(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) {
      setFlashcards(data)
      setFiltered(data)
      const uniqueTopics = [...new Set(data.map((f: Flashcard) => f.topics?.name).filter(Boolean))] as string[]
      setTopics(uniqueTopics)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: Flashcard['status']) => {
    if (isGuest) {
      const updated = guestData.flashcards.map((f: any) =>
        f.id === id ? { ...f, status } : f
      )
      updateGuestData('flashcards', updated)
      setFlashcards(prev => prev.map(f => f.id === id ? { ...f, status } : f))
      return
    }
    await supabase.from('flashcards').update({ status }).eq('id', id)
    setFlashcards(prev => prev.map(f => f.id === id ? { ...f, status } : f))
  }

  const statusColors: Record<string, { background: string }> = {
    new:      { background: colors.card4 },
    learning: { background: colors.card3 },
    review:   { background: colors.card1 },
    mastered: { background: colors.card2 },
  }

  const stats = [
    { label: 'Total',    value: flashcards.length,                                       colorKey: colors.card5 },
    { label: 'Learning', value: flashcards.filter(f => f.status === 'learning').length,  colorKey: colors.card3 },
    { label: 'Review',   value: flashcards.filter(f => f.status === 'review').length,    colorKey: colors.card1 },
    { label: 'Mastered', value: flashcards.filter(f => f.status === 'mastered').length,  colorKey: colors.card2 },
  ]

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        <div>
          <h1 className="text-3xl font-serif text-[#1c1a18]">Flashcards</h1>
          <p className="text-sm text-[#8a857e] mt-1">Review and track your flashcards</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: stat.colorKey }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540]">{stat.label}</p>
              <p className="text-3xl font-serif text-[#1c1a18] mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-[#8a857e] uppercase tracking-wider">Topic:</span>
            {['All', ...topics].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${selectedTopic === t ? 'bg-[#1c1a18] text-white' : 'border text-[#4a4540] hover:border-[#1c1a18]'}`}
                style={selectedTopic !== t ? { background: colors.cardBg, borderColor: colors.border } : {}}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-[#8a857e] uppercase tracking-wider">Status:</span>
            {['All', 'new', 'learning', 'review', 'mastered'].map(s => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize
                  ${selectedStatus === s ? 'bg-[#1c1a18] text-white' : 'border text-[#4a4540] hover:border-[#1c1a18]'}`}
                style={selectedStatus !== s ? { background: colors.cardBg, borderColor: colors.border } : {}}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        {loading ? (
          <p className="text-sm text-[#8a857e]">Loading flashcards...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-10 border text-center" style={{ background: colors.cardBg, borderColor: colors.border }}>
            <p className="text-2xl mb-2">◫</p>
            <p className="text-sm font-medium text-[#1c1a18]">No flashcards found</p>
            <p className="text-xs text-[#8a857e] mt-1">Generate a study plan to create flashcards</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(card => (
              <div
                key={card.id}
                className="rounded-2xl border overflow-hidden"
                style={{ background: colors.cardBg, borderColor: colors.border }}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: colors.border }}>
                  <span className="text-xs text-[#8a857e] font-medium">{card.topics?.name}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize text-[#1c1a18]"
                    style={statusColors[card.status] || { background: colors.card5 }}
                  >
                    {card.status}
                  </span>
                </div>

                <div
                  onClick={() => setFlipped(flipped === card.id ? null : card.id)}
                  className="p-5 min-h-24 flex items-center justify-center cursor-pointer transition-colors"
                  style={{ background: flipped === card.id ? colors.card3 : colors.cardBg }}
                >
                  <p className="text-sm text-[#1c1a18] text-center leading-relaxed">
                    {flipped === card.id ? card.back : card.front}
                  </p>
                </div>

                <div className="px-4 py-2 border-t" style={{ borderColor: colors.border }}>
                  <p className="text-[10px] text-[#8a857e] text-center mb-2">
                    {flipped === card.id ? '← showing answer' : 'click to reveal answer'}
                  </p>
                  <div className="flex gap-1.5">
                    {(['new', 'learning', 'review', 'mastered'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(card.id, s)}
                        className="flex-1 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all"
                        style={{
                          background: card.status === s ? '#1c1a18' : colors.bg,
                          color: card.status === s ? '#fff' : '#4a4540'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RightSidebar />
    </div>
  )
}