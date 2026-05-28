'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'

type GuestData = {
  topics: any[]
  sessions: any[]
  flashcards: any[]
  quizResults: any[]
  syllabus: any[]
  revisions: any[]
  events: any[]
}

const defaultData: GuestData = {
  topics: [],
  sessions: [],
  flashcards: [],
  quizResults: [],
  syllabus: [],
  revisions: [],
  events: [],
}

type GuestContextType = {
  isGuest: boolean
  guestData: GuestData
  setGuestMode: (val: boolean) => void
  updateGuestData: (key: keyof GuestData, data: any[]) => void
  clearGuestData: () => void
}

const GuestContext = createContext<GuestContextType>({
  isGuest: false,
  guestData: defaultData,
  setGuestMode: () => {},
  updateGuestData: () => {},
  clearGuestData: () => {},
})

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(false)
  const [guestData, setGuestData] = useState<GuestData>(defaultData)
  const [mounted, setMounted] = useState(false)
  const guestDataRef = useRef<GuestData>(defaultData)

  useEffect(() => {
    const cookieGuest = document.cookie.includes('studylens_guest=true')
    const localGuest = localStorage.getItem('studylens_guest') === 'true'
    const guest = cookieGuest || localGuest

    if (guest) {
      setIsGuest(true)
      const saved = localStorage.getItem('studylens_guest_data')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setGuestData(parsed)
          guestDataRef.current = parsed
        } catch (e) {
          console.error('Failed to parse guest data', e)
        }
      }
    }
    setMounted(true)
  }, [])

  const setGuestMode = (val: boolean) => {
    console.log('setGuestMode called with:', val)
    setIsGuest(val)
    localStorage.setItem('studylens_guest', val ? 'true' : 'false')
    if (val) {
      document.cookie = 'studylens_guest=true; path=/; max-age=86400'
    } else {
      document.cookie = 'studylens_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      localStorage.removeItem('studylens_guest_data')
      localStorage.removeItem('studylens_guest')
      guestDataRef.current = defaultData
      setGuestData(defaultData)
    }
  }

  const updateGuestData = (key: keyof GuestData, data: any[]) => {
    // Use ref to always have latest data — fixes race condition
    const updated = { ...guestDataRef.current, [key]: data }
    guestDataRef.current = updated
    setGuestData({ ...updated })
    localStorage.setItem('studylens_guest_data', JSON.stringify(updated))
    console.log('updateGuestData:', key, data.length, 'total topics:', updated.topics.length)
  }

  const clearGuestData = () => {
    guestDataRef.current = defaultData
    setGuestData(defaultData)
    localStorage.removeItem('studylens_guest_data')
    localStorage.removeItem('studylens_guest')
    document.cookie = 'studylens_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setIsGuest(false)
  }

  if (!mounted) return <>{children}</>

  return (
    <GuestContext.Provider value={{ isGuest, guestData, setGuestMode, updateGuestData, clearGuestData }}>
      {children}
    </GuestContext.Provider>
  )
}

export const useGuest = () => useContext(GuestContext)