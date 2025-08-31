'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import Image from "next/image"
import AnimatedBackground from "@/components/animated-background"

export default function SSOCallback() {
  const { isLoaded, userId, signOut } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Completing authentication...')
  const [isNewUser, setIsNewUser] = useState(false)
  const [countdown, setCountdown] = useState(15)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    console.log(`[SSO Debug] ${info}`)
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`])
  }

  useEffect(() => {
    if (!isLoaded) {
      addDebugInfo('Clerk not loaded yet, waiting...')
      return
    }

    const handleAuth = async () => {
      try {
        addDebugInfo('Starting authentication process')
        
        // Timeout handling for slow responses
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout - process took too long')), 20000)
        )

        // Check for error in URL params first
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          addDebugInfo(`Error in URL params: ${error}`)
          throw new Error(errorDescription || `Authentication failed: ${error}`)
        }

        await Promise.race([
          new Promise(resolve => {
            let attempts = 0
            const maxAttempts = 40 // 20 seconds with 500ms intervals
            
            const checkUser = () => {
              attempts++
              addDebugInfo(`Checking user state (attempt ${attempts}/${maxAttempts})`)
              
              if (userId && user) {
                addDebugInfo('User data found successfully')
                
                // Check if this is a new user
                const userCreatedAt = user.createdAt ? new Date(user.createdAt) : null
                const now = new Date()
                
                if (userCreatedAt) {
                  const timeDiff = now.getTime() - userCreatedAt.getTime()
                  const isRecentlyCreated = timeDiff < 300000 // 5 minutes
                  setIsNewUser(isRecentlyCreated)
                  addDebugInfo(`User created: ${userCreatedAt.toISOString()}, New user: ${isRecentlyCreated}`)
                } else {
                  addDebugInfo('Could not determine user creation time')
                }

                setStatus('success')
                
                if (isNewUser) {
                  setMessage('Welcome to SentinelHub! Setting up your account...')
                  addDebugInfo('Redirecting new user to dashboard in 2s')
                  setTimeout(() => router.push('/dashboard'), 2000)
                } else {
                  setMessage('Welcome back! Redirecting to dashboard...')
                  addDebugInfo('Redirecting returning user to dashboard in 1.5s')
                  setTimeout(() => router.push('/dashboard'), 1500)
                }
                resolve(true)
              } else if (attempts >= maxAttempts) {
                addDebugInfo('Max attempts reached, authentication failed')
                throw new Error('Authentication timeout - user data not received')
              } else {
                // Log current state for debugging
                addDebugInfo(`Current state - userId: ${!!userId}, user: ${!!user}`)
                setTimeout(checkUser, 500)
              }
            }
            checkUser()
          }),
          timeoutPromise
        ])

      } catch (error: any) {
        console.error('SSO callback error:', error)
        addDebugInfo(`Error occurred: ${error.message}`)
        setStatus('error')
        
        if (error.message.includes('timeout')) {
          setMessage('Authentication is taking longer than expected. This might be due to network issues or a slow connection.')
        } else if (error.message.includes('access_denied')) {
          setMessage('Access was denied. You may have cancelled the authentication process.')
        } else if (error.message.includes('invalid_request')) {
          setMessage('Invalid authentication request. Please try signing in again.')
        } else {
          setMessage(`Authentication failed: ${error.message || 'Unknown error occurred'}`)
        }
        
        // Start countdown for redirect
        startErrorCountdown()
      }
    }

    const startErrorCountdown = () => {
      addDebugInfo('Starting error countdown')
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            addDebugInfo('Redirecting to sign in page')
            router.push('/signin?error=sso_failed')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    // Start auth process with a small delay to allow page to stabilize
    const timer = setTimeout(handleAuth, 1000)
    return () => clearTimeout(timer)
  }, [isLoaded, userId, user, router, searchParams])

  // Emergency clear function for stuck states
  const handleEmergencyClear = async () => {
    try {
      addDebugInfo('Emergency clear initiated')
      setMessage('Clearing authentication state...')
      
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Force logout if possible
      if (signOut) {
        await signOut()
      }
      
      addDebugInfo('Emergency clear completed, redirecting')
      setTimeout(() => {
        window.location.href = '/signin'
      }, 1000)
    } catch (error) {
      console.error('Emergency clear failed:', error)
      window.location.href = '/signin'
    }
  }

  return (
    <div suppressHydrationWarning className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="absolute z-30 w-full top-8 md:top-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between md:h-20">
              <div className="mr-4 shrink-0">
                <Image
                  src="/images/logoSmall.png"
                  alt="SentinelHub Logo"
                  width={240}
                  height={80}
                  priority
                  className="animate-bounce-in"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML = '<div class="text-2xl font-bold text-white">SentinelHub</div>'
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex grow min-h-screen">
          <div className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/3" aria-hidden="true">
            <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-blue-500/30 via-blue-600/30 to-indigo-500/30 opacity-70 blur-[160px] animate-pulse-slow"></div>
          </div>

          <div className="w-full">
            <div className="flex h-full flex-col justify-center before:min-h-[4rem] before:flex-1 after:flex-1 md:before:min-h-[5rem]">
              <div className="px-4 sm:px-6">
                <div className="mx-auto w-full max-w-md">
                  <div className="py-16 md:py-20 animate-bounce-in-delayed backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-2xl">
                    
                    <div className="text-center">
                      {/* Status Icon */}
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
                        {status === 'loading' && (
                          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        
                        {status === 'success' && (
                          <div className="bg-green-500/20 rounded-full p-4">
                            <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        {status === 'error' && (
                          <div className="bg-red-500/20 rounded-full p-4">
                            <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                        {status === 'loading' && 'Authenticating...'}
                        {status === 'success' && (isNewUser ? 'Welcome to SentinelHub!' : 'Welcome back!')}
                        {status === 'error' && 'Authentication Failed'}
                      </h1>

                      {/* Message */}
                      <p className="text-gray-400 mb-6">
                        {message}
                      </p>

                      {/* User Info for Success State */}
                      {status === 'success' && user && (
                        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center justify-center space-x-3">
                            {user.imageUrl && (
                              <Image
                                src={user.imageUrl}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            )}
                            <div className="text-left">
                              <p className="text-white font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Loading Animation */}
                      {status === 'loading' && (
                        <div className="space-y-4">
                          <div className="flex justify-center space-x-1">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                          </div>
                          <p className="text-xs text-gray-500">
                            This may take a few moments...
                          </p>
                          
                          {/* Debug info - only show if taking too long */}
                          {debugInfo.length > 0 && (
                            <details className="mt-4 text-left">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                                Show Debug Information
                              </summary>
                              <div className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-400 font-mono">
                                {debugInfo.map((info, index) => (
                                  <div key={index}>{info}</div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}

                      {/* Error State - Manual Navigation */}
                      {status === 'error' && (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-400 mb-4">
                            Redirecting to sign in in {countdown} seconds...
                          </div>
                          
                          <div className="space-y-3">
                            <button
                              onClick={() => router.push('/signin')}
                              className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200"
                            >
                              Go to Sign In Now
                            </button>
                            <button
                              onClick={() => router.push('/signup')}
                              className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-200"
                            >
                              Create New Account
                            </button>
                            <button
                              onClick={handleEmergencyClear}
                              className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl border border-red-500/30 transition-all duration-200 text-sm"
                            >
                              Clear All Data & Start Over
                            </button>
                          </div>
                          
                          {/* Debug info for errors */}
                          {debugInfo.length > 0 && (
                            <details className="mt-4 text-left">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                                Show Debug Information
                              </summary>
                              <div className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-400 font-mono max-h-32 overflow-y-auto">
                                {debugInfo.map((info, index) => (
                                  <div key={index}>{info}</div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}