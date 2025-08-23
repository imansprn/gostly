import React, { useState, useEffect } from 'react';
import { Profile, LogEntry, TimelineEvent } from '../types';
import ProfileForm from '../components/ProfileForm';
import ProfileTable from '../components/ProfileTable';
import Sidebar from '../components/Sidebar';
import LogsMonitor from '../components/LogsMonitor';
import ActivityTimeline from '../components/ActivityTimeline';
import AdvancedConfig from '../components/AdvancedConfig';

const Dashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('proxies');
  const [activityLogs, setActivityLogs] = useState<TimelineEvent[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logsSearchQuery, setLogsSearchQuery] = useState('');
  const [timelineSearchQuery, setTimelineSearchQuery] = useState('');
  const [configSearchQuery, setConfigSearchQuery] = useState('');
  
  // Logs functionality state
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [logsPaused, setLogsPaused] = useState(false);
  const [selectedLogLevel, setSelectedLogLevel] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // GOST service status
  const [gostStatus, setGostStatus] = useState({
    serviceRunning: false,
    version: '',
    uptime: '',
    lastCheck: new Date()
  });

  // GOST availability status
  const [gostAvailable, setGostAvailable] = useState(false);
  const [gostVersion, setGostVersion] = useState('');

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState({ 
    isConnected: false, 
    activeProfiles: 0, 
    totalProfiles: 0 
  });

  const [isWails] = useState(() => {
    return typeof window !== 'undefined' && window.go?.main?.App;
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Check GOST status every 10 seconds and on mount
  useEffect(() => {
    checkGostStatus(); // Check immediately on mount
    checkGostAvailability(); // Check GOST availability
    fetchProfiles(); // Fetch profiles on mount
    fetchActivityLogs(); // Fetch activity logs on mount
    
    const interval = setInterval(() => {
      checkGostStatus();
      checkGostAvailability(); // Also check availability periodically
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Update last updated time every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setActivityLogsLoading(true);
      if (isWails && window.go?.main?.App?.GetRecentActivityLogs) {
        const logs = await window.go.main.App.GetRecentActivityLogs(50); // Get last 50 logs
        setActivityLogs(Array.isArray(logs) ? logs : []);
      } else {
        // Mock data for browser development
        setActivityLogs([
          {
            id: 1,
            type: 'proxy_action',
            profile_name: 'HTTP Proxy',
            action: 'started',
            details: 'Profile "HTTP Proxy" was started successfully',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
            status: 'success'
          },
          {
            id: 2,
            type: 'proxy_action',
            profile_name: 'Local SOCKS5',
            action: 'created',
            details: 'Profile "Local SOCKS5" was created successfully',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
            status: 'success'
          },
          {
            id: 3,
            type: 'configuration',
            profile_name: 'HTTP Proxy',
            action: 'updated',
            details: 'Proxy configuration modified: changed port from 8080 to 8081',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            status: 'success'
          },
          {
            id: 4,
            type: 'system',
            profile_name: '',
            action: 'maintenance',
            details: 'System maintenance completed: updated GOST engine to version 3.2.4',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
            status: 'success'
          },
          {
            id: 5,
            type: 'error',
            profile_name: 'HTTP Proxy',
            action: 'connection_failed',
            details: 'Failed to establish connection to upstream server 192.168.1.100:8080',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
            status: 'error'
          },
          {
            id: 6,
            type: 'proxy_action',
            profile_name: 'Shadowsocks',
            action: 'stopped',
            details: 'Profile "Shadowsocks" was stopped due to configuration error',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
            status: 'warning'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setActivityLogs([]);
    } finally {
      setActivityLogsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'timeline') {
      fetchActivityLogs();
    } else if (tab === 'logs') {
      fetchLogs();
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      if (isWails && window.go?.main?.App?.GetRecentLogs) {
        const logs = await window.go.main.App.GetRecentLogs(100); // Get last 100 logs
        setSystemLogs(Array.isArray(logs) ? logs : []);
      } else {
        // Mock data for browser development
        setSystemLogs([
          {
            id: 1,
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            level: 'INFO',
            source: 'system',
            message: 'Gostly API initialized successfully',
            profile_id: undefined,
            profile_name: ''
          },
          {
            id: 2,
            timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
            level: 'INFO',
            source: 'api',
            message: 'Profile "HTTP Proxy" created successfully (ID: 2)',
            profile_id: 2,
            profile_name: 'HTTP Proxy'
          },
          {
            id: 3,
            timestamp: new Date(Date.now() - 30 * 1000).toISOString(),
            level: 'INFO',
            source: 'proxy',
            message: 'HTTP Proxy started on :8080',
            profile_id: 2,
            profile_name: 'HTTP Proxy'
          },
          {
            id: 4,
            timestamp: new Date(Date.now() - 15 * 1000).toISOString(),
            level: 'WARN',
            source: 'proxy',
            message: 'Connection timeout from 192.168.1.100:54321',
            profile_id: 2,
            profile_name: 'HTTP Proxy'
          },
          {
            id: 5,
            timestamp: new Date(Date.now() - 10 * 1000).toISOString(),
            level: 'ERROR',
            source: 'proxy',
            message: 'Failed to establish connection to upstream server',
            profile_id: 2,
            profile_name: 'HTTP Proxy'
          },
          {
            id: 6,
            timestamp: new Date(Date.now() - 5 * 1000).toISOString(),
            level: 'DEBUG',
            source: 'system',
            message: 'Memory usage: 45.2MB, CPU: 12.3%',
            profile_id: undefined,
            profile_name: ''
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch system logs:', err);
      setSystemLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      if (isWails && window.go?.main?.App?.GetProfiles) {
        const data = await window.go.main.App.GetProfiles();
        setProfiles(Array.isArray(data) ? data : []);
        updateConnectionStatus(Array.isArray(data) ? data : []);
      } else {
        // Mock data for browser development
        const mockProfiles = [
          {
            id: 1,
            name: 'Local SOCKS5',
            type: 'forward',
            listen: ':1080',
            remote: '127.0.0.1:1080',
            username: '',
            password: '',
            status: 'stopped'
          },
          {
            id: 2,
            name: 'HTTP Proxy',
            type: 'http',
            listen: ':8080',
            remote: 'example.com:80',
            username: 'user',
            password: 'pass',
            status: 'running'
          }
        ];
        setProfiles(mockProfiles);
        updateConnectionStatus(mockProfiles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProfile = async (profileData: Omit<Profile, 'id' | 'status'>) => {
    try {
      if (isWails && window.go?.main?.App?.AddProfile) {
        const newProfile = await window.go.main.App.AddProfile(profileData);
        if (newProfile && newProfile.id) {
          // Optimistically add to state
          const profile: Profile = {
            ...profileData,
            id: newProfile.id,
            status: 'stopped'
          };
          setProfiles(prev => [profile, ...prev]);
        }
      } else {
        // Mock add for browser development
        const newProfile: Profile = {
          ...profileData,
          id: Date.now(),
          status: 'stopped'
        };
        setProfiles(prev => [newProfile, ...prev]);
      }
      setShowForm(false);
      fetchProfiles(); // Refresh to get real data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add profile');
    }
  };

  const handleEditProfile = async (profileData: Profile) => {
    try {
      if (isWails && window.go?.main?.App?.UpdateProfile) {
        await window.go.main.App.UpdateProfile(profileData);
      }
      setProfiles(prev => prev.map(p => p.id === profileData.id ? profileData : p));
      setEditingProfile(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleDeleteProfile = async (id: number) => {
    try {
      if (isWails && window.go?.main?.App?.DeleteProfile) {
        await window.go.main.App.DeleteProfile(id);
      }
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  const handleToggleProfile = async (id: number, start: boolean) => {
    try {
      if (isWails && window.go?.main?.App) {
        if (start) {
          await window.go.main.App.StartProfile(id);
        } else {
          await window.go.main.App.StopProfile(id);
        }
      }
      setProfiles(prev => {
        const updatedProfiles = prev.map(p => 
        p.id === id ? { ...p, status: start ? 'running' : 'stopped' } : p
        );
        updateConnectionStatus(updatedProfiles);
        return updatedProfiles;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle profile');
    }
  };

  const handleFormSubmit = (profileData: Omit<Profile, 'id' | 'status'> | Profile) => {
    if ('id' in profileData) {
      handleEditProfile(profileData);
    } else {
      handleAddProfile(profileData);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProfile(null);
  };

  const handleEditProfileClick = (profile: Profile) => {
    setEditingProfile(profile);
    setShowForm(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle clearing logs
  const handleClearLogs = async () => {
    try {
      if (isWails && window.go?.main?.App?.ClearLogs) {
        await window.go.main.App.ClearLogs();
        setSystemLogs([]);
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  // Handle saving configuration
  const handleSaveConfig = async (config: string): Promise<boolean> => {
    try {
      // In a real implementation, this would save to the backend
      console.log('Saving configuration:', config);
      return true;
    } catch (err) {
      console.error('Failed to save configuration:', err);
      return false;
    }
  };

  // Handle resetting configuration
  const handleResetConfig = () => {
    // In a real implementation, this would reset to default
    console.log('Resetting configuration to default');
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Check GOST availability
  const checkGostAvailability = async () => {
    try {
      if (isWails && window.go?.main?.App?.IsGostAvailable) {
        const available = await window.go.main.App.IsGostAvailable();
        setGostAvailable(available);
        
        if (available && window.go?.main?.App?.GetGostVersion) {
          const version = await window.go.main.App.GetGostVersion();
          setGostVersion(version);
        }
    } else {
        // Mock GOST availability for browser development
        setGostAvailable(true);
        setGostVersion('3.2.4');
      }
    } catch (error) {
      console.error('Failed to check GOST availability:', error);
      setGostAvailable(false);
      setGostVersion('');
    }
  };

  // Check real GOST service status
  const checkGostStatus = async () => {
    try {
      if (isWails && window.go?.main?.App?.GetGostStatus) {
        // Call the actual GOST status function from Go backend
        const status = await window.go.main.App.GetGostStatus();
        setGostStatus({
          serviceRunning: status.running || false,
          version: status.version || 'Unknown',
          uptime: status.uptime || '',
          lastCheck: new Date()
        });
      } else {
        // Mock GOST status for browser development
        const mockGostStatus = {
          serviceRunning: Math.random() > 0.3, // 70% chance of running
          version: '2.11.5',
          uptime: Math.floor(Math.random() * 24) + 'h ' + Math.floor(Math.random() * 60) + 'm',
          lastCheck: new Date()
        };
        setGostStatus(mockGostStatus);
      }
    } catch (error) {
      console.error('Failed to check GOST status:', error);
      setGostStatus(prev => ({
        ...prev,
        serviceRunning: false,
        lastCheck: new Date()
      }));
    }
  };

  // Update connection status based on running profiles
  const updateConnectionStatus = (profilesList: Profile[]) => {
    const runningProfiles = profilesList.filter(p => p.status === 'running');
    const isConnected = runningProfiles.length > 0;
    setConnectionStatus({
      isConnected,
      activeProfiles: runningProfiles.length,
      totalProfiles: profilesList.length
    });
  };

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.name.toLowerCase().includes(query) ||
      profile.type.toLowerCase().includes(query) ||
      profile.listen.toLowerCase().includes(query) ||
      profile.remote.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={handleToggleSidebar}
          connectionStatus={connectionStatus}
          gostStatus={gostStatus}
          gostAvailable={gostAvailable}
          gostVersion={gostVersion}
          onRefreshGostStatus={checkGostStatus}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {activeTab === 'proxies' && 'Proxy Configurations'}
                  {activeTab === 'logs' && 'Logs & Monitoring'}
                  {activeTab === 'timeline' && 'Activity Timeline'}
                  {activeTab === 'advanced' && 'Advanced Configuration'}
                </h1>
                <p className="text-slate-600 mt-1">
                  {activeTab === 'proxies' && 'Manage your GOST proxy profiles and connections'}
                  {activeTab === 'logs' && 'Monitor real-time logs and system status'}
                  {activeTab === 'timeline' && 'View history of profile changes and operations'}
                  {activeTab === 'advanced' && 'Advanced GOST configuration and settings'}
                </p>
              </div>
              
              {activeTab === 'proxies' && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Proxy Rule
                </button>
              )}
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {showForm ? (
              <ProfileForm
                profile={editingProfile || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            ) : (
              <div className="space-y-4">
                {/* Dashboard Overview Cards */}
                {activeTab === 'proxies' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Proxies Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-600">Total Proxies</p>
                          <p className="text-xl font-bold text-slate-900">{profiles.length}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {profiles.length === 0 ? 'No profiles configured' : 
                             profiles.length === 1 ? '1 profile configured' : 
                             `${profiles.length} profiles configured`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Active Connections Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-600">Active Connections</p>
                          <p className="text-xl font-bold text-slate-900">{profiles.filter(p => p.status === 'running').length}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {profiles.filter(p => p.status === 'running').length === 0 ? 'No active proxies' :
                             profiles.filter(p => p.status === 'running').length === 1 ? '1 proxy running' :
                             `${profiles.filter(p => p.status === 'running').length} proxies running`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* System Status Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            connectionStatus.activeProfiles > 0
                              ? 'bg-gradient-to-br from-emerald-100 to-emerald-200' 
                              : 'bg-gradient-to-br from-red-100 to-red-200'
                          }`}>
                            <svg className={`w-5 h-5 ${
                              connectionStatus.activeProfiles > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-600">System Status</p>
                          <p className={`text-lg font-semibold ${
                            connectionStatus.activeProfiles > 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {connectionStatus.activeProfiles > 0 ? 'Connected' : 'Disconnected'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {connectionStatus.activeProfiles > 0 
                              ? `${connectionStatus.activeProfiles} of ${connectionStatus.totalProfiles} proxies active`
                              : 'No proxy connections active'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Content */}
                {activeTab === 'proxies' && (
                  <ProfileTable
                    profiles={filteredProfiles}
                    loading={loading}
                    error={error}
                    onEdit={handleEditProfileClick}
                    onDelete={handleDeleteProfile}
                    onToggle={handleToggleProfile}
                    gostAvailable={gostAvailable}
                  />
                )}
                
                {activeTab === 'logs' && (
                  <LogsMonitor
                    logs={systemLogs}
                    loading={logsLoading}
                    onRefresh={fetchLogs}
                    onClearLogs={handleClearLogs}
                  />
                )}
                
                {activeTab === 'timeline' && (
                  <ActivityTimeline
                    events={activityLogs}
                    loading={activityLogsLoading}
                    onRefresh={fetchActivityLogs}
                  />
                )}
                
                {activeTab === 'advanced' && (
                  <AdvancedConfig
                    currentConfig={`{
  "servers": [
    {
      "addr": ":8080",
      "handler": {
        "type": "http"
      },
      "listener": {
        "type": "tcp"
      }
    }
  ]
}`}
                    onSaveConfig={handleSaveConfig}
                    onResetConfig={handleResetConfig}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;