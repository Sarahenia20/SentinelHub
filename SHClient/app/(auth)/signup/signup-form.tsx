'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import Image from "next/image"

export default function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    setTimeout(() => {
      setIsLoading(false)
      router.push('/signin')
    }, 2000)
  }

  const handleSocialSignup = (provider: string) => {
    setIsLoading(true)
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Create your account</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-cyan-400"
              htmlFor="name"
            >
              Full name
            </label>
            <input
              id="name"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="text"
              placeholder="John Doe"
              required
              disabled={isLoading}
            />
          </div>
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
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-cyan-400"
              htmlFor="phone"
            >
              Phone
            </label>
            <input
              id="phone"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="text"
              placeholder="(+1) 555-0123"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-cyan-400"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>

      {/* Social Login Buttons */}
      <div className="mt-6">
        <div className="flex space-x-3 justify-center">
          <button 
            type="button"
            onClick={() => handleSocialSignup('github')}
            disabled={isLoading}
            className="flex items-center justify-center w-12 h-12 bg-gray-900/80 hover:bg-gray-800 border border-cyan-500/20 rounded-xl transition-all duration-200 group disabled:opacity-50 shadow-lg hover:shadow-cyan-500/20"
          >
            <Image
              src="/images/logo-02.svg"
              alt="Sign up with GitHub"
              width={20}
              height={20}
              className="filter brightness-0 invert group-hover:scale-110 transition-transform duration-200"
            />
          </button>

          <button 
            type="button"
            onClick={() => handleSocialSignup('google')}
            disabled={isLoading}
            className="flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 border border-cyan-500/30 rounded-xl transition-all duration-200 group disabled:opacity-50 shadow-lg hover:shadow-cyan-500/20"
          >
            <Image
              src="/images/logo-03.svg"
              alt="Sign up with Google"
              width={20}
              height={20}
              className="group-hover:scale-110 transition-transform duration-200"
            />
          </button>
        </div>
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm text-gray-400">
          By signing up, you agree to the{" "}
          <Link
            className="whitespace-nowrap font-medium text-cyan-400 hover:text-cyan-300"
            href="/terms"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            className="whitespace-nowrap font-medium text-cyan-400 hover:text-cyan-300"
            href="/privacy"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            className="text-cyan-400 hover:text-cyan-300 font-medium"
            href="/signin"
          >
            Sign in
          </Link>
        </span>
      </div>
    </>
  )
}