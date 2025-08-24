'use client';

import { useState, useEffect } from 'react';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { userId } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/dashboard');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Already Signed In</h2>
          <p className="text-gray-400 mb-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      const signupData = {
        firstName: formData.name.split(' ')[0] || formData.name,
        lastName: formData.name.split(' ').slice(1).join(' ') || '',
        emailAddress: formData.email,
        password: formData.password,
        ...(formData.phone && formData.phone.trim() ? { phoneNumber: formData.phone } : {}),
      };

      await signUp.create(signupData);
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId }); // Activate session
        router.push('/dashboard'); // Direct redirect
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'oauth_github' | 'oauth_google') => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard'
      });
    } catch (error: any) {
      setError(error.errors?.[0]?.longMessage || error.message || 'Social sign up failed');
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
            <svg className="h-8 w-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">Check your email</h1>
          <p className="text-gray-400 mb-2">We've sent a verification code to <span className="text-cyan-400">{formData.email}</span></p>
          <p className="text-sm text-gray-500">After verification, you'll be redirected to dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={onPressVerify} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-cyan-400" htmlFor="code">Verification Code</label>
            <input
              id="code"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              disabled={isLoading}
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="btn w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify Email & Complete Signup'
            )}
          </button>
          <div className="pt-4 text-center border-t border-gray-700">
            <button
              type="button"
              onClick={() => setPendingVerification(false)}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              ← Back to sign up
            </button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Create your account</h1>
        <p className="text-gray-400 mt-2">Join SentinelHub and start your DevSecOps journey.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-cyan-400" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-cyan-400" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="email"
              placeholder="user@sentinelhub.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-cyan-400" htmlFor="phone">
              Phone number <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              id="phone"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-cyan-400" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">Use a strong, unique password (avoid common passwords)</p>
          </div>

          <div id="clerk-captcha" className="mt-4"></div>
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-900/50 px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 flex space-x-3 justify-center">
          <button
            type="button"
            onClick={() => handleSocialSignup('oauth_github')}
            disabled={isLoading}
            className="flex items-center justify-center w-12 h-12 bg-gray-900/80 hover:bg-gray-800 border border-cyan-500/20 rounded-xl transition-all duration-200 group disabled:opacity-50 shadow-lg hover:shadow-cyan-500/20"
          >
            <Image
              src="/images/logo-02.svg"
              alt="Sign up with GitHub"
              width={20}
              height={20}
              className="filter brightness-0 invert group-hover:scale-110 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-white text-xs">GH</span>';
                }
              }}
            />
          </button>

          <button
            type="button"
            onClick={() => handleSocialSignup('oauth_google')}
            disabled={isLoading}
            className="flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 border border-cyan-500/30 rounded-xl transition-all duration-200 group disabled:opacity-50 shadow-lg hover:shadow-cyan-500/20"
          >
            <Image
              src="/images/logo-03.svg"
              alt="Sign up with Google"
              width={20}
              height={20}
              className="group-hover:scale-110 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-white text-xs">G</span>';
                }
              }}
            />
          </button>
        </div>
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm text-gray-400">
          By signing up, you agree to the{' '}
          <Link
            className="whitespace-nowrap font-medium text-cyan-400 hover:text-cyan-300"
            href="/terms"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
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
          Already have an account?{' '}
          <Link className="text-cyan-400 hover:text-cyan-300 font-medium" href="/signin">
            Sign in
          </Link>
        </span>
      </div>
    </>
  );
}