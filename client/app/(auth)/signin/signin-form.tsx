'use client';

import { useState, useEffect } from 'react';
import { useSignIn, useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (isLoaded && userId) {
      const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
      // Use startTransition to defer navigation
      router.prefetch(redirectUrl); // Preload to improve performance
      router.push(redirectUrl);
    }

    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [searchParams, isLoaded, userId, router]);

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

  // No need for userId check here since useEffect handles redirection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
        router.push(redirectUrl);
      } else if (result.status === "needs_second_factor") {
        router.push('/verify');
      } else {
        setError('Authentication incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      let errorMessage = 'Invalid email or password';
      if (err.errors?.[0]?.code === 'session_exists') {
        errorMessage = 'You are already signed in.';
        const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
        router.push(redirectUrl); // Force redirect
      } else if (err.errors?.[0]?.longMessage) {
        errorMessage = err.errors[0].longMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'oauth_github' | 'oauth_google') => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard'
      });
    } catch (error: any) {
      console.error('Social login error:', error);
      const errorMessage = error.errors?.[0]?.longMessage || error.message || 'Social login failed';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!isLoaded || !formData.email) {
      setError('Please enter your email address first');
      return;
    }

    setError('');

    try {
      await signIn.create({
        identifier: formData.email,
      });

      const firstFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === "reset_password_email_code"
      );

      if (firstFactor) {
        await signIn.prepareFirstFactor({
          strategy: "reset_password_email_code",
          emailAddressId: firstFactor.emailAddressId,
        });

        router.push(`/reset-password?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError('Password reset not available for this account');
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || 'Unable to send reset email';
      setError(errorMessage);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Welcome back</h1>
        <p className="text-gray-400 mt-2">Sign in to your SentinelHub account</p>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-400 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

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
            <label className="mb-2 block text-sm font-medium text-cyan-400" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="form-input w-full py-3 px-4 bg-gray-800/80 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-lg shadow-cyan-500/10"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-cyan-500/30 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
              Remember me
            </label>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            disabled={isLoading}
          >
            Forgot password?
          </button>
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
                Signing in...
              </>
            ) : (
              'Sign In'
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
            onClick={() => handleSocialLogin('oauth_github')}
            disabled={isLoading}
            className="flex items-center justify-center w-12 h-12 bg-gray-900/80 hover:bg-gray-800 border border-cyan-500/20 rounded-xl transition-all duration-200 group disabled:opacity-50 shadow-lg hover:shadow-cyan-500/20"
          >
            <Image
              src="/images/logo-02.svg"
              alt="GitHub"
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
            onClick={() => handleSocialLogin('oauth_google')}
            disabled={isLoading}
            className="flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 border border-cyan-500/30 rounded-xl transition-all duration-200 group disabled:opacity-50 shadow-lg hover:shadow-cyan-500/20"
          >
            <Image
              src="/images/logo-03.svg"
              alt="Google"
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
        <span className="text-sm text-gray-400">
          Don't have an account?{' '}
          <Link className="text-cyan-400 hover:text-cyan-300 font-medium" href="/signup">
            Sign up
          </Link>
        </span>
      </div>
    </>
  );
}