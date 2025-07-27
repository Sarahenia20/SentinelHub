'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { 
  HomeIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CpuChipIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon
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
  const pathname = usePathname()
  
  // Clerk hooks for logout
  const { signOut } = useAuth()
  const { user } = useUser()

  const navigation = [
    { name: 'Main Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Code Scanner', href: '/dashboard/scans', icon: MagnifyingGlassIcon },
    { name: 'Repositories', href: '/dashboard/repositories', icon: FolderIcon },
    { name: 'Security Reports', href: '/dashboard/security', icon: ShieldCheckIcon },
    { name: 'DevOps Metrics', href: '/dashboard/devops', icon: ChartBarIcon },
    { name: 'AI Insights', href: '/dashboard/insights', icon: CpuChipIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  ]

  const handleLogout = async () => {
    try {
      await signOut({
        redirectUrl: '/signin'
      })
      // Force reload to ensure clean state
      window.location.href = '/signin'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: force redirect even if logout fails
      window.location.href = '/signin'
    }
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
        {/* Enhanced Glassy & Bluish Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
          lg:relative lg:transform-none lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
          w-80
        `}>
          <div className="h-full backdrop-blur-sm bg-white/10 dark:bg-black/10 border-r border-white/20 dark:border-white/10 shadow-2xl">
            {/* Fixed Header Section with Clickable Logo */}
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
                    className="relative h-10 w-10 hover:scale-110 transition-transform duration-200"
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
                    className="hidden lg:block p-2 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-white/10"
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
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 shadow-lg border border-blue-500/30' 
                        : 'text-gray-300 hover:bg-white/5 dark:hover:bg-black/10 hover:text-blue-300 hover:border-white/10 dark:hover:border-white/5 border border-transparent'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <IconComponent className={`h-5 w-5 transition-colors ${
                      sidebarCollapsed ? '' : 'mr-4'
                    } ${isActive ? 'text-blue-300' : 'text-gray-400 group-hover:text-blue-400'}`} />
                    
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

            {/* Footer Section - Moved to Bottom with Reduced Space */}
            <div className="absolute bottom-0 w-full px-2 py-1 border-t border-white/20 dark:border-white/10">
              {!sidebarCollapsed ? (
                <div className="text-xs text-center">
                  <div className="text-gray-400"> © 2025 SentinelHub</div>
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
                <div className="flex justify-center">
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                    title="Sign out"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Enhanced Glassy & Bluish Header */}
          <header className="h-20 flex items-center px-6 backdrop-blur-sm bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-white/10 shadow-2xl relative z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 mr-4 transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-white/10"
            >
              <Bars3Icon className="w-6 h-6 text-blue-400" />
            </button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <span className="text-blue-400">/</span>
              <span className="text-gray-400 capitalize text-sm">
                {pathname.split('/').pop() || 'overview'}
              </span>
            </div>
            
            <div className="ml-auto flex items-center space-x-3">
              {/* Enhanced Search with Better Glass Effect */}
              <div className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search repositories, scans..."
                    className="w-72 px-4 py-2.5 pl-11 backdrop-blur-sm bg-white/5 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-400 text-sm transition-all duration-200 shadow-lg"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                </div>
              </div>
              
              {/* Notifications with Enhanced Design */}
              <button className="relative p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-white/10">
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
                className="p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-white/10"
                title="Toggle theme"
              >
                {themeToggled ? (
                  <SunIcon className="w-5 h-5 text-blue-400" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-blue-400" />
                )}
              </button>
              
              {/* Enhanced User Profile Section with Logout */}
              <div className="pl-4 border-l border-white/20 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-3 p-2 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-white">
                        {user?.firstName} {user?.lastName} || 'User'
                      </p>
                      <p className="text-xs text-blue-400">
                        {user?.emailAddresses?.[0]?.emailAddress || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-500/10 hover:text-red-300 text-red-400 transition-all duration-200 border border-transparent hover:border-red-500/30"
                    title="Sign out"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-900/30 relative z-10">
            <div className="max-w-screen-2xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}