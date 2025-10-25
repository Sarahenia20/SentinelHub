'use client'

import { useState, useEffect } from 'react'
import {
  CpuChipIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { VoiceButton } from './voice-button'
import ReactMarkdown from 'react-markdown'

interface AIPersonaData {
  persona: string
  emoji: string
  message: string
  mood: string
  timestamp: string
}

interface SecurityTip {
  persona: string
  emoji: string
  tip: string
  category: string
}

const PERSONA_TYPES = [
  { id: 'guardian', name: '🛡️ Guardian', description: 'Professional & Protective' },
  { id: 'detective', name: '🕵️ Detective', description: 'Investigative & Curious' },
  { id: 'coach', name: '💪 Coach', description: 'Motivational & Supportive' },
  { id: 'ninja', name: '🥷 Ninja', description: 'Stealthy & Efficient' },
  { id: 'sage', name: '🧙 Sage', description: 'Wise & Knowledgeable' }
]

export function AIInsights() {
  const [mounted, setMounted] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState('guardian')
  const [personaGreeting, setPersonaGreeting] = useState<AIPersonaData | null>(null)
  const [securityTip, setSecurityTip] = useState<SecurityTip | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    loadAIPersona()
  }, [selectedPersona])

  const loadAIPersona = async () => {
    setIsLoading(true)
    try {
      // Fetch dashboard metrics with AI persona
      const response = await fetch(`http://localhost:3001/api/dashboard/metrics?persona=${selectedPersona}`)
      const data = await response.json()

      if (data.aiPersona) {
        setPersonaGreeting(data.aiPersona)
      } else {
        // Fallback greeting if no scans yet
        setPersonaGreeting({
          persona: PERSONA_TYPES.find(p => p.id === selectedPersona)?.name || 'Guardian',
          emoji: PERSONA_TYPES.find(p => p.id === selectedPersona)?.name.split(' ')[0] || '🛡️',
          message: `Welcome! I'm your ${selectedPersona} security assistant. Run your first scan to get personalized security insights and recommendations tailored to your codebase.`,
          mood: 'ready',
          timestamp: new Date().toISOString()
        })
      }

      // Generate security tip
      await loadSecurityTip()

    } catch (error) {
      console.error('Failed to load AI persona:', error)
      // Fallback data
      setPersonaGreeting({
        persona: 'Security Guardian',
        emoji: '🛡️',
        message: 'AI security assistant ready! Run a scan to get personalized insights.',
        mood: 'ready',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSecurityTip = async () => {
    try {
      // Mock tip (you can create an API endpoint for this)
      const tips = [
        { tip: 'Always validate and sanitize user input before processing - it\'s your first line of defense against injection attacks.', category: 'input-validation' },
        { tip: 'Rotate your API keys and secrets regularly. Set calendar reminders to make it a habit every 90 days.', category: 'secrets' },
        { tip: 'Keep dependencies updated - 80% of vulnerabilities come from outdated packages. Use automated tools like Dependabot.', category: 'dependencies' },
        { tip: 'Implement rate limiting on your APIs to prevent abuse and DoS attacks. Start with 100 requests per minute per IP.', category: 'api-security' },
        { tip: 'Use HTTPS everywhere. Even internal APIs should use TLS to prevent man-in-the-middle attacks.', category: 'encryption' }
      ]

      const randomTip = tips[Math.floor(Math.random() * tips.length)]
      setSecurityTip({
        persona: selectedPersona,
        emoji: PERSONA_TYPES.find(p => p.id === selectedPersona)?.name.split(' ')[0] || '🛡️',
        ...randomTip
      })
    } catch (error) {
      console.error('Failed to load security tip:', error)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="backdrop-blur-xl bg-gray-900/10 border border-purple-500/15 rounded-2xl p-6 h-[500px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700/50 rounded w-1/2"></div>
          <div className="h-24 bg-gray-700/50 rounded"></div>
          <div className="h-16 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-gray-900/10 border border-purple-500/15 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 shadow-xl hover:shadow-purple-500/10 h-[500px] overflow-hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
            <SparklesIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-gray-300 text-lg font-semibold">AI Security Assistant</h3>
            <p className="text-xs text-gray-500">Powered by Gemini 2.0</p>
          </div>
        </div>

        {/* Voice Button */}
        {personaGreeting && (
          <VoiceButton
            greeting={personaGreeting.message}
            size="md"
          />
        )}
      </div>

      {/* Persona Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {PERSONA_TYPES.map((persona) => (
          <button
            key={persona.id}
            onClick={() => setSelectedPersona(persona.id)}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
              ${selectedPersona === persona.id
                ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400 text-purple-300'
                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-purple-500/50'
              }
              border
            `}
            title={persona.description}
          >
            {persona.name}
          </button>
        ))}
      </div>

      {/* AI Greeting */}
      {personaGreeting && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 mb-4 flex-grow overflow-y-auto">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{personaGreeting.emoji}</div>
            <div className="flex-1">
              <h4 className="text-purple-300 font-semibold mb-2">{personaGreeting.persona}</h4>
              <div className="text-gray-300 text-sm prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{personaGreeting.message}</ReactMarkdown>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <div className={`
                  w-2 h-2 rounded-full
                  ${personaGreeting.mood === 'alert' ? 'bg-red-400 animate-pulse' :
                    personaGreeting.mood === 'concerned' ? 'bg-yellow-400' :
                    'bg-green-400'}
                `}></div>
                <span className="capitalize">{personaGreeting.mood}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tip */}
      {securityTip && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <LightBulbIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h5 className="text-yellow-300 font-semibold text-xs mb-1">Security Tip of the Day</h5>
              <p className="text-gray-300 text-xs leading-relaxed">{securityTip.tip}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-yellow-500/20 rounded text-xs text-yellow-300">
                #{securityTip.category}
              </div>
            </div>
            <VoiceButton
              tip={securityTip.tip}
              size="sm"
            />
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-700/50">
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-400">24/7</div>
          <div className="text-xs text-gray-500">Available</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">FREE</div>
          <div className="text-xs text-gray-500">Voice AI</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">5</div>
          <div className="text-xs text-gray-500">Personas</div>
        </div>
      </div>
    </div>
  )
}
