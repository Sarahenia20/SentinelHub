"use client"

import { useState, useEffect, useRef } from 'react'

interface CodeHighlighterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
}

export function CodeHighlighter({ value, onChange, placeholder = '', height = '300px' }: CodeHighlighterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [highlightedCode, setHighlightedCode] = useState('')

  // Simple syntax highlighting for JavaScript/security patterns
  const highlightCode = (code: string) => {
    return code
      // Keywords
      .replace(/\b(function|const|let|var|if|else|for|while|return|class|import|export|async|await|try|catch|throw)\b/g, '<span class="text-blue-400">$1</span>')
      // Strings
      .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
      // Comments
      .replace(/\/\/.*$/gm, '<span class="text-gray-500">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="text-gray-500">$&</span>')
      // Numbers
      .replace(/\b\d+(\.\d+)?\b/g, '<span class="text-cyan-400">$&</span>')
      // Security-sensitive patterns
      .replace(/\b(password|token|key|secret|auth|api[-_]?key|private[-_]?key)\b/gi, '<span class="text-red-400 font-bold">$&</span>')
      // SQL injection patterns
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|ORDER BY|GROUP BY)\b/gi, '<span class="text-yellow-400">$&</span>')
      // XSS patterns
      .replace(/\b(innerHTML|outerHTML|document\.write|eval)\b/g, '<span class="text-orange-400">$&</span>')
      // Operators
      .replace(/[+\-*/=<>!&|]+/g, '<span class="text-purple-400">$&</span>')
  }

  useEffect(() => {
    if (value) {
      const highlighted = highlightCode(value)
      setHighlightedCode(highlighted)
    } else {
      setHighlightedCode('')
    }
  }, [value])

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="relative">
      {/* Terminal-style header */}
      <div className="flex items-center justify-between bg-gray-800/60 px-4 py-2 border-b border-cyan-500/20 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-mono text-cyan-400">Code Editor with Security Highlighting</div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      
      {/* Code editor container */}
      <div className="relative border border-gray-600/50 border-t-0 rounded-b-xl overflow-hidden">
        {/* Syntax highlighting layer */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-4 font-mono text-sm text-transparent pointer-events-none overflow-auto whitespace-pre-wrap break-words"
          style={{ 
            background: 'rgba(17, 24, 39, 0.8)',
            height,
            lineHeight: '1.5'
          }}
          dangerouslySetInnerHTML={{ __html: highlightedCode || placeholder }}
        />
        
        {/* Textarea for input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onScroll={handleScroll}
          placeholder={placeholder}
          className="relative w-full h-full bg-transparent border-0 p-4 text-white font-mono text-sm placeholder-gray-500 focus:outline-none resize-none overflow-auto whitespace-pre-wrap break-words"
          style={{ 
            height,
            lineHeight: '1.5',
            color: value ? 'transparent' : 'rgb(156, 163, 175)' // Show placeholder color when empty
          }}
          spellCheck={false}
        />
        
        {/* Overlay for security warnings */}
        {value && (value.toLowerCase().includes('password') || value.toLowerCase().includes('api') || value.toLowerCase().includes('key')) && (
          <div className="absolute top-2 right-2 bg-red-900/80 border border-red-500/50 rounded-lg px-2 py-1">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-300">Security Alert</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}