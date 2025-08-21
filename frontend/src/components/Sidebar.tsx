import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, collapsed }) => {
  const navItems = [
    {
      id: 'proxies',
      label: 'Proxy Configurations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      description: 'Manage proxy profiles'
    },
    {
      id: 'logs',
      label: 'Logs & Monitoring',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Real-time logs and status'
    },
    {
      id: 'timeline',
      label: 'Activity Timeline',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'History and changes'
    },
    {
      id: 'advanced',
      label: 'Advanced Config',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'Raw GOST configuration'
    }
  ];

  if (collapsed) {
    return (
      <div className="w-16 bg-white border-r border-slate-200 flex flex-col">
        {/* Collapsed Sidebar - Icons Only */}
        <div className="p-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <img src="/logo.png" alt="Gostly" className="w-5 h-5 object-contain" />
          </div>
        </div>
        
        <nav className="flex-1 p-2 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full p-2 rounded-lg transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={`${item.label} - ${item.description}`}
            >
              <div className="flex items-center justify-center">
                <div className={`${
                  activeTab === item.id ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'
                }`}>
                  {item.icon}
                </div>
              </div>
            </button>
          ))}
        </nav>
        
        <div className="p-2 border-t border-slate-100">
          <div className="text-xs text-slate-400 text-center">v1.0</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Navigation</h2>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
              activeTab === item.id
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`${
                activeTab === item.id ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'
              }`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className={`text-xs ${
                  activeTab === item.id ? 'text-slate-600' : 'text-slate-400 group-hover:text-slate-500'
                }`}>
                  {item.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </nav>
      
      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="text-xs text-slate-400 text-center">
          GOST Proxy Manager v1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
