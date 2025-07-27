'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import Image from "next/image"
import AnimatedBackground from "@/components/animated-background"

export default function SSOCallback() {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Completing authentication...')
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    const handleAuth = async () => {
      try {
        if (userId && user) {
          // Check if this is a new user (just created)
          const userCreatedAt = user.createdAt ? new Date(user.createdAt) : new Date(0)
          const now = new Date()
          const timeDiff = now.getTime() - userCreatedAt.getTime()
          const isRecentlyCreated = timeDiff < 60000 // Less than 1 minute ago

          setIsNewUser(isRecentlyCreated)
          setStatus('success')
          
          if (isRecentlyCreated) {
            setMessage('Account created successfully! Redirecting to onboarding...')
            setTimeout(() => router.push('/onboarding'), 2000)
          } else {
            setMessage('Welcome back! Redirecting to dashboard...')
            setTimeout(() => router.push('/dashboard'), 2000)
          }
        } else {
          // No user found, likely an error
          setStatus('error')
          setMessage('Authentication failed. Redirecting to sign in...')
          setTimeout(() => router.push('/signin'), 3000)
        }
      } catch (error) {
        console.error('SSO callback error:', error)
        setStatus('error')
        setMessage('Something went wrong. Redirecting to sign in...')
        setTimeout(() => router.push('/signin'), 3000)
      }
    }

    // Add a small delay to prevent flash
    const timer = setTimeout(handleAuth, 1000)
    return () => clearTimeout(timer)
  }, [isLoaded, userId, user, router])

  return (
    <div suppressHydrationWarning className="relative min-h-screen">
      {/* Full-screen animated background from auth layout */}
      <AnimatedBackground />
      
      {/* Content wrapper with higher z-index */}
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
                />
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex grow min-h-screen">
          <div
            className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/3"
            aria-hidden="true"
          >
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
                                {user.primaryEmailAddress?.emailAddress}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Loading Dots Animation */}
                      {status === 'loading' && (
                        <div className="flex justify-center space-x-1">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                        </div>
                      )}

                      {/* Error State - Manual Navigation */}
                      {status === 'error' && (
                        <div className="space-y-3">
                          <button
                            onClick={() => router.push('/signin')}
                            className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200"
                          >
                            Go to Sign In
                          </button>
                          <button
                            onClick={() => router.push('/signup')}
                            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-200"
                          >
                            Create Account
                          </button>
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