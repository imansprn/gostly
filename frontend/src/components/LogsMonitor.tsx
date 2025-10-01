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

  // Sort logs by datetime descending (newest first)
  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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

  // Format timestamp to full datetime: YYYY-MM-DD HH:mm:ss
  const formatTimestamp = (timestamp: string) => {
    const d = new Date(timestamp);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-medium text-slate-900">Logs & Monitoring</h3>
          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
            <span>{logStats.total} entries</span>
            <span>{logStats.info} info</span>
            <span>{logStats.warn} warn</span>
            <span>{logStats.error} error</span>
            <span>{logStats.debug} debug</span>
            <span>Updated {formatTimestamp(logStats.lastUpdated.toISOString())}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex items-center justify-between mb-4 p-2 bg-slate-50 rounded">
        <div className="flex items-center space-x-2">
          {/* Level Filter */}
          <select
            value={filter.level}
            onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:border-slate-300 pr-8"
          >
            <option value="all">All</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          {/* Source Filter */}
          <select
            value={filter.source}
            onChange={(e) => setFilter(prev => ({ ...prev, source: e.target.value }))}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:border-slate-300 pr-8"
          >
            <option value="all">All</option>
            {uniqueSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={filter.searchQuery}
              onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-6 pr-2 py-1 text-xs border border-slate-200 rounded bg-white focus:border-slate-300 w-32"
            />
            <svg className="absolute left-1.5 top-1.5 h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Export */}
          <div className="flex items-center space-x-1">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'txt' | 'csv')}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:border-slate-300 pr-8"
            >
              <option value="txt">TXT</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <button
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors disabled:opacity-50"
            >
              Export
            </button>
          </div>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="px-2 py-1 text-xs bg-slate-100 hover:bg-red-200 text-slate-600 hover:text-red-700 rounded transition-colors disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Logs Display */}
      <div className="bg-slate-900 text-slate-100 rounded font-mono text-xs h-80 overflow-auto relative">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            {filter.searchQuery || filter.level !== 'all' || filter.source !== 'all' ? (
              <div className="text-center">
                <svg className="w-6 h-6 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div className="text-xs">No logs match your filters</div>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-6 h-6 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-xs">No logs available</div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-0.5">
            {sortedLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 hover:bg-slate-800 p-1 rounded transition-colors">
                <span className="text-xs text-slate-500 w-40 flex-shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getLevelColor(log.level)}`}>
                  {getLevelIcon(log.level)} {log.level}
                </span>
                <span className="text-blue-400 text-xs w-16 flex-shrink-0">
                  [{log.source}]
                </span>
                {log.profile_name && (
                  <span className="text-purple-400 text-xs flex-shrink-0">
                    ({log.profile_name})
                  </span>
                )}
                <span className="text-slate-100 flex-1 break-words text-xs">
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-2 text-xs text-slate-400 text-center">
        {filteredLogs.length} of {logs.length} logs
        {filter.searchQuery && ` • "${filter.searchQuery}"`}
        {filter.level !== 'all' && ` • ${filter.level}`}
        {filter.source !== 'all' && ` • ${filter.source}`}
      </div>
    </div>
  );
};

export default LogsMonitor;
