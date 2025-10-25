"use client"
import { useState, useEffect } from 'react'
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline'
import { voiceAssistant } from '@/utils/voice-assistant'

interface VoiceButtonProps {
  text?: string
  summary?: any
  vulnerability?: any
  greeting?: string
  tip?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * FREE Voice Button - Uses browser's built-in speech
 * NO API KEYS NEEDED! Works in all modern browsers.
 */
export function VoiceButton({
  text,
  summary,
  vulnerability,
  greeting,
  tip,
  className = '',
  size = 'md'
}: VoiceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = async () => {
    if (isPlaying) {
      voiceAssistant.stop()
      setIsPlaying(false)
      return
    }

    setIsLoading(true)
    try {
      if (text) {
        await voiceAssistant.speak(text)
      } else if (summary) {
        await voiceAssistant.readScanSummary(summary)
      } else if (vulnerability) {
        await voiceAssistant.readVulnerability(vulnerability)
      } else if (greeting) {
        await voiceAssistant.readDashboardGreeting(greeting)
      } else if (tip) {
        await voiceAssistant.readSecurityTip(tip)
      }
      setIsPlaying(true)
    } catch (error) {
      console.error('Voice playback error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Listen for playback end
  useEffect(() => {
    const checkPlaying = setInterval(() => {
      setIsPlaying(voiceAssistant.getIsPlaying())
    }, 500)

    return () => clearInterval(checkPlaying)
  }, [])

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${isPlaying ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400' : 'bg-gray-800/50 text-gray-400 border-gray-600'}
        ${isLoading ? 'opacity-50 cursor-wait' : 'hover:bg-cyan-500/30 hover:border-cyan-400 hover:text-cyan-300'}
        border rounded-lg transition-all duration-200
        flex items-center justify-center
        ${className}
      `}
      title={isPlaying ? 'Stop voice' : 'Play voice summary (FREE!)'}
      aria-label={isPlaying ? 'Stop voice' : 'Play voice summary'}
    >
      {isLoading ? (
        <div className={`${iconSizes[size]} border-2 border-cyan-400 border-t-transparent rounded-full animate-spin`} />
      ) : isPlaying ? (
        <SpeakerXMarkIcon className={`${iconSizes[size]} animate-pulse`} />
      ) : (
        <SpeakerWaveIcon className={iconSizes[size]} />
      )}
    </button>
  )
}
