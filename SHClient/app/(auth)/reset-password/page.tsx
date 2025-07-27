'use client'
import { useState, useEffect } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from "next/link"

export default function ResetPasswordForm() {
  const { isLoaded, signIn } = useSignIn()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email')

  useEffect(() => {
    // Pre-fill email if passed from sign-in page
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !email) return
    
    setIsLoading(true)
    
    try {
      await signIn.create({
        identifier: email,
      })
      
      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: signIn.supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code"
        )?.emailAddressId || "",
      })
      
      setStep('code')
    } catch (err: any) {
      console.error("Error:", err.errors?.[0]?.longMessage || err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !code || !newPassword) return
    
    setIsLoading(true)
    
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      })
      
      if (result.status === "complete") {
        setStep('success')
        setTimeout(() => {
          router.push('/signin')
        }, 3000)
      }
    } catch (err: any) {
      console.error("Error:", err.errors?.[0]?.longMessage || err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (step === 'success') {
    return (
      <>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">Password reset!</h1>
          <p className="text-gray-400">
            Your password has been successfully reset. Redirecting to sign in...
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            className="text-cyan-400 hover:text-cyan-300 font-medium"
            href="/signin"
          >
            Continue to sign in →
          </Link>
        </div>
      </>
    )
  }

  // Code verification step
  if (step === 'code') {
    return (
      <>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
            <svg className="h-8 w-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">Check your email</h1>
          <p className="text-gray-400">
            We've sent a password reset code to {email}
          </p>
        </div>

        <form onSubmit={handleCodeSubmit}>
          <div className="space-y-4">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-cyan-400"
                htmlFor="code"
              >
                Reset Code
              </label>
              <input
                id="code"
                className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-cyan-400"
                htmlFor="newPassword"
              >
                New Password
              </label>
              <input
                id="newPassword"
                className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              type="submit"
              disabled={isLoading}
              className="btn w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setStep('email')}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            ← Back to email
          </button>
        </div>
      </>
    )
  }

  // Email input step (default)
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Reset password</h1>
        <p className="text-gray-400 mt-2">
          Enter your email address and we'll send you a code to reset your password.
        </p>
      </div>

      <form onSubmit={handleEmailSubmit}>
        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-cyan-400"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="email"
              placeholder="user@sentinelhub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button 
            type="submit"
            disabled={isLoading || !isLoaded}
            className="btn w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending reset code...
              </>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <Link
          className="text-cyan-400 hover:text-cyan-300 font-medium"
          href="/signin"
        >
          ← Back to sign in
        </Link>
      </div>
    </>
  )
}