"use client"

import { useState } from "react"
import { useUser } from '@clerk/nextjs'
import {
  UserIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudIcon,
  CpuChipIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline"

export function SettingsPanel() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("profile")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showAwsSecret, setShowAwsSecret] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const [awsConnected, setAwsConnected] = useState(false)
  const [dockerConnected, setDockerConnected] = useState(false)

  const [formData, setFormData] = useState({
    awsAccessKey: '',
    awsSecretKey: '',
    awsRegion: 'us-east-1',
    s3BucketName: '',
    dockerHubUsername: '',
    dockerHubToken: '',
    apiKey: '',
    aiModel: 'gpt-4',
    scanDepth: 'moderate',
    notifications: true,
    autoScan: false,
    darkMode: true,
  })

  const tabs = [
    { id: "profile", name: "Profile", icon: UserIcon },
    { id: "integrations", name: "Integrations", icon: LinkIcon },
    { id: "platform", name: "Platform", icon: Cog6ToothIcon },
  ]

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const connectGithub = () => {
    // Simulate GitHub OAuth connection
    setGithubConnected(true)
  }

  const testAwsConnection = () => {
    // Simulate AWS connection test
    if (formData.awsAccessKey && formData.awsSecretKey) {
      setAwsConnected(true)
    }
  }


  const connectDocker = () => {
    // Simulate Docker Hub connection
    if (formData.dockerHubUsername && formData.dockerHubToken) {
      setDockerConnected(true)
    }
  }

  const saveSettings = () => {
    // Save settings logic
    console.log('Settings saved:', formData)
  }

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-6 py-8">

        {/* Horizontal Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1.5">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-2" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div className="flex items-center space-x-2 mb-6">
                  <UserIcon className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={user?.fullName || ''}
                        readOnly
                        className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Managed by Clerk Auth</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.emailAddresses?.[0]?.emailAddress || ''}
                        readOnly
                        className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Managed by Clerk Auth</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Role
                      </label>
                      <select
                        className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                      >
                        <option>Security Engineer</option>
                        <option>DevOps Engineer</option>
                        <option>Developer</option>
                        <option>Security Manager</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-16 h-16 text-white" />
                      )}
                    </div>
                    <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200">
                      Change Photo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-8">
                <div className="flex items-center space-x-2 mb-6">
                  <LinkIcon className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">Integrations</h2>
                </div>

                {/* GitHub Integration */}
                <div className="bg-gray-900/50 border border-gray-600/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                        <CommandLineIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">GitHub</h3>
                        <p className="text-sm text-gray-400">Connect your GitHub repositories</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {githubConnected ? (
                        <div className="flex items-center space-x-2 text-green-400">
                          <CheckCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <XCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">Not Connected</span>
                        </div>
                      )}
                      <button
                        onClick={connectGithub}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200"
                      >
                        {githubConnected ? 'Reconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                  {githubConnected && (
                    <div className="text-sm text-gray-400">
                      Last sync: 2 minutes ago | Repositories: 12 | Organizations: 3
                    </div>
                  )}
                </div>

                {/* AWS Integration */}
                <div className="bg-gray-900/50 border border-gray-600/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                        <CloudIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">AWS Connection</h3>
                        <p className="text-sm text-gray-400">Connect to AWS services including EC2, S3, Lambda for security scanning</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {awsConnected ? (
                        <div className="flex items-center space-x-2 text-green-400">
                          <CheckCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <XCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">Not Connected</span>
                        </div>
                      )}
                      <button
                        onClick={testAwsConnection}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl font-medium transition-all duration-200"
                      >
                        {awsConnected ? 'Test Connection' : 'Connect'}
                      </button>
                    </div>
                  </div>
                  {!awsConnected && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">AWS Access Key</label>
                        <input
                          type="text"
                          value={formData.awsAccessKey}
                          onChange={(e) => handleInputChange('awsAccessKey', e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                          placeholder="AKIA..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">AWS Secret Key</label>
                        <input
                          type="password"
                          value={formData.awsSecretKey}
                          onChange={(e) => handleInputChange('awsSecretKey', e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                          placeholder="Enter secret key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Default S3 Bucket (Optional)</label>
                        <input
                          type="text"
                          value={formData.s3BucketName}
                          onChange={(e) => handleInputChange('s3BucketName', e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                          placeholder="my-security-bucket"
                        />
                      </div>
                    </div>
                  )}
                  {awsConnected && (
                    <div className="text-sm text-gray-400">
                      Region: {formData.awsRegion} | Last sync: 5 minutes ago | Services: EC2, S3, Lambda {formData.s3BucketName && `| Default S3: ${formData.s3BucketName}`}
                    </div>
                  )}
                </div>


                {/* Docker Hub Integration */}
                <div className="bg-gray-900/50 border border-gray-600/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <CpuChipIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Docker Hub</h3>
                        <p className="text-sm text-gray-400">Connect to Docker Hub for container scanning</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {dockerConnected ? (
                        <div className="flex items-center space-x-2 text-green-400">
                          <CheckCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <XCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">Not Connected</span>
                        </div>
                      )}
                      <button
                        onClick={connectDocker}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl font-medium transition-all duration-200"
                      >
                        {dockerConnected ? 'Reconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                  {!dockerConnected && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Docker Hub Username</label>
                        <input
                          type="text"
                          value={formData.dockerHubUsername}
                          onChange={(e) => handleInputChange('dockerHubUsername', e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                          placeholder="your-username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Docker Hub Token</label>
                        <input
                          type="password"
                          value={formData.dockerHubToken}
                          onChange={(e) => handleInputChange('dockerHubToken', e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                          placeholder="dckr_pat_..."
                        />
                      </div>
                    </div>
                  )}
                  {dockerConnected && (
                    <div className="text-sm text-gray-400">
                      User: {formData.dockerHubUsername} | Last sync: 3 minutes ago | Images: 15 | Repositories: 8
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Platform Tab */}
            {activeTab === "platform" && (
              <div className="space-y-8">
                <div className="flex items-center space-x-2 mb-6">
                  <Cog6ToothIcon className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Email Notifications</h4>
                          <p className="text-sm text-gray-400">Receive email alerts for security findings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notifications}
                            onChange={(e) => handleInputChange('notifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Auto-scan New Repositories</h4>
                          <p className="text-sm text-gray-400">Automatically scan new GitHub repositories</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.autoScan}
                            onChange={(e) => handleInputChange('autoScan', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={saveSettings}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChevronRightIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}