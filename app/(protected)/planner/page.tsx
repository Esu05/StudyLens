'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RightSidebar from '@/components/rightsidebar'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'

type StudyDay = { day: number; title: string; tasks: string[] }
type Flashcard = { front: string; back: string }
type QuizQuestion = { question: string; options: string[]; answer: string }

type StudyPlan = {
  key_concepts: string[]
  summary: string
  study_plan: StudyDay[]
  flashcards: Flashcard[]
  quiz: QuizQuestion[]
  revision_dates: number[]
}

export default function PlannerPage() {
  const supabase = createClient()
  const { colors } = useTheme()
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [flipped, setFlipped] = useState<number | null>(null)
  const { isGuest, guestData, updateGuestData } = useGuest()

  console.log('isGuest:', isGuest, 'guestData topics:', guestData.topics.length)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setPlan(null)
    setSaved(false)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlan(data)
    } catch (e) {
      setError('Failed to generate study plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
  if (!plan) return

  if (isGuest) {
    // guest logic unchanged
    return
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log('USER:', user)
  console.log('USER ERROR:', userError)

  if (!user) {
    setError('User not found')
    return
  }

  // INSERT TOPIC
  const { data: topicData, error: topicError } = await supabase
    .from('topics')
    .insert({
      user_id: user.id,
      name: topic,
      subject: subject || null
    })
    .select()
    .single()

  console.log('TOPIC DATA:', topicData)
  console.log('TOPIC ERROR:', topicError)

  if (topicError || !topicData) {
    setError(topicError?.message || 'Failed to save topic')
    return
  }

  const topicId = topicData.id
  const today = new Date()

  // INSERT SESSION
  const { error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      topic_id: topicId,
      study_plan: plan.study_plan,
      key_concepts: plan.key_concepts,
      next_revision_date: new Date(today.getTime() + 86400000)
        .toISOString()
        .split('T')[0]
    })

  console.log('SESSION ERROR:', sessionError)

  // INSERT FLASHCARDS
  const { error: flashcardError } = await supabase
    .from('flashcards')
    .insert(
      plan.flashcards.map(f => ({
        user_id: user.id,
        topic_id: topicId,
        front: f.front,
        back: f.back,
        status: 'new'
      }))
    )

  console.log('FLASHCARD ERROR:', flashcardError)

  // INSERT REVISION SCHEDULE
  const { error: revisionError } = await supabase
    .from('revision_schedule')
    .insert(
      plan.revision_dates.map(days => ({
        user_id: user.id,
        topic_id: topicId,
        scheduled_date: new Date(today.getTime() + days * 86400000)
          .toISOString()
          .split('T')[0],
        interval_days: days,
        type: 'ai',
        is_done: false
      }))
    )

  console.log('REVISION ERROR:', revisionError)

  setSaved(true)
}

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        <div>
          <h1 className="text-3xl font-serif text-[#1c1a18]">AI Study Planner</h1>
          <p className="text-sm text-[#8a857e] mt-1">Enter a topic and let AI generate your complete study plan</p>
        </div>

        {/* Input */}
        <div className="rounded-2xl p-6 border" style={{ background: colors.cardBg, borderColor: colors.border }}>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter a topic e.g. Photosynthesis, Binary Trees, French Revolution…"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                className="flex-1 px-4 py-3 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                style={{ borderColor: colors.border, background: colors.bg }}
              />
              <input
                type="text"
                placeholder="Subject (optional)"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-40 px-4 py-3 rounded-xl border text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
                style={{ borderColor: colors.border, background: colors.bg }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full py-3 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {loading ? '✦ Generating your study plan...' : '✦ Generate study plan'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {/* Results */}
        {plan && (
          <div className="flex flex-col gap-4">

            {/* Summary */}
            <div className="rounded-2xl p-5" style={{ background: colors.card1 }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540] mb-2">Summary</p>
              <p className="text-sm text-[#1c1a18] leading-relaxed">{plan.summary}</p>
            </div>

            {/* Key concepts */}
            <div className="rounded-2xl p-5" style={{ background: colors.card4 }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540] mb-3">Key concepts</p>
              <div className="flex flex-wrap gap-2">
                {plan.key_concepts.map((concept, i) => (
                  <span key={i} className="bg-white/60 text-[#1c1a18] text-xs font-medium px-3 py-1.5 rounded-full">
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            {/* Study plan */}
            <div className="rounded-2xl p-5" style={{ background: colors.card2 }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540] mb-3">5-day study plan</p>
              <div className="flex flex-col gap-2">
                {plan.study_plan.map((day, i) => (
                  <div key={i} className="bg-white/50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-[#1c1a18] mb-1">Day {day.day} — {day.title}</p>
                    <ul className="flex flex-col gap-1">
                      {day.tasks.map((task, j) => (
                        <li key={j} className="text-xs text-[#4a4540] flex gap-2">
                          <span>·</span>{task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Flashcards */}
            <div className="rounded-2xl p-5" style={{ background: colors.card3 }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540] mb-3">Flashcards</p>
              <div className="grid grid-cols-2 gap-3">
                {plan.flashcards.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => setFlipped(flipped === i ? null : i)}
                    className="bg-white/60 rounded-xl p-4 cursor-pointer hover:bg-white/80 transition-all min-h-20 flex items-center justify-center text-center"
                  >
                    <p className="text-sm text-[#1c1a18]">
                      {flipped === i ? card.back : card.front}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#8a857e] mt-2 text-center">Click a card to flip it</p>
            </div>

            {/* Revision schedule */}
            <div className="rounded-2xl p-5" style={{ background: colors.card5 }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540] mb-3">Revision schedule</p>
              <div className="flex gap-2 flex-wrap">
                {plan.revision_dates.map((days, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() + days)
                  return (
                    <div key={i} className="bg-white/60 rounded-xl px-4 py-2 text-center">
                      <p className="text-xs font-semibold text-[#1c1a18]">
                        {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[10px] text-[#8a857e]">Day +{days}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Save button */}
            {!saved ? (
              <button
                onClick={handleSave}
                className="w-full py-3.5 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Save to my study plan →
              </button>
            ) : (
              <div
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-center text-[#1c1a18]"
                style={{ background: colors.card2 }}
              >
                ✓ Saved! Flashcards and revisions added.
              </div>
            )}
          </div>
        )}
      </div>

      <RightSidebar />
    </div>
  )
}