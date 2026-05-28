'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RightSidebar from '@/components/rightsidebar'
import { useTheme } from '@/context/ThemeContext'
import { useGuest } from '@/context/GuestContext'

type Topic = { id: string; name: string }
type Question = { question: string; options: string[]; answer: string }
type QuizState = 'select' | 'playing' | 'finished' | 'history' | 'detail'

export default function QuizPage() {
  const supabase = createClient()
  const { colors } = useTheme()
  const { isGuest, guestData, updateGuestData } = useGuest()
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [state, setState] = useState<QuizState>('select')
  const [loading, setLoading] = useState(false)
  const [quizHistory, setQuizHistory] = useState<any[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [selectedQuizQuestions, setSelectedQuizQuestions] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    fetchTopics()
    fetchHistory()
  }, [isGuest, guestData.topics, guestData.quizResults])

  const fetchTopics = async () => {
    if (isGuest) {
      setTopics(guestData.topics.map((t: any) => ({ id: t.id, name: t.name })))
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('topics')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setTopics(data)
  }

  const fetchHistory = async () => {
    if (isGuest) {
      setQuizHistory(guestData.quizResults)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('quiz_results')
      .select('*, topics(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setQuizHistory(data)
  }

  const fetchQuizDetail = async (quiz: any) => {
    setLoadingDetail(true)
    setSelectedQuiz(quiz)
    setState('detail')

    if (isGuest) {
      // Guest quiz questions stored inside the quiz result
      setSelectedQuizQuestions(quiz.questions || [])
      setLoadingDetail(false)
      return
    }

    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_result_id', quiz.id)
      .order('created_at', { ascending: true })
    if (data) setSelectedQuizQuestions(data)
    setLoadingDetail(false)
  }

  const generateQuiz = async (topic: Topic) => {
    setSelectedTopic(topic)
    setLoading(true)
    setState('playing')
    setAnswers([])
    setUserAnswers([])
    setCurrent(0)
    setSelected(null)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.name })
      })
      const data = await res.json()
      setQuestions(data.quiz)
    } catch (e) {
      setState('select')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (option: string) => {
    if (selected) return
    setSelected(option)
    const isCorrect = option === questions[current].answer
    setAnswers(prev => [...prev, isCorrect])
    setUserAnswers(prev => [...prev, option])
  }

  const handleNext = async () => {
    if (current + 1 >= questions.length) {
      const score = [...answers].filter(Boolean).length
      const total = questions.length
      const weak_flag = (score / total) < 0.6

      if (isGuest && selectedTopic) {
        // Save quiz result to guest data
        const newResult = {
          id: Date.now().toString(),
          topic_id: selectedTopic.id,
          topics: { name: selectedTopic.name },
          score,
          total,
          accuracy: (score / total) * 100,
          weak_flag,
          created_at: new Date().toISOString(),
          // Store questions inside result for detail view
          questions: questions.map((q, i) => ({
            id: `${Date.now()}-q-${i}`,
            question: q.question,
            options: q.options,
            correct_answer: q.answer,
            user_answer: userAnswers[i] || '',
            is_correct: answers[i] || false
          }))
        }

        const nextDays = (score / total) >= 0.8 ? 14 : (score / total) >= 0.6 ? 7 : 3
        const newRevision = {
          id: `${Date.now()}-rev`,
          topic_id: selectedTopic.id,
          topics: { name: selectedTopic.name },
          scheduled_date: new Date(Date.now() + nextDays * 86400000).toISOString().split('T')[0],
          interval_days: nextDays,
          type: 'ai',
          is_done: false
        }

        updateGuestData('quizResults', [...guestData.quizResults, newResult])
        updateGuestData('revisions', [...guestData.revisions, newRevision])
        setQuizHistory(prev => [...prev, newResult])
        setState('finished')
        return
      }

      // Supabase save
      const { data: { user } } = await supabase.auth.getUser()
      if (user && selectedTopic) {
        const { data: resultData } = await supabase
          .from('quiz_results')
          .insert({ user_id: user.id, topic_id: selectedTopic.id, score, total, weak_flag })
          .select().single()
        if (resultData) {
          await supabase.from('quiz_questions').insert(
            questions.map((q, i) => ({
              user_id: user.id,
              quiz_result_id: resultData.id,
              question: q.question,
              options: q.options,
              correct_answer: q.answer,
              user_answer: userAnswers[i] || '',
              is_correct: answers[i] || false
            }))
          )
        }
        const today = new Date()
        const nextDays = (score / total) >= 0.8 ? 14 : (score / total) >= 0.6 ? 7 : 3
        await supabase.from('revision_schedule').insert({
          user_id: user.id,
          topic_id: selectedTopic.id,
          scheduled_date: new Date(today.getTime() + nextDays * 86400000).toISOString().split('T')[0],
          interval_days: nextDays,
          type: 'ai',
          is_done: false
        })
      }
      setState('finished')
      fetchHistory()
    } else {
      setCurrent(prev => prev + 1)
      setSelected(null)
    }
  }

  const score = answers.filter(Boolean).length
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const resultMsg = percent >= 80 ? 'Excellent work! 🎉' : percent >= 60 ? 'Good effort! Keep going 💪' : 'Keep practicing! You got this 📚'
  const resultBg = percent >= 80 ? colors.card2 : percent >= 60 ? colors.card3 : colors.card1

  const groupedHistory = quizHistory.reduce((acc: any, q: any) => {
    const date = new Date(q.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(q)
    return acc
  }, {})

  const historyBg = (pct: number) => pct >= 80 ? colors.card2 : pct >= 60 ? colors.card3 : colors.card1

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[#1c1a18]">Quiz</h1>
            <p className="text-sm text-[#8a857e] mt-1">Test your knowledge on any topic</p>
          </div>
          {state !== 'select' && (
            <button
              onClick={() => { setState('select'); setAnswers([]); setCurrent(0); setUserAnswers([]) }}
              className="text-xs font-semibold text-[#1c1a18] hover:underline"
            >
              ← Back to topics
            </button>
          )}
        </div>

        {/* SELECT */}
        {state === 'select' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-6 border" style={{ background: colors.cardBg, borderColor: colors.border }}>
              <p className="text-sm font-semibold text-[#1c1a18] mb-4">Select a topic to quiz on</p>
              {topics.length === 0 ? (
                <p className="text-sm text-[#8a857e]">No topics yet — generate a study plan first!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {topics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => generateQuiz(topic)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border hover:border-[#1c1a18] transition-all text-left"
                      style={{ borderColor: colors.border, background: colors.bg }}
                    >
                      <span className="text-sm font-medium text-[#1c1a18]">{topic.name}</span>
                      <span className="text-xs text-[#8a857e]">Start quiz →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {quizHistory.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: colors.card3 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540]">Recent quizzes</p>
                  <button onClick={() => setState('history')} className="text-xs font-semibold text-[#1c1a18] hover:underline">
                    View all →
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {quizHistory.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => fetchQuizDetail(q)}
                      className="bg-white/60 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-white/80 transition-all text-left w-full"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#1c1a18]">{q.topics?.name}</p>
                        <p className="text-xs text-[#8a857e]">
                          {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#1c1a18]">{q.score}/{q.total}</p>
                        <p className="text-xs text-[#8a857e]">{Math.round(q.accuracy)}%</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLAYING */}
        {state === 'playing' && (
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="rounded-2xl p-10 border text-center" style={{ background: colors.cardBg, borderColor: colors.border }}>
                <p className="text-sm text-[#8a857e]">✦ Generating quiz questions...</p>
              </div>
            ) : questions.length > 0 && (
              <>
                <div className="rounded-2xl p-4 border" style={{ background: colors.cardBg, borderColor: colors.border }}>
                  <div className="flex justify-between text-xs text-[#8a857e] mb-2">
                    <span>Question {current + 1} of {questions.length}</span>
                    <span>{selectedTopic?.name}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.bg }}>
                    <div className="h-full bg-[#1c1a18] rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl p-6" style={{ background: colors.card4 }}>
                  <p className="text-lg font-serif text-[#1c1a18] leading-relaxed">{questions[current].question}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {questions[current].options.map((option, i) => {
                    let bg = colors.cardBg
                    let border = colors.border
                    let opacity = '1'
                    if (selected) {
                      if (option === questions[current].answer) { bg = colors.card2; border = '#1c1a18' }
                      else if (option === selected) { bg = colors.card1; border = '#f87171' }
                      else opacity = '0.5'
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(option)}
                        disabled={!!selected}
                        className="w-full px-5 py-4 rounded-xl text-left text-sm font-medium text-[#1c1a18] transition-all border-2"
                        style={{ background: bg, borderColor: border, opacity }}
                      >
                        <span className="font-semibold mr-3 text-[#8a857e]">{['A', 'B', 'C', 'D'][i]}.</span>
                        {option}
                      </button>
                    )
                  })}
                </div>

                {selected && (
                  <button onClick={handleNext} className="w-full py-3.5 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                    {current + 1 >= questions.length ? 'See results →' : 'Next question →'}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* FINISHED */}
        {state === 'finished' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-8 text-center" style={{ background: resultBg }}>
              <p className="text-5xl font-serif text-[#1c1a18]">{percent}%</p>
              <p className="text-lg font-medium text-[#1c1a18] mt-2">{resultMsg}</p>
              <p className="text-sm text-[#4a4540] mt-1">{score} out of {questions.length} correct</p>
            </div>

            <div className="rounded-2xl p-5 border" style={{ background: colors.cardBg, borderColor: colors.border }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4540] mb-3">Review answers</p>
              <div className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: answers[i] ? colors.card2 : colors.card1 }}>
                    <p className="text-sm font-medium text-[#1c1a18]">{q.question}</p>
                    <p className="text-xs text-[#4a4540] mt-1">Your answer: <span className="font-semibold">{userAnswers[i]}</span></p>
                    {!answers[i] && <p className="text-xs text-[#4a4540] mt-0.5">Correct: <span className="font-semibold">{q.answer}</span></p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => selectedTopic && generateQuiz(selectedTopic)} className="flex-1 py-3 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                Retry quiz
              </button>
              <button
                onClick={() => { setState('select'); setAnswers([]); setCurrent(0); setUserAnswers([]) }}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold text-[#1c1a18] hover:border-[#1c1a18] transition-colors"
                style={{ background: colors.cardBg, borderColor: colors.border }}
              >
                Choose another topic
              </button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {state === 'history' && (
          <div className="flex flex-col gap-5">
            {Object.keys(groupedHistory).length === 0 ? (
              <div className="rounded-2xl p-10 border text-center" style={{ background: colors.cardBg, borderColor: colors.border }}>
                <p className="text-sm text-[#8a857e]">No quiz history yet</p>
              </div>
            ) : Object.entries(groupedHistory).map(([date, quizzes]: [string, any]) => (
              <div key={date}>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8a857e] mb-3">{date}</p>
                <div className="flex flex-col gap-2">
                  {quizzes.map((q: any, i: number) => {
                    const pct = Math.round(q.accuracy)
                    return (
                      <button
                        key={i}
                        onClick={() => fetchQuizDetail(q)}
                        className="rounded-2xl p-5 flex items-center justify-between hover:opacity-80 transition-opacity text-left w-full"
                        style={{ background: historyBg(pct) }}
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1c1a18]">{q.topics?.name}</p>
                          <p className="text-xs text-[#4a4540] mt-1">
                            {new Date(q.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-1.5 w-24 bg-black/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#1c1a18] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-[#1c1a18]">{pct}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-serif text-[#1c1a18]">{q.score}/{q.total}</p>
                          {q.weak_flag && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60 text-[#1c1a18]">needs work</span>}
                          <p className="text-xs text-[#4a4540] mt-1">View details →</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DETAIL */}
        {state === 'detail' && selectedQuiz && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-6" style={{ background: historyBg(Math.round(selectedQuiz.accuracy)) }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#1c1a18]">{selectedQuiz.topics?.name}</p>
                  <p className="text-xs text-[#4a4540] mt-1">
                    {new Date(selectedQuiz.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}
                    {new Date(selectedQuiz.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-serif text-[#1c1a18]">{selectedQuiz.score}/{selectedQuiz.total}</p>
                  <p className="text-sm font-semibold text-[#4a4540]">{Math.round(selectedQuiz.accuracy)}%</p>
                </div>
              </div>
            </div>

            {loadingDetail ? (
              <p className="text-sm text-[#8a857e]">Loading questions...</p>
            ) : selectedQuizQuestions.length === 0 ? (
              <div className="rounded-2xl p-8 border text-center" style={{ background: colors.cardBg, borderColor: colors.border }}>
                <p className="text-sm text-[#8a857e]">No question details available</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8a857e]">All questions</p>
                {selectedQuizQuestions.map((q, i) => (
                  <div key={i} className="rounded-2xl p-5" style={{ background: q.is_correct ? colors.card2 : colors.card1 }}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[#1c1a18]">Q{i + 1}. {q.question}</p>
                      <span className={`text-xs font-bold shrink-0 ${q.is_correct ? 'text-green-700' : 'text-red-600'}`}>
                        {q.is_correct ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5">
                      {q.options?.map((opt: string, j: number) => {
                        const isCorrect = opt === q.correct_answer
                        const isUserAnswer = opt === q.user_answer
                        return (
                          <div
                            key={j}
                            className={`px-3 py-2 rounded-xl text-xs font-medium ${isCorrect ? 'bg-white/80 text-green-700 font-semibold' : isUserAnswer && !q.is_correct ? 'bg-white/40 text-red-600 line-through' : 'bg-white/30 text-[#4a4540]'}`}
                          >
                            {['A', 'B', 'C', 'D'][j]}. {opt}
                            {isCorrect && ' ✓'}
                            {isUserAnswer && !q.is_correct && ' (your answer)'}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setState('history')}
              className="w-full py-3 rounded-xl border text-sm font-semibold text-[#1c1a18] hover:border-[#1c1a18] transition-colors"
              style={{ background: colors.cardBg, borderColor: colors.border }}
            >
              ← Back to history
            </button>
          </div>
        )}

      </div>
      <RightSidebar />
    </div>
  )
}