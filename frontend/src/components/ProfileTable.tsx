import React, { useState } from 'react';
import { Profile } from '../types';

interface ProfileTableProps {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  onEdit: (profile: Profile) => void;
  onDelete: (id: number) => void;
  onDeleteConfirm: (id: number, profileName: string) => void;
  onToggle: (id: number, start: boolean) => void;
  gostAvailable?: boolean;
}

const ProfileTable: React.FC<ProfileTableProps> = ({
  profiles,
  loading,
  error,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onToggle,
  gostAvailable
}) => {
  const [selectedProfiles, setSelectedProfiles] = useState<Set<number>>(new Set());

  const handleSelectAll = () => {
    if (selectedProfiles.size === profiles.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(profiles.map(p => p.id)));
    }
  };

  const handleSelectProfile = (id: number) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProfiles(newSelected);
  };

  const formatAddress = (address: string) => {
    if (address.startsWith(':')) {
      return `Local :${address.slice(1)}`;
    }
    if (address.includes(':')) {
      const [host, port] = address.split(':');
      if (host === '127.0.0.1' || host === 'localhost') {
        return `Local ${host}:${port}`;
      }
      return `Remote ${host}:${port}`;
    }
    return address;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-8">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-slate-50 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
              <span className="text-slate-600 font-medium">Loading proxy profiles...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Profiles</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">No proxy profiles yet</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Create your first proxy profile to start managing network connections. 
              You can set up HTTP proxies, SOCKS servers, or TCP forwarding rules.
            </p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>💡 <strong>Tip:</strong> Start with an HTTP proxy for web traffic</p>
              <p>🔒 <strong>Security:</strong> Add authentication for sensitive connections</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getModeLabel = (type: string) => {
    const modeMap: { [key: string]: string } = {
      'forward': 'Forward Proxy',
      'reverse': 'Reverse Proxy',
      'http': 'HTTP Proxy',
      'tcp': 'TCP Forwarding',
      'udp': 'UDP Forwarding',
      'ss': 'Shadowsocks'
    };
    return modeMap[type] || type;
  };

  const getModeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'forward': 'bg-blue-100 text-blue-800 border-blue-200',
      'reverse': 'bg-purple-100 text-purple-800 border-purple-200',
      'http': 'bg-green-100 text-green-800 border-green-200',
      'tcp': 'bg-orange-100 text-orange-800 border-orange-200',
      'udp': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ss': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colorMap[type] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getStatusColor = (status: string) => {
    return status === 'running' 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
      : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusIcon = (status: string) => {
    return status === 'running' ? (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* GOST Availability Warning */}
      {gostAvailable === false && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-slate-800">GOST Engine Not Available</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                GOST proxy engine not accessible. Restart app for auto-installation or install manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedProfiles.size > 0 && (
        <div className="bg-white rounded border border-slate-200 p-3 border-l-2 border-l-slate-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-700">
                {selectedProfiles.size} selected
              </span>
              <button
                onClick={() => setSelectedProfiles(new Set())}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  selectedProfiles.forEach(id => onToggle(id, true));
                  setSelectedProfiles(new Set());
                }}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                Start
              </button>
              
              <button
                onClick={() => {
                  selectedProfiles.forEach(id => onToggle(id, false));
                  setSelectedProfiles(new Set());
                }}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                Stop
              </button>
              
              <button
                onClick={() => {
                  const selectedProfilesList = Array.from(selectedProfiles);
                  const profileNames = selectedProfilesList.map(id => 
                    profiles.find(p => p.id === id)?.name || `Profile ${id}`
                  ).join(', ');
                  onDeleteConfirm(selectedProfilesList[0], `Multiple profiles: ${profileNames}`);
                  setSelectedProfiles(new Set());
                }}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-red-200 text-slate-700 hover:text-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
      {/* Table Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-slate-900">Proxy Profiles</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {profiles.length} profile{profiles.length !== 1 ? 's' : ''} • {profiles.filter(p => p.status === 'running').length} active
              </p>
            </div>
          </div>
      </div>
      
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="p-3 space-y-3">
            {profiles.map((profile) => (
              <div 
                key={profile.id}
                className={`bg-white border rounded p-3 space-y-2 ${
                  selectedProfiles.has(profile.id) ? 'border-slate-400 bg-slate-50' : 'border-slate-200'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.has(profile.id)}
                      onChange={() => handleSelectProfile(profile.id)}
                      className="w-3 h-3 text-slate-600 bg-white border-slate-300 rounded focus:ring-slate-500 focus:ring-1"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{profile.name}</div>
                        <div className="text-xs text-slate-500">#{profile.id.toString().padStart(3, '0')}</div>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(profile.status)}`}>
                    <span className="mr-1">{getStatusIcon(profile.status)}</span>
                    {profile.status === 'running' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Card Content */}
                <div className="space-y-2">
                  {/* Type */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Type:</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getModeColor(profile.type)}`}>
                      {getModeLabel(profile.type)}
                    </span>
                  </div>

                  {/* Connection */}
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Connection:</div>
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded flex-1 text-center">
                        {formatAddress(profile.listen)}
                      </span>
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded flex-1 text-center">
                        {formatAddress(profile.remote)}
                      </span>
                    </div>
                    {profile.username && (
                      <div className="text-xs text-slate-500 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Auth: {profile.username}•••</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => onToggle(profile.id, profile.status !== 'running')}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        profile.status === 'running'
                          ? 'bg-slate-100 hover:bg-red-200 text-slate-700 hover:text-red-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={profile.status === 'running' ? 'Stop proxy' : 'Start proxy'}
                    >
                      {profile.status === 'running' ? 'Stop' : 'Start'}
                    </button>
                    
                    <button
                      onClick={() => onEdit(profile)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title="Edit profile"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => onDeleteConfirm(profile.id, profile.name)}
                      className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Delete profile"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

                {/* Desktop Table View */}
        <div className="hidden lg:block">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
                <th className="px-3 py-3 text-left w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.size === profiles.length && profiles.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-slate-800 bg-white border-slate-300 rounded focus:ring-slate-500 focus:ring-2"
                    />
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Profile
              </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Type
              </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Connection
              </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Status
              </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-slate-100">
            {profiles.map((profile) => (
                <tr 
                  key={profile.id} 
                  className={`hover:bg-slate-50 transition-all duration-150 group ${
                    selectedProfiles.has(profile.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  {/* Checkbox */}
                    <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.has(profile.id)}
                      onChange={() => handleSelectProfile(profile.id)}
                      className="w-4 h-4 text-slate-800 bg-white border-slate-300 rounded focus:ring-slate-500 focus:ring-2"
                    />
                  </td>
                  
                  {/* Profile Name */}
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition-colors truncate">
                          {profile.name}
                        </div>
                        <div className="text-xs text-slate-500">
                            #{profile.id.toString().padStart(3, '0')}
                        </div>
                      </div>
                  </div>
                </td>
                
                  {/* Type */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getModeColor(profile.type)}`}>
                    {getModeLabel(profile.type)}
                  </span>
                </td>
                
                  {/* Connection */}
                    <td className="px-3 py-3">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs truncate max-w-[80px]" title={formatAddress(profile.listen)}>
                          {formatAddress(profile.listen)}
                        </span>
                          <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                          <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs truncate max-w-[80px]" title={formatAddress(profile.remote)}>
                          {formatAddress(profile.remote)}
                        </span>
                  </div>
                  {profile.username && (
                        <div className="text-xs text-slate-500 flex items-center space-x-1">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                            <span className="truncate">Auth: {profile.username}•••</span>
                        </div>
                      )}
                    </div>
                </td>
                
                {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(profile.status)}`}>
                        <span className="mr-1">{getStatusIcon(profile.status)}</span>
                      {profile.status === 'running' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                
                {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onToggle(profile.id, profile.status !== 'running')}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                          profile.status === 'running'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                        title={profile.status === 'running' ? 'Stop proxy' : 'Start proxy'}
                      >
                        {profile.status === 'running' ? 'Stop' : 'Start'}
                      </button>
                      
                    <button
                      onClick={() => onEdit(profile)}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-all duration-150"
                        title="Edit profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => onDeleteConfirm(profile.id, profile.name)}
                      className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-all duration-150"
                      title="Delete profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default ProfileTable;
