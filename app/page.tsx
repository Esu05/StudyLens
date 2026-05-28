'use client'

import { useRouter } from 'next/navigation'
import { useGuest } from '@/context/GuestContext'

export default function LandingPage() {
  const router = useRouter()
  const { setGuestMode } = useGuest()

  const handleGuest = () => {
    setGuestMode(true)
    router.push('/dashboard')
  }

  const features = [
    {
      icon: '✦',
      title: 'AI Study Planner',
      desc: 'Generate complete study plans, flashcards, quizzes and revision schedules from any topic in seconds.',
      color: '#FFCCE1',
    },
    {
      icon: '◫',
      title: 'Smart Flashcards',
      desc: 'AI-generated flashcards with spaced repetition. Track your progress from new to mastered.',
      color: '#BCD8EC',
    },
    {
      icon: '◎',
      title: 'Adaptive Quiz',
      desc: 'Test yourself with AI-generated MCQs. Weak topics get flagged automatically for revision.',
      color: '#CDE5D9',
    },
    {
      icon: '↻',
      title: 'Revision Scheduler',
      desc: 'Spaced repetition built in. Never forget what you studied with smart revision reminders.',
      color: '#F2EBCC',
    },
    {
      icon: '▦',
      title: 'Syllabus Tracker',
      desc: 'Track every subject and chapter. Watch your progress bar grow as you complete chapters.',
      color: '#DCCCEc',
    },
    {
      icon: '◷',
      title: 'Schedule & Events',
      desc: 'Plan your study sessions with a built-in calendar. Get notified before important events.',
      color: '#D6E5BD',
    },
  ]

  return (
    <div className="min-h-screen font-sans bg-[#f5f0e8]">

      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-10 py-5 border-b border-black/5 sticky top-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1c1a18] flex items-center justify-center text-[#FFCCE1] text-sm font-bold">
            ✦
          </div>

          <span className="text-lg font-semibold text-[#1c1a18]">
            StudyLens
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="px-5 py-2 text-sm font-semibold text-[#1c1a18] hover:opacity-70 transition-opacity"
          >
            Log in
          </button>

          <button
            onClick={() => router.push('/signup')}
            className="px-5 py-2 bg-[#1c1a18] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="flex flex-col items-center text-center px-6 pt-24 pb-20"
        style={{ background: '#f5f0e8' }}
      >

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
          style={{
            background: '#FFCCE1',
            borderColor: '#e8c8d4',
            color: '#1c1a18',
          }}
        >
          ✦ AI-powered learning — free to try
        </div>

        <h1 className="text-6xl font-serif text-[#1c1a18] max-w-3xl leading-tight mb-6">
          Study smarter,
          <br />
          not harder.
        </h1>

        <p className="text-lg text-[#8a857e] max-w-xl leading-relaxed mb-10">
          StudyLens turns any topic into a complete study plan — with
          flashcards, quizzes, revision schedules and progress tracking,
          all powered by AI.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">

          <button
            onClick={() => router.push('/signup')}
            className="px-8 py-3.5 bg-[#1c1a18] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
            style={{
              boxShadow: '0 4px 24px rgba(28,26,24,0.18)',
            }}
          >
            Start studying free →
          </button>

          <button
            onClick={handleGuest}
            className="px-8 py-3.5 border text-sm font-semibold rounded-full hover:border-[#1c1a18] transition-colors text-[#1c1a18]"
            style={{
              borderColor: '#e8e2d8',
              background: '#fff',
            }}
          >
            Try as guest
          </button>
        </div>

        <p className="text-xs text-[#8a857e] mt-4">
          No credit card required · Free forever
        </p>
      </section>

      {/* App preview */}
      <section
        className="px-6 py-24"
        style={{ background: '#FFCCE1' }}
      >

        <div
          className="rounded-3xl border overflow-hidden max-w-5xl mx-auto"
          style={{
            borderColor: '#e8e2d8',
            background: '#fff',
            boxShadow: '0 20px 60px rgba(28,26,24,0.12)',
          }}
        >

          {/* Browser bar */}
          <div
            className="flex items-center gap-2 px-5 py-3 border-b"
            style={{
              borderColor: '#e8e2d8',
              background: '#f5f0e8',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-red-300" />
            <div className="w-3 h-3 rounded-full bg-yellow-300" />
            <div className="w-3 h-3 rounded-full bg-green-300" />

            <div
              className="flex-1 mx-4 bg-white rounded-full px-4 py-1 text-xs text-[#8a857e] border"
              style={{ borderColor: '#e8e2d8' }}
            >
              studylens/dashboard
            </div>
          </div>

          {/* Mini dashboard */}
          <div
            className="flex"
            style={{
              background: '#f5f0e8',
              minHeight: '320px',
            }}
          >

            {/* Sidebar */}
            <div
              className="w-44 p-4 flex flex-col gap-1"
              style={{ background: '#1c1a18' }}
            >

              <div className="flex items-center gap-2 px-2 pb-4 pt-1">
                <div className="w-5 h-5 rounded-full bg-[#FFCCE1] flex items-center justify-center text-[10px]">
                  ✦
                </div>

                <span className="text-white text-xs font-semibold">
                  StudyLens
                </span>
              </div>

              {[
                'Dashboard',
                'AI Planner',
                'Flashcards',
                'Quiz',
                'Syllabus',
                'Revisions',
              ].map((item, i) => (
                <div
                  key={item}
                  className="px-3 py-2 rounded-lg text-[11px] font-medium"
                  style={{
                    background: i === 0 ? '#FFCCE1' : 'transparent',
                    color: i === 0 ? '#1c1a18' : '#666',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main dashboard */}
            <div className="flex-1 p-5 flex flex-col gap-3">

              <p className="text-xs text-[#8a857e] uppercase tracking-widest font-medium">
                Monday, 28 May 2026
              </p>

              <h2 className="text-2xl font-serif text-[#1c1a18]">
                Good morning, Aditi.
              </h2>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mt-1">

                {[
                  {
                    label: 'Syllabus',
                    val: '68%',
                    color: '#FFCCE1',
                  },
                  {
                    label: 'Quiz avg',
                    val: '82%',
                    color: '#BCD8EC',
                  },
                  {
                    label: 'Weak topics',
                    val: '3',
                    color: '#CDE5D9',
                  },
                  {
                    label: 'Due today',
                    val: '2',
                    color: '#F2EBCC',
                  },
                ].map(card => (
                  <div
                    key={card.label}
                    className="rounded-xl p-3"
                    style={{ background: card.color }}
                  >
                    <p className="text-[9px] uppercase font-semibold text-[#4a4540] tracking-wider">
                      {card.label}
                    </p>

                    <p className="text-xl font-bold text-[#1c1a18] mt-0.5">
                      {card.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom cards */}
              <div className="grid grid-cols-2 gap-2">

                <div
                  className="rounded-xl p-3"
                  style={{ background: '#DCCCEc' }}
                >
                  <p className="text-[9px] uppercase font-semibold text-[#4a4540] tracking-wider mb-2">
                    Due for revision
                  </p>

                  {['Binary Trees', 'Photosynthesis'].map(t => (
                    <div
                      key={t}
                      className="bg-white/50 rounded-lg px-2.5 py-1.5 mb-1 text-[10px] font-medium text-[#1c1a18]"
                    >
                      {t}
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-xl p-3"
                  style={{ background: '#D6E5BD' }}
                >
                  <p className="text-[9px] uppercase font-semibold text-[#4a4540] tracking-wider mb-2">
                    Recent sessions
                  </p>

                  {["Photosynthesis", "Newton's Laws"].map(t => (
                    <div
                      key={t}
                      className="bg-white/50 rounded-lg px-2.5 py-1.5 mb-1 text-[10px] font-medium text-[#1c1a18]"
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* Features */}
<section
  className="px-6 py-24"
  style={{ background: '#BCD8EC' }}
>
  <div className="max-w-5xl mx-auto">

    <h2 className="text-4xl font-serif text-[#1c1a18] text-center mb-3">
      Everything you need to ace your exams
    </h2>

    <p className="text-center text-[#4a4540] mb-14">
      One app. All your study tools. Powered by AI.
    </p>

    <div className="grid grid-cols-3 gap-6">

      {features.map((f, i) => (
        <div
          key={i}
          className="
            rounded-3xl
            p-6
            border
            transition-all
            duration-300
            hover:-translate-y-3
            hover:scale-[1.02]
            active:-translate-y-1
            cursor-pointer
          "
          style={{
            background: f.color,
            borderColor: 'rgba(0,0,0,0.08)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
          }}
        >

          {/* Icon */}
          <div
            className="
              w-11
              h-11
              rounded-2xl
              flex
              items-center
              justify-center
              mb-5
              text-lg
            "
            style={{
              background: '#1c1a18',
              color: f.color,
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
            }}
          >
            {f.icon}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-[#1c1a18] mb-3">
            {f.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-[#4a4540] leading-relaxed">
            {f.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* How it works */}
      <section
  className="px-6 py-24 border"
  style={{ background: '#CDE5D9' }}
>
  <div className="max-w-4xl mx-auto">

    <h2 className="text-4xl font-serif text-[#1c1a18] text-center mb-16">
      How it works
    </h2>

    <div className="grid grid-cols-3 gap-10">

      {[
        {
          step: '01',
          title: 'Enter a topic',
          desc: 'Type any topic — Photosynthesis, Binary Trees, French Revolution — anything you need to study.',
          color: '#FFCCE1',
        },
        {
          step: '02',
          title: 'AI generates your plan',
          desc: 'Get a complete study plan, flashcards, quiz questions, key concepts and a revision schedule instantly.',
          color: '#BCD8EC',
        },
        {
          step: '03',
          title: 'Track your progress',
          desc: 'Mark chapters done, take quizzes, review flashcards and let spaced repetition do the rest.',
          color: '#F2EBCC',
        },
      ].map((s, i) => (
        <div
          key={i}
          className="
            rounded-3xl
            p-7
            border
            flex
            flex-col
            gap-4
            transition-all
            duration-300
            hover:-translate-y-3
            hover:shadow-2xl
            active:-translate-y-1
            cursor-pointer
          "
          style={{
            background: s.color,
            borderColor: 'rgba(0,0,0,0.08)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          }}
        >

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-serif font-bold"
            style={{
              background: '#1c1a18',
              color: '#fff',
            }}
          >
            {s.step}
          </div>

          <h3 className="text-lg font-semibold text-[#1c1a18]">
            {s.title}
          </h3>

          <p className="text-sm text-[#4a4540] leading-relaxed">
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Stats */}
      <section
        className="px-6 py-24"
        style={{ background: '#F2EBCC' }}
      >

        <div className="max-w-4xl mx-auto">

          <div className="grid grid-cols-3 gap-6">

            {[
              {
                val: '10x',
                label: 'Faster study planning',
                color: '#FFCCE1',
              },
              {
                val: '6',
                label: 'Powerful study tools',
                color: '#CDE5D9',
              },
              {
                val: '∞',
                label: 'Topics you can study',
                color: '#BCD8EC',
              },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-8 text-center"
                style={{ background: s.color }}
              >
                <p className="text-5xl font-serif text-[#1c1a18] mb-2">
                  {s.val}
                </p>

                <p className="text-sm text-[#4a4540] font-medium">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="px-6 py-24"
        style={{ background: '#DCCCEc' }}
      >

        <div
          className="max-w-2xl mx-auto rounded-3xl p-14 text-center"
          style={{ background: '#1c1a18' }}
        >

          <div className="w-12 h-12 rounded-full bg-[#FFCCE1] flex items-center justify-center text-lg mx-auto mb-6">
            ✦
          </div>

          <h2 className="text-4xl font-serif text-white mb-4">
            Ready to study smarter?
          </h2>

          <p className="text-[#8a857e] mb-10 text-sm leading-relaxed">
            Join StudyLens and turn any topic into a complete study system
            in seconds. Free forever.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">

            <button
              onClick={() => router.push('/signup')}
              className="px-8 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{
                background: '#FFCCE1',
                color: '#1c1a18',
              }}
            >
              Create free account →
            </button>

            <button
              onClick={handleGuest}
              className="px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Try as guest
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-10 py-8 border-t text-center"
        style={{
          borderColor: '#e8e2d8',
          background: '#D6E5BD',
        }}
      >

        <div className="flex items-center justify-center gap-2 mb-2">

          <div className="w-5 h-5 rounded-full bg-[#1c1a18] flex items-center justify-center text-[#FFCCE1] text-[10px]">
            ✦
          </div>

          <span className="text-sm font-semibold text-[#1c1a18]">
            StudyLens
          </span>
        </div>

        <p className="text-xs text-[#4a4540]">
          Built for students who want to study smarter · Made with ♥
        </p>
      </footer>
    </div>
  )
}
