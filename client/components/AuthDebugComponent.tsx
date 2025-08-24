'use client'
import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function AuthDebugComponent() {
  const { isLoaded, userId, sessionId, signOut } = useAuth()
  const { user } = useUser()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const gatherDebugInfo = () => {
      const info = {
        clerk: {
          isLoaded,
          userId: userId || 'null',
          sessionId: sessionId || 'null',
          hasUser: !!user,
          userEmail: user?.emailAddresses?.[0]?.emailAddress || 'none',
          userCreatedAt: user?.createdAt || 'unknown',
        },
        browser: {
          localStorage: Object.keys(localStorage).filter(key => key.includes('clerk')),
          sessionStorage: Object.keys(sessionStorage).filter(key => key.includes('clerk')),
          cookies: document.cookie.split(';').filter(cookie => cookie.includes('clerk')),
          userAgent: navigator.userAgent,
          currentUrl: window.location.href,
        },
        environment: {
          nextPublicClerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 20) + '...',
          afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
          afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
        },
        timestamp: new Date().toISOString(),
      }
      setDebugInfo(info)
    }

    gatherDebugInfo()
    // Reduced polling frequency to reduce CPU usage
    const interval = setInterval(gatherDebugInfo, 5000) // Update every 5 seconds instead of 2

    return () => clearInterval(interval)
  }, [isLoaded, userId, sessionId, user])

  const handleClearAll = async () => {
    try {
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Sign out if possible
      if (signOut) {
        await signOut()
      }
      
      alert('All data cleared! Refresh the page.')
    } catch (error) {
      console.error('Clear error:', error)
      alert('Error clearing data. Check console.')
    }
  }

  if (!isLoaded) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-500 text-black p-4 rounded-lg shadow-lg z-50">
        <h3 className="font-bold">🔄 Auth Debug</h3>
        <p>Clerk is loading...</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">🐛 Auth Debug</h3>
        <button
          onClick={handleClearAll}
          className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
          title="Clear all auth data"
        >
          Clear All
        </button>
      </div>
      
      <div className="text-xs space-y-2">
        <div>
          <strong>Status:</strong>{' '}
          <span className={userId ? 'text-green-400' : 'text-red-400'}>
            {userId ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
        
        <details>
          <summary className="cursor-pointer text-blue-400">Clerk State</summary>
          <pre className="text-xs bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(debugInfo.clerk, null, 2)}
          </pre>
        </details>
        
        <details>
          <summary className="cursor-pointer text-blue-400">Browser State</summary>
          <pre className="text-xs bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(debugInfo.browser, null, 2)}
          </pre>
        </details>
        
        <details>
          <summary className="cursor-pointer text-blue-400">Environment</summary>
          <pre className="text-xs bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(debugInfo.environment, null, 2)}
          </pre>
        </details>
        
        <div className="text-xs text-gray-400">
          Last updated: {debugInfo.timestamp?.split('T')[1]?.split('.')[0]}
        </div>
      </div>
    </div>
  )
}

// Usage: Add this to your layout or any page where you're debugging
// <AuthDebugComponent />