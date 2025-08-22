import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, LogFilter } from '../types';

interface LogsMonitorProps {
  logs: LogEntry[];
  loading: boolean;
  onRefresh: () => void;
  onClearLogs: () => void;
}

const LogsMonitor: React.FC<LogsMonitorProps> = ({ logs, loading, onRefresh, onClearLogs }) => {
  const [filter, setFilter] = useState<LogFilter>({
    level: 'all',
    source: 'all',
    searchQuery: '',
    profileId: undefined
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'txt' | 'csv'>('txt');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [logStats, setLogStats] = useState({
    total: 0,
    info: 0,
    warn: 0,
    error: 0,
    debug: 0,
    lastUpdated: new Date()
  });

  // Update stats when logs change
  useEffect(() => {
    const stats = {
      total: logs.length,
      info: logs.filter(log => log.level === 'INFO').length,
      warn: logs.filter(log => log.level === 'WARN').length,
      error: logs.filter(log => log.level === 'ERROR').length,
      debug: logs.filter(log => log.level === 'DEBUG').length,
      lastUpdated: new Date()
    };
    setLogStats(stats);
  }, [logs]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && !paused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, paused]);

  // Filter logs based on current filter
  const filteredLogs = logs.filter(log => {
    if (filter.level !== 'all' && log.level !== filter.level) return false;
    if (filter.source !== 'all' && log.source !== filter.source) return false;
    if (filter.searchQuery && !log.message.toLowerCase().includes(filter.searchQuery.toLowerCase())) return false;
    if (filter.profileId && log.profile_id !== filter.profileId) return false;
    return true;
  });

  // Get unique sources for filter dropdown
  const uniqueSources = Array.from(new Set(logs.map(log => log.source)));

  // Export logs
  const exportLogs = () => {
    const data = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      source: log.source,
      message: log.message,
      profile_name: log.profile_name || ''
    }));

    let content = '';
    let filename = `gostly-logs-${new Date().toISOString().split('T')[0]}`;

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename += '.json';
        break;
      case 'csv':
        content = 'Timestamp,Level,Source,Message,Profile\n';
        content += data.map(log => 
          `"${log.timestamp}","${log.level}","${log.source}","${log.message}","${log.profile_name}"`
        ).join('\n');
        filename += '.csv';
        break;
      case 'txt':
        content = data.map(log => 
          `[${log.timestamp}] [${log.level}] [${log.source}] ${log.profile_name ? `(${log.profile_name})` : ''} ${log.message}`
        ).join('\n');
        filename += '.txt';
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString();
  };

  // Get level color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-900/20';
      case 'WARN': return 'text-yellow-400 bg-yellow-900/20';
      case 'INFO': return 'text-blue-400 bg-blue-900/20';
      case 'DEBUG': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-slate-400 bg-slate-900/20';
    }
  };

  // Get level icon
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return '🔴';
      case 'WARN': return '🟡';
      case 'INFO': return '🔵';
      case 'DEBUG': return '⚪';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Real-time Logs & Monitoring</h3>
          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
            <span>{logStats.total} entries</span>
            <span className="text-blue-600">{logStats.info} INFO</span>
            <span className="text-yellow-600">{logStats.warn} WARN</span>
            <span className="text-red-600">{logStats.error} ERROR</span>
            <span className="text-gray-600">{logStats.debug} DEBUG</span>
            <span>Last updated {formatTimestamp(logStats.lastUpdated.toISOString())}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              '🔄 Refresh'
            )}
          </button>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center space-x-4">
          {/* Level Filter */}
          <select
            value={filter.level}
            onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          {/* Source Filter */}
          <select
            value={filter.source}
            onChange={(e) => setFilter(prev => ({ ...prev, source: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search logs..."
              value={filter.searchQuery}
              onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
            />
            <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Auto-scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
              autoScroll 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {autoScroll ? '🔄 Auto-scroll ON' : '⏸️ Auto-scroll OFF'}
          </button>

          {/* Pause/Resume */}
          <button
            onClick={() => setPaused(!paused)}
            className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
              paused 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            {paused ? '▶️ Resume' : '⏸️ Pause'}
          </button>

          {/* Export */}
          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'txt' | 'csv')}
              className="px-2 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="txt">TXT</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <button
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
              className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              📥 Export
            </button>
          </div>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors duration-200 disabled:opacity-50"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Logs Display */}
      <div className="bg-slate-900 text-slate-100 rounded-lg font-mono text-sm h-96 overflow-auto relative">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            {filter.searchQuery || filter.level !== 'all' || filter.source !== 'all' ? (
              <div className="text-center">
                <div className="text-2xl mb-2">🔍</div>
                <div>No logs match your current filters</div>
                <div className="text-sm text-slate-500 mt-1">Try adjusting your search criteria</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl mb-2">📝</div>
                <div>No logs available</div>
                <div className="text-sm text-slate-500 mt-1">Logs will appear here as you use the application</div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 hover:bg-slate-800 p-1 rounded transition-colors duration-150">
                <span className="text-xs text-slate-500 w-16 flex-shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getLevelColor(log.level)}`}>
                  {getLevelIcon(log.level)} {log.level}
                </span>
                <span className="text-blue-400 text-xs w-20 flex-shrink-0">
                  [{log.source}]
                </span>
                {log.profile_name && (
                  <span className="text-purple-400 text-xs flex-shrink-0">
                    ({log.profile_name})
                  </span>
                )}
                <span className="text-slate-100 flex-1 break-words">
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 text-xs text-slate-500 text-center">
        Showing {filteredLogs.length} of {logs.length} total logs
        {filter.searchQuery && ` • Filtered by "${filter.searchQuery}"`}
        {filter.level !== 'all' && ` • Level: ${filter.level}`}
        {filter.source !== 'all' && ` • Source: ${filter.source}`}
      </div>
    </div>
  );
};

export default LogsMonitor;
