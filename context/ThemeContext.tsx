'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const themes = {
  default: {
    bg: '#f5f0e8',
    card1: '#FFCCE1',
    card2: '#CDE5D9',
    card3: '#F2EBCC',
    card4: '#BCD8EC',
    card5: '#DCCCEc',
    card6: '#D6E5BD',
    border: '#e8e2d8',
    cardBg: '#ffffff',
  },
  warm: {
    bg: '#fdf6ee',
    card1: '#FFD4A3',
    card2: '#FFEAA3',
    card3: '#FFB8B8',
    card4: '#FFD4C2',
    card5: '#FFCBA3',
    card6: '#FFE8C2',
    border: '#f0e0d0',
    cardBg: '#ffffff',
  },
  cool: {
    bg: '#f0f4ff',
    card1: '#B8D4FF',
    card2: '#B8FFE8',
    card3: '#D4B8FF',
    card4: '#B8F0FF',
    card5: '#C8B8FF',
    card6: '#B8FFD4',
    border: '#d0e0f0',
    cardBg: '#ffffff',
  },
  mono: {
    bg: '#f5f5f5',
    card1: '#E8E8E8',
    card2: '#D0D0D0',
    card3: '#EBEBEB',
    card4: '#DCDCDC',
    card5: '#E0E0E0',
    card6: '#D8D8D8',
    border: '#e0e0e0',
    cardBg: '#ffffff',
  },
}

export type ThemeKey = keyof typeof themes
export type ThemeColors = typeof themes.default

const ThemeContext = createContext<{
  theme: ThemeKey
  colors: ThemeColors
  setTheme: (key: ThemeKey) => void
}>({
  theme: 'default',
  colors: themes.default,
  setTheme: () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>('default')

  useEffect(() => {
    const saved = localStorage.getItem('studylens_theme') as ThemeKey
    if (saved && themes[saved]) setThemeState(saved)
  }, [])

  const setTheme = (key: ThemeKey) => {
    setThemeState(key)
    localStorage.setItem('studylens_theme', key)
  }

  return (
    <ThemeContext.Provider value={{ theme, colors: themes[theme], setTheme }}>
      <div style={{ background: themes[theme].bg, minHeight: '100vh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)