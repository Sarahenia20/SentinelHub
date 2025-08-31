'use client'

import { useState } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  const notifications = [
    {
      id: 1,
      type: 'security',
      title: 'High Risk Vulnerability Found',
      message: 'Critical security issue detected in main repository',
      time: '2 min ago',
      unread: true
    },
    {
      id: 2,
      type: 'scan',
      title: 'Scan Complete',
      message: 'Frontend repository scan finished successfully',
      time: '15 min ago',
      unread: true
    },
    {
      id: 3,
      type: 'system',
      title: 'System Update',
      message: 'SentinelHub updated to version 2.1.4',
      time: '1 hour ago',
      unread: false
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-xl hover:bg-white/20 dark:hover:bg-navy-700/20 transition-all duration-200 transform hover:scale-110 group"
      >
        <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        
        {/* Notification badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">2</span>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 glass-dropdown rounded-2xl shadow-xl z-40 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-white/20 dark:border-navy-600/20">
              <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
                Notifications
              </h3>
            </div>
            
            <div className="py-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-white/10 dark:hover:bg-navy-700/10 cursor-pointer transition-colors ${
                    notification.unread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'security' ? 'bg-red-500' :
                      notification.type === 'scan' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-700 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-white/20 dark:border-navy-600/20">
              <button className="w-full text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}