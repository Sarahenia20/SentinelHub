'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Seamlessly redirect to Scanner as the default landing page after login
export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/scanner')
  }, [router])

  // Return null for seamless redirect (no loading message)
  return null
}