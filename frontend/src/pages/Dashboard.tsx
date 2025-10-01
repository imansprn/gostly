import React, { useState, useEffect } from 'react';
import { Profile, LogEntry, TimelineEvent } from '../types';
import ProfileForm from '../components/ProfileForm';
import ProfileTable from '../components/ProfileTable';
import Sidebar from '../components/Sidebar';
import LogsMonitor from '../components/LogsMonitor';
import ActivityTimeline from '../components/ActivityTimeline';
import AdvancedConfig from '../components/AdvancedConfig';
import { HostMapping } from '../components/HostMappingModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { mockProfiles, mockLogEntries } from '../config/mockData';

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
  // Host Mapping state
  const [hostMappings, setHostMappings] = useState<HostMapping[]>([
    { id: 1, hostname: 'example.local', ip: '192.168.1.1', port: 3000, protocol: 'HTTP', active: true },
    { id: 2, hostname: 'example.test', ip: '192.168.1.1', port: 3001, protocol: 'HTTP', active: false },
  ]);
  const [hmEditing, setHmEditing] = useState<HostMapping | null>(null);
  const [hmFormOpen, setHmFormOpen] = useState(false);
  const [hmForm, setHmForm] = useState<HostMapping>({ hostname: '', ip: '', port: 80, protocol: 'HTTP', active: true });
  const [hmFormErrors, setHmFormErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [hostRouterRunning, setHostRouterRunning] = useState(false);
  const [hostRouterAddr, setHostRouterAddr] = useState(':8080');
  const [routerBusy, setRouterBusy] = useState(false);
  const [hostRouterAddrError, setHostRouterAddrError] = useState<string | null>(null);

  const isValidListenAddr = (addr: string) => {
    if (!addr || addr[0] !== ':') return false;
    const port = Number(addr.slice(1));
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);
  const [confirmTargetName, setConfirmTargetName] = useState<string>('');
  const [confirmType, setConfirmType] = useState<'profile' | 'hostMapping'>('profile');
  
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
    fetchActivityLogs(); // Fetch activity logs on mount
    
    // Test Wails connection
    if (isWails && window.go?.main?.App?.TestConnection) {
      (async () => {
        try {
          const testFn = window.go?.main?.App?.TestConnection;
          const result = testFn ? await testFn() : 'no binding';
          console.log('Wails test result (awaited):', result);
        } catch (err) {
          console.error('Wails test failed:', err);
        }
      })();
    }
    
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
      if (isWails && window.go?.main?.App?.GetTimelineEvents) {
        const events = await window.go.main.App.GetTimelineEvents();
        setActivityLogs(Array.isArray(events) ? events : []);
      } else {
        // Mock data for browser development
        setActivityLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch timeline events:', err);
      setActivityLogs([]);
    } finally {
      setActivityLogsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Close form when leaving Proxies tab to allow content to change
    if (tab !== 'proxies') {
      setShowForm(false);
      setEditingProfile(null);
    }
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
        setSystemLogs(mockLogEntries);
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
        console.log('fetchProfiles: calling GetProfiles...');
        const call = window.go.main.App.GetProfiles();
        const data = await Promise.race([
          call,
          new Promise((_, reject) => setTimeout(() => reject(new Error('GetProfiles timeout after 5s')), 5000))
        ]);
        console.log('fetchProfiles: GetProfiles resolved:', data);
        setProfiles(Array.isArray(data) ? data : []);
        updateConnectionStatus(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        // Mock data for browser development
        console.log('fetchProfiles: using mock profiles');
        setProfiles(mockProfiles);
        updateConnectionStatus(mockProfiles);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch profiles (raw):', err);
      let message = 'Failed to fetch profiles';
      if (err instanceof Error) {
        message = err.message || message;
      } else if (typeof err === 'string') {
        message = err || message;
      } else if (err && typeof err === 'object') {
        // Try common Wails error shapes
        const anyErr: any = err;
        if (anyErr.message) message = String(anyErr.message);
        else if (anyErr.error) message = String(anyErr.error);
        else {
          try { message = JSON.stringify(anyErr); } catch { /* ignore */ }
        }
      }
      setError(message);
      // Fallback to mock so UI is usable even if backend hangs
      if (message.includes('timeout')) {
        setProfiles(mockProfiles);
        updateConnectionStatus(mockProfiles);
      } else {
        setProfiles([]);
      }
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

  const handleDeleteProfileConfirm = (id: number, profileName: string) => {
    setConfirmTargetId(id);
    setConfirmTargetName(profileName);
    setConfirmType('profile');
    setConfirmOpen(true);
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

  // Host Mapping CRUD placeholders
  const listHostMappings = async (): Promise<HostMapping[]> => {
    try {
      if (isWails && window.go?.main?.App?.GetHostMappings) {
        const result = await window.go.main.App.GetHostMappings();
        const mapped: HostMapping[] = (result || []).map((m: any) => ({
          id: m.id,
          hostname: m.hostname,
          ip: m.ip,
          port: m.port,
          protocol: (m.protocol || 'HTTP') as HostMapping['protocol'],
          active: !!m.active,
        }));
        setHostMappings(mapped);
        return mapped;
      }
      return hostMappings;
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to load host mappings' });
      return hostMappings;
    }
  };
  const createHostMapping = async (mapping: HostMapping) => {
    try {
      if (isWails && window.go?.main?.App?.UpsertHostMapping) {
        await window.go.main.App.UpsertHostMapping({
          hostname: mapping.hostname,
          ip: mapping.ip,
          port: mapping.port,
          protocol: mapping.protocol,
          active: mapping.active,
        });
        await listHostMappings();
      } else {
        const id = Date.now();
        setHostMappings(prev => [{ ...mapping, id }, ...prev]);
      }
      setToast({ type: 'success', message: 'Host mapping created.' });
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to create host mapping' });
    }
  };
  const updateHostMapping = async (mapping: HostMapping) => {
    try {
      if (isWails && window.go?.main?.App?.UpsertHostMapping) {
        await window.go.main.App.UpsertHostMapping({
          id: mapping.id,
          hostname: mapping.hostname,
          ip: mapping.ip,
          port: mapping.port,
          protocol: mapping.protocol,
          active: mapping.active,
        });
        await listHostMappings();
      } else {
        setHostMappings(prev => prev.map(m => m.id === mapping.id ? mapping : m));
      }
      setToast({ type: 'success', message: 'Host mapping updated.' });
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to update host mapping' });
    }
  };
  const deleteHostMapping = async (id?: number) => {
    if (!id) return;
    try {
      if (isWails && window.go?.main?.App?.DeleteHostMappingByID) {
        await window.go.main.App.DeleteHostMappingByID(id);
        await listHostMappings();
      } else {
        setHostMappings(prev => prev.filter(m => m.id !== id));
      }
      setToast({ type: 'success', message: 'Host mapping deleted.' });
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to delete host mapping' });
    }
  };

  useEffect(() => {
    if (activeTab === 'hostMapping') {
      listHostMappings();
      // fetch router status
      (async () => {
        try {
          if (isWails && window.go?.main?.App?.IsHostRouterRunning) {
            const res = await window.go.main.App.IsHostRouterRunning();
            // Handle possible return shapes: boolean, [bool, string], or {running, addr}
            let running: boolean = false;
            let addr: string | undefined = undefined;
            if (typeof res === 'boolean') {
              running = res as boolean;
            } else if (Array.isArray(res)) {
              running = !!(res as any)[0];
              addr = (res as any)[1];
            } else if (res && typeof res === 'object') {
              running = !!(res as any).running;
              addr = (res as any).addr;
            }
            setHostRouterRunning(!!running);
            if (addr) setHostRouterAddr(addr);
          }
        } catch {}
      })();
      const interval = setInterval(async () => {
        try {
          if (isWails && window.go?.main?.App?.IsHostRouterRunning) {
            const res = await window.go.main.App.IsHostRouterRunning();
            let running: boolean = false;
            let addr: string | undefined = undefined;
            if (typeof res === 'boolean') {
              running = res as boolean;
            } else if (Array.isArray(res)) {
              running = !!(res as any)[0];
              addr = (res as any)[1];
            } else if (res && typeof res === 'object') {
              running = !!(res as any).running;
              addr = (res as any).addr;
            }
            setHostRouterRunning(!!running);
            if (addr) setHostRouterAddr(addr);
          }
        } catch {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const startHostRouter = async () => {
    try {
      setRouterBusy(true);
      if (!isValidListenAddr(hostRouterAddr)) {
        setHostRouterAddrError('Enter like ":8080" (ports <1024 need sudo)');
        return;
      } else {
        setHostRouterAddrError(null);
      }
      if (isWails && window.go?.main?.App?.StartHostRouter) {
        await window.go.main.App.StartHostRouter(hostRouterAddr);
      }
      setHostRouterRunning(true);
      setToast({ type: 'success', message: `Router started on ${hostRouterAddr}.` });
    } catch (e: any) {
      const msg = e?.message || e?.toString?.() || 'Failed to start host router';
      setToast({ type: 'error', message: msg });
    } finally { setRouterBusy(false); }
  };
  const stopHostRouter = async () => {
    try {
      setRouterBusy(true);
      if (isWails && window.go?.main?.App?.StopHostRouter) {
        await window.go.main.App.StopHostRouter();
      }
      setHostRouterRunning(false);
      setToast({ type: 'success', message: 'Router stopped.' });
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to stop host router' });
    } finally { setRouterBusy(false); }
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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

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
                <h1 className="text-2xl font-semibold text-slate-900 flex items-center space-x-3">
                  <span>
                    {activeTab === 'proxies' && 'Proxy Configurations'}
                    {activeTab === 'logs' && 'Logs & Monitoring'}
                    {activeTab === 'timeline' && 'Activity Timeline'}
                    {activeTab === 'advanced' && 'Advanced Configuration'}
                    {activeTab === 'hostMapping' && 'Host Mapping'}
                  </span>
                  {activeTab === 'hostMapping' && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${hostRouterRunning ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${hostRouterRunning ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {hostRouterRunning ? `Router running • ${hostRouterAddr}` : 'Router stopped'}
                    </span>
                  )}
                </h1>
                <p className="text-slate-600 mt-1">
                  {activeTab === 'proxies' && 'Manage your GOST proxy profiles and connections'}
                  {activeTab === 'logs' && 'Monitor real-time logs and system status'}
                  {activeTab === 'timeline' && 'View history of profile changes and operations'}
                  {activeTab === 'advanced' && 'Advanced GOST configuration and settings'}
                  {activeTab === 'hostMapping' && 'Configure hostname to destination mappings'}
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

              {activeTab === 'hostMapping' && (
                <div className="flex items-center space-x-2">
                  {!hmFormOpen && (
                    <button
                      onClick={() => { setHmEditing(null); setHmForm({ hostname: '', ip: '', port: 80, protocol: 'HTTP', active: true }); setHmFormOpen(true); }}
                      className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Host Mapping
                    </button>
                  )}
                  {hostRouterRunning ? (
                    <button onClick={stopHostRouter} disabled={routerBusy} className={`inline-flex items-center px-3 py-2 rounded text-xs font-medium ${routerBusy ? 'bg-red-600/70 cursor-not-allowed text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                      {routerBusy ? 'Stopping…' : 'Stop Router'}
                    </button>
                  ) : (
                    <button onClick={startHostRouter} disabled={routerBusy} className={`inline-flex items-center px-3 py-2 rounded text-xs font-medium ${routerBusy ? 'bg-emerald-600/70 cursor-not-allowed text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                      {routerBusy ? 'Starting…' : 'Start Router'}
                    </button>
                  )}
                </div>
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
                    onDeleteConfirm={handleDeleteProfileConfirm}
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

                {activeTab === 'hostMapping' && (
                  <div className="space-y-4">
                    {hmFormOpen && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-base font-medium text-slate-900 mb-3">{hmEditing ? 'Edit Host Mapping' : 'Add Host Mapping'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Hostname</label>
                            <input
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200 ${hmFormErrors.hostname ? 'border-red-300 focus:ring-red-200' : 'border-slate-300'}`}
                              placeholder="example.local"
                              value={hmForm.hostname}
                              onChange={(e) => setHmForm(prev => ({ ...prev, hostname: e.target.value }))}
                            />
                            {hmFormErrors.hostname && <p className="text-xs text-red-600 mt-1">{hmFormErrors.hostname}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">IP</label>
                            <input
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200 ${hmFormErrors.ip ? 'border-red-300 focus:ring-red-200' : 'border-slate-300'}`}
                              placeholder="192.168.1.10"
                              value={hmForm.ip}
                              onChange={(e) => setHmForm(prev => ({ ...prev, ip: e.target.value }))}
                            />
                            {hmFormErrors.ip && <p className="text-xs text-red-600 mt-1">{hmFormErrors.ip}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                            <input
                              type="number"
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200 ${hmFormErrors.port ? 'border-red-300 focus:ring-red-200' : 'border-slate-300'}`}
                              placeholder="3000"
                              value={hmForm.port}
                              onChange={(e) => setHmForm(prev => ({ ...prev, port: Number(e.target.value) }))}
                            />
                            {hmFormErrors.port && <p className="text-xs text-red-600 mt-1">{hmFormErrors.port}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Protocol</label>
                            <select
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-200"
                              value={hmForm.protocol}
                              onChange={(e) => setHmForm(prev => ({ ...prev, protocol: e.target.value as HostMapping['protocol'] }))}
                            >
                              <option value="HTTP">HTTP</option>
                              <option value="HTTPS">HTTPS</option>
                              <option value="TCP">TCP</option>
                            </select>
                          </div>
                          <div className="md:col-span-4 flex items-center space-x-3">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <label className="inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={hmForm.active} onChange={(e) => setHmForm(prev => ({ ...prev, active: e.target.checked }))} />
                              <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors relative">
                                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                              </div>
                              <span className="ml-2 text-sm text-slate-700">{hmForm.active ? 'Active' : 'Inactive'}</span>
                            </label>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end space-x-2">
                          <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg" onClick={() => { setHmFormOpen(false); setHmEditing(null); setHmFormErrors({}); }}>Cancel</button>
                          <button
                            className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                            onClick={async () => {
                              const errs: Record<string, string> = {};
                              if (!hmForm.hostname.trim()) errs.hostname = 'Hostname is required';
                              if (!hmForm.ip.trim()) errs.ip = 'IP address is required';
                              if (!hmForm.port || hmForm.port <= 0) errs.port = 'Port must be a positive number';
                              setHmFormErrors(errs);
                              if (Object.keys(errs).length > 0) return;
                              if (hmEditing?.id) {
                                await updateHostMapping({ ...hmForm, id: hmEditing.id });
                              } else {
                                await createHostMapping(hmForm);
                              }
                              setHmFormOpen(false);
                              setHmEditing(null);
                            }}
                          >
                            Save Mapping
                          </button>
                        </div>
                      </div>
                    )}
                    {!hmFormOpen && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hostname</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Destination</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {hostMappings.map(m => (
                              <tr key={m.id} className={m.active ? '' : 'opacity-60'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{m.hostname}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{`${m.ip}:${m.port} / ${m.protocol}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {m.active ? (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-slate-50 text-slate-600 border border-slate-200">Inactive</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="Edit" onClick={() => { setHmEditing(m); setHmForm(m); setHmFormOpen(true); }}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded" title="Delete" onClick={() => {
                                    setConfirmTargetId(m.id || null);
                                    setConfirmTargetName(m.hostname);
                                    setConfirmType('hostMapping');
                                    setConfirmOpen(true);
                                  }}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    )}
                  </div>
                )}

                {/* Modal removed: using inline form above */}

                <ConfirmationModal
                  open={confirmOpen}
                  title={confirmType === 'profile' ? 'Delete Profile' : 'Delete Host Mapping'}
                  message={confirmType === 'profile' 
                    ? `Are you sure you want to delete the profile "${confirmTargetName}"? This action cannot be undone.`
                    : `Are you sure you want to delete the host mapping "${confirmTargetName}"? This action cannot be undone.`
                  }
                  confirmText="Delete"
                  cancelText="Cancel"
                  onCancel={() => { 
                    setConfirmOpen(false); 
                    setConfirmTargetId(null); 
                    setConfirmTargetName('');
                  }}
                  onConfirm={async () => {
                    if (confirmTargetId != null) {
                      if (confirmType === 'profile') {
                        await handleDeleteProfile(confirmTargetId);
                      } else {
                        await deleteHostMapping(confirmTargetId);
                      }
                    }
                    setConfirmOpen(false);
                    setConfirmTargetId(null);
                    setConfirmTargetName('');
                  }}
                />

                {toast && (
                  <div className={`fixed bottom-6 right-6 pl-4 pr-2 py-3 rounded-lg shadow-lg border flex items-center ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    <span className="text-sm font-medium mr-2">{toast.message}</span>
                    <button aria-label="Close" className="ml-2 p-1 rounded hover:bg-black/5" onClick={() => setToast(null)}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
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