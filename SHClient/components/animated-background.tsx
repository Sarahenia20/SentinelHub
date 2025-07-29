'use client'
import { useEffect, useState } from 'react'

export default function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false)
  const [animationData, setAnimationData] = useState({
    binaryRain: [] as Array<{left: number, delay: number, duration: number, char: string}>,
    secondaryBinary: [] as Array<{left: number, delay: number, duration: number, char: string}>,
    dataParticles: [] as Array<{left: number, top: number, delay: number, duration: number}>,
    secondaryParticles: [] as Array<{left: number, top: number, delay: number, duration: number}>,
    codeBlocks: [] as Array<{left: number, delay: number, duration: number, code: string}>
  })

  useEffect(() => {
    setIsClient(true)
    
    // Generate all random values on client side only
    setAnimationData({
      binaryRain: Array.from({ length: 100 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 6 + Math.random() * 3,
        char: Math.random() > 0.5 ? '1' : '0'
      })),
      secondaryBinary: Array.from({ length: 80 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 8 + Math.random() * 4,
        char: Math.random() > 0.3 ? '101' : '010'
      })),
      dataParticles: Array.from({ length: 60 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 12 + Math.random() * 8
      })),
      secondaryParticles: Array.from({ length: 40 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 10
      })),
      codeBlocks: Array.from({ length: 15 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 5,
        code: `{${Math.floor(Math.random() * 999)}: "SEC"}`
      }))
    })
  }, [])

  // Don't render the animated elements on server to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        {/* Static background elements only */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-blue-900/5"></div>
        <div className="absolute inset-0 bg-hex-pattern opacity-8"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-6"></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* DOUBLE Binary rain effect - ALL BLUES */}
      <div className="absolute inset-0">
        {animationData.binaryRain.map((item, i) => (
          <div
            key={i}
            className="absolute text-blue-400/30 font-mono text-xs animate-binary-fall"
            style={{
              left: `${item.left}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`
            }}
          >
            {item.char}
          </div>
        ))}
        {/* Secondary binary layer */}
        {animationData.secondaryBinary.map((item, i) => (
          <div
            key={`sec-${i}`}
            className="absolute text-sky-400/20 font-mono text-sm animate-binary-fall"
            style={{
              left: `${item.left}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`
            }}
          >
            {item.char}
          </div>
        ))}
      </div>

      {/* Enhanced glowing circuit paths - ALL BLUES */}
      <svg className="absolute inset-0 w-full h-full opacity-40">
        <defs>
          <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7"/>
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.6"/>
            <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.5"/>
          </linearGradient>
          <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.5"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="intense-glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main circuit grid */}
        <g>
          <path d="M 0 200 L 200 200 L 200 100 L 400 100 L 400 300 L 600 300 L 600 150 L 800 150" stroke="url(#circuit-gradient)" strokeWidth="2" fill="none" filter="url(#glow)" className="animate-pulse"/>
          <path d="M 100 0 L 100 150 L 300 150 L 300 250 L 500 250 L 500 400 L 700 400" stroke="url(#circuit-gradient)" strokeWidth="1.5" fill="none" filter="url(#glow)" className="animate-pulse delay-1000"/>
          <path d="M 800 100 L 600 100 L 600 200 L 400 200 L 400 350 L 200 350 L 200 500" stroke="url(#circuit-gradient)" strokeWidth="1.5" fill="none" filter="url(#glow)" className="animate-pulse delay-2000"/>
          <path d="M 50 300 L 250 300 L 250 50 L 450 50 L 450 400 L 650 400 L 650 200 L 850 200" stroke="url(#circuit-gradient)" strokeWidth="2" fill="none" filter="url(#glow)" className="animate-pulse delay-3000"/>
        </g>

        {/* Sniper crosshair scanning lines - BLUE */}
        <g>
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#pulse-gradient)" strokeWidth="1" filter="url(#intense-glow)" className="animate-pulse delay-500"/>
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="url(#pulse-gradient)" strokeWidth="1" filter="url(#intense-glow)" className="animate-pulse delay-1500"/>
        </g>
        
        {/* Enhanced circuit nodes - ALL BLUES */}
        <g>
          <circle cx="200" cy="200" r="4" fill="#3b82f6" filter="url(#intense-glow)" className="animate-ping"/>
          <circle cx="400" cy="100" r="4" fill="#1d4ed8" filter="url(#intense-glow)" className="animate-ping delay-500"/>
          <circle cx="600" cy="300" r="4" fill="#0ea5e9" filter="url(#intense-glow)" className="animate-ping delay-1000"/>
          <circle cx="300" cy="150" r="3" fill="#06b6d4" filter="url(#glow)" className="animate-ping delay-1500"/>
          <circle cx="500" cy="250" r="3" fill="#0284c7" filter="url(#glow)" className="animate-ping delay-2000"/>
          <circle cx="400" cy="200" r="5" fill="#1e40af" filter="url(#intense-glow)" className="animate-ping delay-2500"/>
        </g>

        {/* Data pulse streams - BLUE */}
        <g>
          <circle r="2" fill="url(#circuit-gradient)" filter="url(#glow)">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 0 200 L 200 200 L 200 100 L 400 100 L 400 300 L 600 300"/>
          </circle>
          <circle r="1.5" fill="url(#pulse-gradient)" filter="url(#glow)">
            <animateMotion dur="6s" repeatCount="indefinite" path="M 100 0 L 100 150 L 300 150 L 300 250 L 500 250 L 500 400"/>
          </circle>
          <circle r="3" fill="#06b6d4" filter="url(#intense-glow)">
            <animateMotion dur="5s" repeatCount="indefinite" path="M 800 100 L 600 100 L 600 200 L 400 200 L 400 350 L 200 350"/>
          </circle>
        </g>
      </svg>

      {/* DOUBLE floating data particles - ALL BLUES */}
      <div className="absolute inset-0">
        {animationData.dataParticles.map((item, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/50 rounded-full animate-float-data glow-blue"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`
            }}
          />
        ))}
        {/* Secondary particle layer */}
        {animationData.secondaryParticles.map((item, i) => (
          <div
            key={`sec-${i}`}
            className="absolute w-1.5 h-1.5 bg-sky-400/40 rounded-full animate-float-data glow-cyan"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`
            }}
          />
        ))}
      </div>

      {/* Enhanced scanning lines - ALL BLUES */}
      <div className="absolute inset-0">
        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent animate-scan-vertical glow-blue"/>
        <div className="absolute h-full w-1 bg-gradient-to-b from-transparent via-sky-500/60 to-transparent animate-scan-horizontal glow-cyan"/>
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent animate-scan-vertical delay-2000"/>
        <div className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-blue-600/40 to-transparent animate-scan-horizontal delay-3000"/>
      </div>

      {/* Radar sweep effect - BLUE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-96 h-96 border border-blue-400/20 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-sky-400/30 rounded-full animate-ping delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-cyan-400/40 rounded-full animate-ping delay-2000"></div>
      </div>

      {/* Matrix-style code blocks - BLUE */}
      <div className="absolute inset-0">
        {animationData.codeBlocks.map((item, i) => (
          <div
            key={i}
            className="absolute text-blue-400/20 font-mono text-xs animate-binary-fall"
            style={{
              left: `${item.left}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`
            }}
          >
            {item.code}
          </div>
        ))}
      </div>

      {/* Enhanced grid patterns */}
      <div className="absolute inset-0 bg-hex-pattern opacity-8"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-6"></div>
      
      {/* ALL BLUE glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse-slow glow-blue"></div>
      <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse-slow delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-cyan-500/15 rounded-full blur-xl animate-pulse-slow delay-4000 glow-cyan"></div>
      <div className="absolute top-1/2 right-1/3 w-56 h-56 bg-sky-500/10 rounded-full blur-2xl animate-pulse-slow delay-1000"></div>
      <div className="absolute bottom-1/3 right-1/2 w-40 h-40 bg-blue-600/12 rounded-full blur-xl animate-pulse-slow delay-3000"></div>
      <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-blue-400/8 rounded-full blur-3xl animate-pulse-slow delay-5000"></div>

      {/* Target acquisition overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-blue-900/5"></div>
    </div>
  )
}