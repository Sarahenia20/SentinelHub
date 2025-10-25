"use client"

import { useState, useEffect } from 'react'
import { XMarkIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import {
  SecurityPersona,
  AVAILABLE_PERSONAS,
  analyzePersona,
  calculateScanPattern,
  generatePersonaInsights
} from '@/utils/ai-persona'

interface AIPersonaWidgetProps {
  onPersonaSelect?: (persona: SecurityPersona) => void
  compact?: boolean
}

export function AIPersonaWidget({ onPersonaSelect, compact = false }: AIPersonaWidgetProps) {
  const [currentPersona, setCurrentPersona] = useState<SecurityPersona | null>(null)
  const [showSelector, setShowSelector] = useState(false)
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(true)

  useEffect(() => {
    loadPersona()
  }, [])

  const loadPersona = async () => {
    setAnalyzing(true)
    try {
      // Check if user has a selected persona in session
      const sessionPersona = sessionStorage.getItem('sentinelhub_persona')
      if (sessionPersona) {
        // Simulate AI analysis for visual effect
        await new Promise(resolve => setTimeout(resolve, 800))
        const persona = JSON.parse(sessionPersona)
        setCurrentPersona(persona)
        loadInsights(persona)
        setAnalyzing(false)
        return
      }

      // Simulate AI analyzing your scan patterns
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Otherwise, analyze scan patterns and suggest a persona
      const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')
      if (savedReports.length > 0) {
        const pattern = calculateScanPattern(savedReports)
        const suggestedPersona = await analyzePersona(pattern)
        setCurrentPersona(suggestedPersona)
        loadInsights(suggestedPersona)
        sessionStorage.setItem('sentinelhub_persona', JSON.stringify(suggestedPersona))
      } else {
        // Default to Guardian for new users
        const defaultPersona = AVAILABLE_PERSONAS[0]
        setCurrentPersona(defaultPersona)
        loadInsights(defaultPersona)
      }
    } catch (error) {
      console.error('Error loading persona:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const loadInsights = async (persona: SecurityPersona) => {
    try {
      const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')
      const pattern = calculateScanPattern(savedReports)
      const personaInsights = await generatePersonaInsights(persona, pattern)
      setInsights(personaInsights)
    } catch (error) {
      console.error('Error loading insights:', error)
    }
  }

  const handlePersonaSelect = (persona: SecurityPersona) => {
    setCurrentPersona(persona)
    sessionStorage.setItem('sentinelhub_persona', JSON.stringify(persona))
    // Also save the role name for the header
    sessionStorage.setItem('user_role', persona.title)
    loadInsights(persona)
    setShowSelector(false)
    if (onPersonaSelect) {
      onPersonaSelect(persona)
    }
    // Trigger a custom event to update the header
    window.dispatchEvent(new CustomEvent('roleChanged', { detail: persona.title }))
  }

  const handleReanalyze = async () => {
    setLoading(true)
    try {
      const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')
      const pattern = calculateScanPattern(savedReports)
      const suggestedPersona = await analyzePersona(pattern)
      handlePersonaSelect(suggestedPersona)
    } catch (error) {
      console.error('Error reanalyzing persona:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show AI analyzing animation
  if (analyzing || !currentPersona) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-center space-x-3 py-8">
          <div className="relative">
            <SparklesIcon className="w-8 h-8 text-yellow-400 animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <SparklesIcon className="w-8 h-8 text-yellow-400 opacity-75" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-1">
              AI Analyzing Your Security Profile...
            </div>
            <div className="text-sm text-gray-400 flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>Processing scan patterns and security behavior</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <button
        onClick={() => setShowSelector(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl hover:border-purple-400/50 transition-all"
      >
        <span className="text-2xl">{currentPersona.badge}</span>
        <div className="text-left">
          <div className="text-xs text-purple-300">Your Role</div>
          <div className="text-sm font-semibold text-white">{currentPersona.name}</div>
        </div>
      </button>
    )
  }

  return (
    <>
      {/* Main Widget */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 bg-gradient-to-br ${currentPersona.color} rounded-xl`}>
              <span className="text-3xl">{currentPersona.badge}</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white">{currentPersona.title}</h3>
                <SparklesIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-sm text-gray-400 mt-1">{currentPersona.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReanalyze}
              disabled={loading}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Re-analyze based on recent scans"
            >
              <ArrowPathIcon className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSelector(true)}
              className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
            >
              Change Role
            </button>
          </div>
        </div>

        {/* Traits */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Your Traits:</div>
          <div className="flex flex-wrap gap-2">
            {currentPersona.traits.map((trait, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-black/30 border border-gray-600/30 rounded-lg text-sm text-gray-300"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="bg-black/20 border border-cyan-500/20 rounded-xl p-4">
            <div className="text-sm font-semibold text-cyan-400 mb-2 flex items-center space-x-2">
              <SparklesIcon className="w-4 h-4" />
              <span>AI Insights</span>
            </div>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Persona Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-white">Choose Your Security Role</h2>
                <p className="text-gray-400 text-sm mt-1">Select a role that matches your security style</p>
              </div>
              <button
                onClick={() => setShowSelector(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_PERSONAS.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona)}
                  className={`text-left p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    currentPersona?.id === persona.id
                      ? 'bg-gradient-to-br ' + persona.color + ' border-white/50'
                      : 'bg-gray-800/50 border-gray-600/30 hover:border-gray-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-4xl">{persona.badge}</span>
                    <div>
                      <h3 className="font-bold text-white">{persona.name}</h3>
                      <p className="text-xs text-gray-400">{persona.title}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-3">{persona.description}</p>

                  <div className="flex flex-wrap gap-1">
                    {persona.traits.slice(0, 3).map((trait, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-black/30 text-xs text-gray-300 rounded"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-gray-700 bg-gray-800/50">
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-yellow-400">💡 Tip:</span> Your role is analyzed
                based on your scan patterns. It helps tailor recommendations to your security approach.
                You can change it anytime!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
