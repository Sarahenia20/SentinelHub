'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import {
  HomeIcon,
  FolderIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CpuChipIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  UserIcon,
  DocumentChartBarIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline'
import { DashboardBackground } from '../../components/dashboard-background'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notifications] = useState(2)
  const [themeToggled, setThemeToggled] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const pathname = usePathname()

  // Clerk hooks
  const { signOut, userId, isLoaded } = useAuth()
  const { user } = useUser()

  // Listen for role changes from AI Persona
  useEffect(() => {
    const handleRoleChange = (event: any) => {
      setSelectedRole(event.detail)
    }

    // Load initial role from session
    const savedRole = sessionStorage.getItem('user_role')
    if (savedRole) {
      setSelectedRole(savedRole)
    }

    window.addEventListener('roleChanged', handleRoleChange)
    return () => window.removeEventListener('roleChanged', handleRoleChange)
  }, [])

  // Note: Authentication is handled by middleware, no client-side redirect needed

  const navigation = [
    { name: 'Scanner', href: '/dashboard/scanner', icon: CpuChipIcon },
    { name: 'Security Reports', href: '/dashboard/reports', icon: DocumentChartBarIcon },
    { name: 'Analytics', href: '/dashboard/overview', icon: ChartPieIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  ]

  // Dynamic page title mapping
  const getPageTitle = () => {
    const path = pathname
    switch (path) {
      case '/dashboard':
      case '/dashboard/scanner':
        return 'Security Scanner'
      case '/dashboard/reports':
        return 'Security Reports'
      case '/dashboard/overview':
        return 'Analytics Dashboard'
      case '/dashboard/settings':
        return 'Settings'
      default:
        return 'Scanner'
    }
  }

  const getPageSubtitle = () => {
    const path = pathname
    switch (path) {
      case '/dashboard':
      case '/dashboard/scanner':
        return 'Comprehensive security analysis across multiple engines'
      case '/dashboard/reports':
        return 'Comprehensive security analysis and vulnerability tracking'
      case '/dashboard/overview':
        return 'Monitor your security posture with real-time metrics and insights'
      case '/dashboard/settings':
        return 'Manage your account and security preferences'
      default:
        return 'DevSecOps Platform'
    }
  }

  const handleLogout = async () => {
    console.log('handleLogout triggered')
    setIsLoggingOut(true)
    setUserDropdownOpen(false)

    try {
      console.log('Clearing localStorage and sessionStorage')
      localStorage.clear()
      sessionStorage.clear()

      console.log('Attempting Clerk signOut')
      await signOut(() => {
        console.log('Clerk signOut callback executed, redirecting to /signin')
        window.location.assign('/signin')
      })

      // Fallback in case callback fails
      console.log('Ensuring redirect with window.location.assign')
      window.location.assign('/signin')
    } catch (error) {
      console.error('Logout error:', error)
      console.log('Falling back to window.location.assign')
      window.location.assign('/signin')
    } finally {
      console.log('Logout process completed')
      setIsLoggingOut(false)
    }
  }

  // Get user data with fallbacks
  const userRole = (user?.publicMetadata?.role as string) || ''
  const displayName = user?.firstName || user?.fullName || 'User'
  const userEmail =
    user?.emailAddresses?.[0]?.emailAddress ||
    user?.primaryEmailAddress?.emailAddress ||
    ''

  // Generate avatar URL with error handling
  const getAvatarUrl = () => {
    try {
      if (user?.imageUrl) return user.imageUrl
      const seed = user?.id || 'default'
      return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=3b82f6,1d4ed8,0ea5e9`
    } catch (error) {
      return `https://api.dicebear.com/7.x/notionists/svg?seed=default&backgroundColor=3b82f6`
    }
  }

  // Show loading state if auth is not loaded
  if (!isLoaded) {
    console.log('Auth not loaded, showing loading state')
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!userId) {
    console.log('No userId, rendering null')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <DashboardBackground />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
          lg:relative lg:transform-none lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
          w-80
        `}
        >
          <div className="h-full backdrop-blur-sm bg-white/10 dark:bg-black/10 border-r border-white/20 dark:border-white/10 shadow-2xl">
            {/* Header Section */}
            <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10 min-h-[80px]">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative h-12 w-auto">
                    <Image
                      src="/images/logoBig.png"
                      alt="SentinelHub Logo"
                      width={160}
                      height={48}
                      className="object-contain h-12 w-auto"
                      priority
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">SentinelHub</span>
                    <span className="text-blue-400 text-xs">DevSecOps Platform</span>
                  </div>
                </div>
              )}

              {sidebarCollapsed && (
                <div className="flex items-center justify-center flex-1">
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="relative h-10 w-10 hover:scale-110 transition-transform duration-200 flex items-center justify-center"
                    title="Expand sidebar"
                  >
                    <Image
                      src="/images/logoBig.png"
                      alt="SentinelHub"
                      width={40}
                      height={40}
                      className="object-contain rounded-xl"
                      priority
                    />
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {!sidebarCollapsed && (
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="hidden lg:block p-2 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-200"
                    title="Collapse sidebar"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-blue-400" />
                  </button>
                )}

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-blue-400" />
                </button>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="px-4 py-6 space-y-2 flex-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 shadow-lg border border-blue-500/30'
                          : 'text-gray-300 hover:bg-white/5 dark:hover:bg-black/10 hover:text-blue-300 hover:border-white/10 dark:hover:border-white/5 border border-transparent'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <IconComponent
                      className={`h-5 w-5 transition-colors ${
                        sidebarCollapsed ? '' : 'mr-4'
                      } ${isActive ? 'text-blue-300' : 'text-gray-400 group-hover:text-blue-400'}`}
                    />

                    {!sidebarCollapsed && (
                      <>
                        <span className="font-medium text-sm">{item.name}</span>
                        {isActive && (
                          <div className="absolute right-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Footer Section */}
            <div className="absolute bottom-0 w-full px-2 py-1 border-t border-white/20 dark:border-white/10">
              {!sidebarCollapsed ? (
                <div className="text-xs text-center">
                  <div className="text-gray-400">© 2025 SentinelHub</div>
                  <div className="text-blue-400">Made by Sarah Henia</div>
                  <div className="flex justify-center">
                    <Image
                      src="/images/swhite.png"
                      alt="The samurAI"
                      width={20}
                      height={20}
                      className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-center">
                  <div className="text-gray-400">© 2025 SentinelHub</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-20 flex items-center px-6 backdrop-blur-sm bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-white/10 shadow-2xl relative z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 mr-4 transition-all duration-200"
            >
              <Bars3Icon className="w-6 h-6 text-blue-400" />
            </button>

            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {getPageTitle()}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {getPageSubtitle()}
              </p>
            </div>

            <div className="ml-auto flex items-center space-x-3">
              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search repositories, scans..."
                    className="w-72 px-4 py-2.5 pl-11 backdrop-blur-sm bg-white/5 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-400 text-sm transition-all duration-200 shadow-lg"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-200">
                <BellIcon className="w-5 h-5 text-blue-400" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse shadow-lg shadow-red-500/50">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setThemeToggled(!themeToggled)}
                className="p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-200"
                title="Toggle theme"
              >
                {themeToggled ? (
                  <SunIcon className="w-5 h-5 text-blue-400" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-blue-400" />
                )}
              </button>

              {/* User Profile Section - FIXED Z-INDEX ISSUES */}
              <div className="pl-4 border-l border-white/20 dark:border-white/10 relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-200"
                  disabled={isLoggingOut}
                >
                  {/* Avatar with error handling */}
                  <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg bg-blue-600 flex items-center justify-center">
                    <Image
                      src={getAvatarUrl()}
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = `<span className="text-white font-bold text-sm">${displayName.charAt(0)}</span>`
                        }
                      }}
                    />
                  </div>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">{displayName}</p>
                    <p className="text-xs text-blue-400">
                      {selectedRole || userRole || 'Select your role'}
                    </p>
                  </div>

                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-900/30 relative z-10">
            <div className="max-w-screen-2xl mx-auto">{children}</div>
          </main>
        </div>
      </div>

      {/* FIXED: User Dropdown - Now rendered at body level with higher z-index */}
      {userDropdownOpen && !isLoggingOut && (
        <div className="fixed inset-0 z-[9999]">
          {/* Click outside to close - with pointer events */}
          <div
            className="absolute inset-0"
            onClick={() => setUserDropdownOpen(false)}
          />
          
          {/* Dropdown positioned relative to trigger */}
          <div className="absolute top-20 right-6 w-64 backdrop-blur-sm bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-xl shadow-2xl py-2 pointer-events-auto">
            <div className="px-4 py-3 border-b border-white/20 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-600 flex items-center justify-center">
                  <Image
                    src={getAvatarUrl()}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = `<span className="text-white font-bold">${displayName.charAt(0)}</span>`
                      }
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{displayName}</p>
                  <p className="text-xs text-gray-400">{userEmail}</p>
                  <p className="text-xs text-blue-400">
                    {selectedRole || userRole || 'No role selected'}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-1">
              <Link
                href="/dashboard/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                onClick={() => setUserDropdownOpen(false)}
              >
                <UserIcon className="w-4 h-4 mr-3" />
                Profile Settings
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Logout button clicked in dropdown')
                  setUserDropdownOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                disabled={isLoggingOut}
                type="button"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay during logout */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/10 rounded-xl p-8 flex items-center space-x-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">Signing out...</span>
          </div>
        </div>
      )}
    </div>
  )
}