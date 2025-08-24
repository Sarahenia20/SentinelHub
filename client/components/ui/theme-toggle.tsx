'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-14 h-8 rounded-full bg-white/20 dark:bg-navy-700/20 animate-pulse"></div>
    )
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-14 h-8 rounded-full p-1 transition-all duration-300 ease-in-out transform hover:scale-105
        ${resolvedTheme === 'dark' 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25' 
          : 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg shadow-yellow-500/25'
        }
      `}
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Toggle circle */}
      <div
        className={`
          w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 ease-in-out flex items-center justify-center
          ${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-0'}
        `}
      >
        {resolvedTheme === 'dark' ? (
          <MoonIcon className="w-4 h-4 text-blue-600" />
        ) : (
          <SunIcon className="w-4 h-4 text-orange-500" />
        )}
      </div>

      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <SunIcon className={`w-4 h-4 transition-opacity duration-300 ${resolvedTheme === 'dark' ? 'opacity-40 text-white' : 'opacity-0'}`} />
        <MoonIcon className={`w-4 h-4 transition-opacity duration-300 ${resolvedTheme === 'dark' ? 'opacity-0' : 'opacity-40 text-white'}`} />
      </div>
    </button>
  )
}