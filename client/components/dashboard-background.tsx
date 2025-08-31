'use client'

import { useEffect, useRef } from 'react'

export function DashboardBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Binary rain particles (like main background)
    const binaryRain: Array<{
      x: number
      y: number
      speed: number
      char: string
      opacity: number
    }> = []

    // Floating data particles (like main background)
    const dataParticles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      color: string
    }> = []

    // Circuit paths
    const circuitPaths: Array<{
      points: Array<{x: number, y: number}>
      progress: number
      speed: number
      color: string
    }> = []

    const createBinaryRain = () => {
      binaryRain.length = 0
      for (let i = 0; i < 80; i++) {
        binaryRain.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 1.5,
          char: Math.random() > 0.5 ? '1' : '0',
          opacity: 0.2 + Math.random() * 0.4
        })
      }
    }

    const createDataParticles = () => {
      dataParticles.length = 0
      const colors = [
        'rgba(59, 130, 246, 0.6)',   // Blue
        'rgba(14, 165, 233, 0.6)',   // Sky blue  
        'rgba(6, 182, 212, 0.2)',    // Cyan
        'rgba(29, 78, 216, 0.6)',    // Indigo
      ]
      
      for (let i = 0; i < 50; i++) {
        dataParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.4,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }

    const createCircuitPaths = () => {
      circuitPaths.length = 0
      
      // Create circuit-like paths
      const paths = [
        [
          {x: 0, y: canvas.height * 0.3},
          {x: canvas.width * 0.2, y: canvas.height * 0.3},
          {x: canvas.width * 0.2, y: canvas.height * 0.1},
          {x: canvas.width * 0.5, y: canvas.height * 0.1},
          {x: canvas.width * 0.5, y: canvas.height * 0.4},
          {x: canvas.width, y: canvas.height * 0.4}
        ],
        [
          {x: canvas.width * 0.1, y: 0},
          {x: canvas.width * 0.1, y: canvas.height * 0.2},
          {x: canvas.width * 0.4, y: canvas.height * 0.2},
          {x: canvas.width * 0.4, y: canvas.height * 0.6},
          {x: canvas.width * 0.7, y: canvas.height * 0.6},
          {x: canvas.width * 0.7, y: canvas.height}
        ],
        [
          {x: canvas.width, y: canvas.height * 0.15},
          {x: canvas.width * 0.8, y: canvas.height * 0.15},
          {x: canvas.width * 0.8, y: canvas.height * 0.35},
          {x: canvas.width * 0.3, y: canvas.height * 0.35},
          {x: canvas.width * 0.3, y: canvas.height * 0.8},
          {x: 0, y: canvas.height * 0.8}
        ]
      ]

      paths.forEach(points => {
        circuitPaths.push({
          points,
          progress: 0,
          speed: 0.003 + Math.random() * 0.007,
          color: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(6, 182, 212, 0.2)',
            'rgba(14, 165, 233, 0.8)'
          ][Math.floor(Math.random() * 3)]
        })
      })
    }

    const drawBinaryRain = () => {
      binaryRain.forEach(drop => {
        drop.y += drop.speed
        
        if (drop.y > canvas.height) {
          drop.y = -20
          drop.x = Math.random() * canvas.width
        }

        const pulse = 0.5 + 0.5 * Math.sin(time * 3 + drop.x * 0.01)
        
        ctx.save()
        ctx.fillStyle = `rgba(59, 130, 246, ${drop.opacity * pulse})`
        ctx.font = '12px monospace'
        ctx.fillText(drop.char, drop.x, drop.y)
        ctx.restore()
      })
    }

    const drawDataParticles = () => {
      dataParticles.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        const pulse = 0.6 + 0.4 * Math.sin(time * 2 + particle.x * 0.01)
        
        ctx.save()
        ctx.fillStyle = particle.color.replace('0.6', (particle.opacity * pulse).toString())
        ctx.shadowColor = particle.color
        ctx.shadowBlur = 8 * pulse
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
    }

    const drawCircuitPaths = () => {
      circuitPaths.forEach(path => {
        path.progress += path.speed
        if (path.progress > 1) path.progress = 0

        // Draw static path
        ctx.save()
        ctx.strokeStyle = path.color.replace('0.8', '0.15')
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < path.points.length; i++) {
          const point = path.points[i]
          if (i === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        }
        ctx.stroke()

        // Draw moving pulse
        const totalPoints = path.points.length - 1
        const currentIndex = Math.floor(path.progress * totalPoints)
        const nextIndex = Math.min(currentIndex + 1, totalPoints)
        const localProgress = (path.progress * totalPoints) - currentIndex

        if (currentIndex < path.points.length - 1) {
          const current = path.points[currentIndex]
          const next = path.points[nextIndex]
          
          const pulseX = current.x + (next.x - current.x) * localProgress
          const pulseY = current.y + (next.y - current.y) * localProgress

          ctx.fillStyle = path.color
          ctx.shadowColor = path.color
          ctx.shadowBlur = 15
          ctx.beginPath()
          ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })
    }

    const drawScanningEffect = () => {
      // Horizontal scan line
      const scanY = (Math.sin(time * 0.5) * 0.5 + 0.5) * canvas.height
      
      ctx.save()
      const gradient = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30)
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0)')
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)')
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, scanY - 30, canvas.width, 60)
      
      // Scan line
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'
      ctx.lineWidth = 1
      ctx.shadowColor = 'rgba(6, 182, 212, 0.2)'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(canvas.width, scanY)
      ctx.stroke()
      ctx.restore()
    }

    const animate = () => {
      // Clear with subtle background
      ctx.fillStyle = 'rgba(17, 24, 39, 0.03)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      time += 0.016

      drawBinaryRain()
      drawDataParticles()
      drawCircuitPaths()
      drawScanningEffect()

      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createBinaryRain()
    createDataParticles()
    createCircuitPaths()
    animate()

    window.addEventListener('resize', () => {
      resizeCanvas()
      createBinaryRain()
      createDataParticles() 
      createCircuitPaths()
    })

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
    />
  )
}