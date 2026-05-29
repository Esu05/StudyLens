'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useGuest } from '@/context/GuestContext'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setGuestMode } = useGuest()

  const handleSignup = async () => {
  setLoading(true)
  setError('')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      },
      emailRedirectTo: 'https://study-lens-esu05s-projects.vercel.app/dashboard'
    }
  })

  console.log('SIGNUP DATA:', data)
  console.log('SIGNUP ERROR:', error)

  if (error) {
    setError(error.message)
    setLoading(false)
    return
  }

  // IMPORTANT
  const {
    data: { session }
  } = await supabase.auth.getSession()

  console.log('SESSION:', session)

  if (!session) {
    setError('Please check your email and verify your account.')
    setLoading(false)
    return
  }

  setGuestMode(false)
  router.push('/dashboard')
}

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center font-sans">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md border border-[#e8e2d8]">

        <div className="text-xl font-semibold text-[#1c1a18] mb-7">✦ StudyLens</div>
        <h1 className="text-3xl font-serif text-[#1c1a18] mb-1">Create account</h1>
        <p className="text-sm text-[#8a857e] mb-7">Start studying smarter today</p>

        {error && (
          <div className="bg-red-100 text-red-800 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Peter Parker"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#e8e2d8] text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#e8e2d8] text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            id = "password"
            name = "password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#e8e2d8] text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full py-3 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="text-center text-sm text-[#8a857e] mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1c1a18] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}