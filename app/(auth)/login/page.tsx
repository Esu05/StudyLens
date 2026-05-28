'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useGuest } from '@/context/GuestContext'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setGuestMode } = useGuest()

  const handleGuest = () => {
  setGuestMode(true)
  router.push('/dashboard')
}

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setGuestMode(false)
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center font-sans">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md border border-[#e8e2d8]">
        
        <div className="text-xl font-semibold text-[#1c1a18] mb-7">✦ StudyLens</div>
        <h1 className="text-3xl font-serif text-[#1c1a18] mb-1">Welcome back</h1>
        <p className="text-sm text-[#8a857e] mb-7">Log in to continue studying</p>

        {error && (
          <div className="bg-red-100 text-red-800 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#4a4540] uppercase tracking-wider mb-2">
            Email
          </label>
          <input
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
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#e8e2d8] text-sm text-[#1c1a18] outline-none focus:border-[#1c1a18] transition-colors"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 bg-[#1c1a18] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-center text-sm text-[#8a857e] mt-5">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#1c1a18] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#e8e2d8' }} />
              </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-[#8a857e] bg-white">or</span>
            </div>
          </div>

          <button
            onClick={handleGuest}
            className="w-full py-3 border rounded-xl text-sm font-semibold text-[#1c1a18] hover:border-[#1c1a18] transition-colors"
            style={{ borderColor: '#e8e2d8' }}
          >
            Continue as guest
          </button>
      </div>
    </div>
  )
}