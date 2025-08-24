'use client'

import { useState } from 'react'
import { ChevronDownIcon, UserIcon, CogIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

export function HeaderDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { icon: UserIcon, label: 'Profile', href: '/dashboard/profile' },
    { icon: CogIcon, label: 'Settings', href: '/dashboard/settings' },
    { icon: ArrowRightOnRectangleIcon, label: 'Sign out', href: '/logout' }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/20 dark:hover:bg-navy-700/20 transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">AC</span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-navy-700 dark:text-white">Alex Chen</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">DevOps Engineer</p>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 glass-dropdown rounded-2xl shadow-xl z-40">
            <div className="p-4 border-b border-white/20 dark:border-navy-600/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center">
                  <span className="text-white font-bold">AC</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">Alex Chen</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">alex.chen@sentinelhub.dev</p>
                </div>
              </div>
            </div>
            
            <div className="py-2">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 dark:hover:bg-navy-700/10 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-navy-700 dark:text-white">
                    {item.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}