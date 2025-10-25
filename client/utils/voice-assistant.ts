/**
 * FREE Voice Assistant Service
 * Uses browser's built-in Web Speech API - NO API KEYS NEEDED!
 * Fast, efficient, and completely free
 */

export class VoiceAssistant {
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isPlaying: boolean = false

  /**
   * Convert text to speech and play it (FREE!)
   */
  async speak(text: string, options: {
    rate?: number
    pitch?: number
    volume?: number
    voice?: string
  } = {}): Promise<void> {
    // Check browser support
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser')
      return
    }

    try {
      // Stop any currently playing audio
      this.stop()

      const {
        rate = 0.95,      // Slightly slower for clarity
        pitch = 1.0,      // Normal pitch
        volume = 1.0,     // Full volume
        voice = undefined // Auto-select best voice
      } = options

      this.currentUtterance = new SpeechSynthesisUtterance(this.cleanText(text))
      this.currentUtterance.rate = rate
      this.currentUtterance.pitch = pitch
      this.currentUtterance.volume = volume

      // Try to use a high-quality English voice
      if (voice) {
        const voices = window.speechSynthesis.getVoices()
        const selectedVoice = voices.find(v => v.name.includes(voice))
        if (selectedVoice) {
          this.currentUtterance.voice = selectedVoice
        }
      } else {
        // Auto-select best English voice
        const voices = window.speechSynthesis.getVoices()
        const englishVoice = voices.find(v =>
          v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))
        ) || voices.find(v => v.lang.startsWith('en'))

        if (englishVoice) {
          this.currentUtterance.voice = englishVoice
        }
      }

      this.currentUtterance.onstart = () => {
        this.isPlaying = true
      }

      this.currentUtterance.onend = () => {
        this.isPlaying = false
        this.currentUtterance = null
      }

      this.currentUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        this.isPlaying = false
        this.currentUtterance = null
      }

      window.speechSynthesis.speak(this.currentUtterance)
      this.isPlaying = true

    } catch (error) {
      console.error('Voice assistant error:', error)
      this.isPlaying = false
    }
  }

  /**
   * Read security scan summary
   */
  async readScanSummary(summary: {
    riskLevel: string
    securityScore: number
    critical?: number
    high?: number
    medium?: number
    low?: number
  }): Promise<void> {
    const text = `Security scan complete. Risk level: ${summary.riskLevel}. Security score: ${summary.securityScore} out of 100.
    ${summary.critical ? `Found ${summary.critical} critical issues. ` : ''}
    ${summary.high ? `${summary.high} high severity issues. ` : ''}
    ${summary.medium ? `${summary.medium} medium issues. ` : ''}
    ${summary.low ? `And ${summary.low} low severity issues. ` : ''}
    ${summary.securityScore >= 80 ? 'Your code security is in good standing.' : summary.securityScore >= 60 ? 'Immediate attention recommended for high priority items.' : 'Critical remediation required immediately.'}`

    await this.speak(text)
  }

  /**
   * Read vulnerability finding
   */
  async readVulnerability(vuln: {
    type: string
    title: string
    severity: string
    file?: string
    line?: number
  }): Promise<void> {
    const text = `${vuln.severity} severity vulnerability detected. ${vuln.title}.
    ${vuln.file ? `Found in file ${vuln.file}` : ''}
    ${vuln.line ? ` at line ${vuln.line}` : ''}.
    Immediate remediation recommended.`

    await this.speak(text)
  }

  /**
   * Read dashboard greeting
   */
  async readDashboardGreeting(greeting: string): Promise<void> {
    // Clean markdown and formatting
    const cleanText = greeting
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italics
      .replace(/[🛡️🕵️💪🥷🧙]/g, '') // Remove emojis
      .trim()

    await this.speak(cleanText)
  }

  /**
   * Read quick security tip
   */
  async readSecurityTip(tip: string): Promise<void> {
    await this.speak(`Security tip: ${tip}`)
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    this.currentUtterance = null
    this.isPlaying = false
  }

  /**
   * Pause current playback
   */
  pause(): void {
    if ('speechSynthesis' in window && this.isPlaying) {
      window.speechSynthesis.pause()
    }
  }

  /**
   * Resume paused playback
   */
  resume(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return window.speechSynthesis.getVoices()
    }
    return []
  }

  /**
   * Clean text for better speech output
   */
  private cleanText(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert markdown links
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italics
      .replace(/━+/g, '') // Remove decorative lines
      .replace(/[•▪▫■□]/g, '') // Remove bullets
      .replace(/[🛡️🕵️💪🥷🧙✅❌⚠️🔍📊💬🎯⚡🔧]/g, '') // Remove emojis
      .replace(/\n{3,}/g, '. ') // Convert line breaks to pauses
      .replace(/\n/g, '. ') // Convert all line breaks
      .replace(/\s{2,}/g, ' ') // Normalize spaces
      .trim()
  }
}

// Singleton instance
export const voiceAssistant = new VoiceAssistant()
