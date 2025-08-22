import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import ProfileForm from '../components/ProfileForm';
import ProfileTable from '../components/ProfileTable';
import Sidebar from '../components/Sidebar';

const Dashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('proxies');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
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
            profile_name: 'HTTP Proxy',
            action: 'started',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
            status: 'success'
          },
          {
            id: 2,
            profile_name: 'Local SOCKS5',
            action: 'created',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
            status: 'success'
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
            profile_id: null,
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
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-slate-900">Real-time Logs</h3>
                      <button
                        onClick={fetchLogs}
                        className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors duration-200"
                      >
                        Refresh
                          </button>
                    </div>
                    
                    {logsLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center px-4 py-2 bg-slate-50 rounded-lg">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-slate-600 font-medium">Loading logs...</span>
                        </div>
                      </div>
                    ) : systemLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No logs yet</h3>
                        <p className="text-slate-600">System logs will appear here as you use the application</p>
                        </div>
                      ) : (
                      <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-auto">
                        {systemLogs.map((log) => {
                          const getLevelColor = (level: string) => {
                            switch (level) {
                              case 'ERROR': return 'text-red-400';
                              case 'WARN': return 'text-yellow-400';
                              case 'INFO': return 'text-green-400';
                              case 'DEBUG': return 'text-blue-400';
                              default: return 'text-slate-400';
                              }
                            };
                          
                          const formatTimestamp = (timestamp: string) => {
                            const date = new Date(timestamp);
                            return date.toLocaleTimeString();
                          };
                          
                          return (
                            <div key={log.id} className="mb-1">
                              <span className="text-slate-400">[{formatTimestamp(log.timestamp)}]</span>{' '}
                              <span className={getLevelColor(log.level)}>[{log.level}]</span>{' '}
                              <span className="text-blue-400">[{log.source}]</span>{' '}
                              {log.profile_name && (
                                <span className="text-purple-400">({log.profile_name})</span>
                              )}{' '}
                              <span className="text-white">{log.message}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'timeline' && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Activity Timeline</h3>
                    {activityLogsLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center px-4 py-2 bg-slate-50 rounded-lg">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-slate-600 font-medium">Loading activity logs...</span>
                        </div>
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No activity yet</h3>
                        <p className="text-slate-600">Activity logs will appear here as you manage profiles</p>
                        </div>
                      ) : (
                      <div className="space-y-4">
                        {activityLogs.map((log) => {
                          const getActionColor = (action: string) => {
                            switch (action) {
                              case 'created': return 'bg-blue-500';
                              case 'updated': return 'bg-yellow-500';
                              case 'deleted': return 'bg-red-500';
                              case 'started': return 'bg-green-500';
                              case 'stopped': return 'bg-orange-500';
                              default: return 'bg-slate-500';
                            }
                          };
                          
                          const getActionLabel = (action: string) => {
                            switch (action) {
                              case 'created': return 'Profile created';
                              case 'updated': return 'Profile updated';
                              case 'deleted': return 'Profile deleted';
                              case 'started': return 'Profile started';
                              case 'stopped': return 'Profile stopped';
                              default: return action;
                            }
                          };
                          
                          const formatTimeAgo = (timestamp: string) => {
                            const now = new Date();
                            const logTime = new Date(timestamp);
                            const diffMs = now.getTime() - logTime.getTime();
                            const diffMins = Math.floor(diffMs / (1000 * 60));
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            
                            if (diffMins < 1) return 'Just now';
                            if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
                            if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                          };
                          
                          return (
                            <div key={log.id} className="flex items-center space-x-3">
                              <div className={`w-2 h-2 ${getActionColor(log.action)} rounded-full`}></div>
                              <span className="text-sm text-slate-600">
                                {getActionLabel(log.action)}: <span className="font-medium">{log.profile_name}</span>
                              </span>
                              <span className="text-xs text-slate-400">{formatTimeAgo(log.timestamp)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'advanced' && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Advanced Configuration</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <textarea
                        className="w-full h-64 bg-transparent border-none outline-none font-mono text-sm text-slate-700 resize-none"
                        placeholder="Raw GOST configuration will appear here..."
                        readOnly
                      />
                    </div>
                  </div>
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