import React, { useState } from 'react';

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  connectionStatus: {
    isConnected: boolean;
    activeProfiles: number;
    totalProfiles: number;
  };
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, sidebarCollapsed, connectionStatus }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side - Logo and Search */}
        <div className="flex items-center space-x-6">
          {/* App Name/Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden logo-transparent">
              {/* PNG Logo */}
              <img 
                src="/logo.png" 
                alt="Gostly Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Gostly</h1>
              <p className="text-xs text-slate-500">GOST Proxy Manager</p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Status and Controls */}
        <div className="flex items-center space-x-4">
          {/* Quick Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              connectionStatus.isConnected ? 'text-green-700' : 'text-red-700'
            }`}>
              {connectionStatus.isConnected 
                ? `Connected (${connectionStatus.activeProfiles}/${connectionStatus.totalProfiles})`
                : 'Disconnected'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
