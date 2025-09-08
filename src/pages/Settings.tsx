import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Settings as SettingsIcon, User, Key, Bell, Shield } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'api', name: 'API Keys', icon: Key },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h2>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-primary-600">
                      {user?.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{user?.email}</h3>
                    <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input-field mt-1 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="input-field mt-1 bg-gray-50 capitalize"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                    disabled
                    className="input-field mt-1 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Change Password</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Update your password to keep your account secure
                  </p>
                  <button className="btn-secondary">
                    Change Password
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn-secondary">
                    Enable 2FA
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Active Sessions</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage your active login sessions
                  </p>
                  <button className="btn-secondary">
                    View Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive email updates about your reports</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Processing Updates</h3>
                    <p className="text-sm text-gray-500">Get notified when report processing is complete</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Weekly Summary</h3>
                    <p className="text-sm text-gray-500">Receive weekly reports summary</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">System Alerts</h3>
                    <p className="text-sm text-gray-500">Important system notifications</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-6">API Configuration</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">OpenAI API Key</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure your OpenAI API key for AI-powered features
                  </p>
                  <div className="flex space-x-3">
                    <input
                      type="password"
                      placeholder="sk-..."
                      className="input-field flex-1"
                    />
                    <button className="btn-secondary">
                      Test Connection
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Supabase Configuration</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Your Supabase project settings
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Supabase URL"
                      className="input-field"
                    />
                    <input
                      type="password"
                      placeholder="Service Role Key"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Keep your API keys secure and never share them publicly. 
                        These keys provide access to your AI services and database.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
