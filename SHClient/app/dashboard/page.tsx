'use client'

import { 
  FolderIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { SecurityMetricCard } from '../../components/security-metrics-card'
import { ActivityFeed } from '../../components/activity-feed'
import { QuickActions } from '../../components/quick-actions'
import { RecentRepositories } from '../../components/recent-repositories'
import { AIInsights } from '../../components/ai-insights'

export default function DashboardPage() {
  return (
    <div className="space-y-6 min-h-screen">
      {/* Top Row - Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <SecurityMetricCard
          title="Repositories Scanned"
          value={24}
          trend={12}
          icon={FolderIcon}
          type="default"
        />
        
        <SecurityMetricCard
          title="Security Status"
          value="15 Issues Found"
          icon={ShieldCheckIcon}
          type="vulnerabilities"
          criticalCount={3}
          highCount={8}
          mediumCount={4}
        />
        
        <SecurityMetricCard
          title="Security Score"
          value={87}
          icon={ChartBarIcon}
          type="gauge"
        />
        
        <SecurityMetricCard
          title="Last Scan"
          value="2 min ago"
          icon={ClockIcon}
          type="status"
          status="success"
        />
      </div>

      {/* Middle Row - Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <ActivityFeed />
        <QuickActions />
      </div>

      {/* Bottom Row - Recent Repositories & AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <RecentRepositories />
        <AIInsights />
      </div>
    </div>
  )
}