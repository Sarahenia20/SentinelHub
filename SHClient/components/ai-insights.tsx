'use client'

import { useState, useEffect } from 'react'
import { 
  CpuChipIcon, 
  SparklesIcon,
  ArrowTrendingUpIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

export function AIInsights() {
  const [mounted, setMounted] = useState(false)
  const [animatedText, setAnimatedText] = useState('')

  const fullText = "AI Profile Analysis Coming Soon..."

  useEffect(() => {
    setMounted(true)
    let currentIndex = 0
    const timer = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setAnimatedText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(timer)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return (
      <div className="relative group h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-sm"></div>
        <div className="relative backdrop-blur-xl bg-gray-900/40 border border-purple-500/30 rounded-2xl p-6 h-full">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 shadow-xl hover:shadow-purple-500/10 hover:shadow-2xl h-[400px]">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
          <CpuChipIcon className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-gray-300 text-lg font-semibold">AI Security Insights</h3>
      </div>
        
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
              <SparklesIcon className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h4 className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
              {animatedText}
              <span className="animate-pulse">|</span>
            </h4>
            
            <p className="text-gray-400 text-xs max-w-xs">
              AI will analyze security patterns and provide personalized recommendations.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            <div className="p-2 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg border border-purple-500/20">
              <div className="flex items-center space-x-2">
                <LightBulbIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-300">Smart Tips</span>
              </div>
            </div>
            
            <div className="p-2 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg border border-purple-500/20">
              <div className="flex items-center space-x-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-300">Predictions</span>
              </div>
            </div>
          </div>
          
        </div>
    </div>
  )
}