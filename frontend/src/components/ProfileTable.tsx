import React from 'react';
import { Profile } from '../types';

interface ProfileTableProps {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  onEdit: (profile: Profile) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, start: boolean) => void;
}

const ProfileTable: React.FC<ProfileTableProps> = ({
  profiles,
  loading,
  error,
  onEdit,
  onDelete,
  onToggle
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center py-16">
          <div className="inline-flex items-center px-4 py-2 bg-slate-50 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-slate-600 font-medium">Loading profiles...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Profiles</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200"
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
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No profiles yet</h3>
            <p className="text-slate-600 mb-6">Create your first proxy profile to get started</p>
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
      'forward': 'bg-blue-100 text-blue-800',
      'reverse': 'bg-purple-100 text-purple-800',
      'http': 'bg-green-100 text-green-800',
      'tcp': 'bg-orange-100 text-orange-800',
      'udp': 'bg-yellow-100 text-yellow-800',
      'ss': 'bg-indigo-100 text-indigo-800'
    };
    return colorMap[type] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-medium text-slate-900">Active Proxies</h3>
        <p className="text-sm text-slate-600 mt-1">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</p>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Source → Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-slate-50 transition-colors duration-150">
                {/* Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{profile.name}</div>
                    <div className="text-xs text-slate-500">ID: {profile.id}</div>
                  </div>
                </td>
                
                {/* Mode */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModeColor(profile.type)}`}>
                    {getModeLabel(profile.type)}
                  </span>
                </td>
                
                {/* Source → Destination */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">
                    <span className="font-mono">{profile.listen}</span>
                    <span className="mx-2 text-slate-400">→</span>
                    <span className="font-mono">{profile.remote}</span>
                  </div>
                  {profile.username && (
                    <div className="text-xs text-slate-500 mt-1">
                      Auth: {profile.username}•••
                    </div>
                  )}
                </td>
                
                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile.status === 'running' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      profile.status === 'running' ? 'bg-green-400' : 'bg-slate-400'
                    }`}></span>
                    {profile.status === 'running' ? 'Running' : 'Stopped'}
                  </span>
                </td>
                
                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(profile)}
                      className="text-slate-600 hover:text-slate-900 p-1 rounded transition-colors duration-150"
                      title="Edit Profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => onToggle(profile.id, profile.status !== 'running')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        profile.status === 'running'
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {profile.status === 'running' ? 'Stop' : 'Start'}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this profile?')) {
                          onDelete(profile.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 p-1 rounded transition-colors duration-150"
                      title="Delete Profile"
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
  );
};

export default ProfileTable;
