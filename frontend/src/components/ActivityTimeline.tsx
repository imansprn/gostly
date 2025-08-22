import React, { useState, useEffect } from 'react';
import { TimelineEvent } from '../types';

interface ActivityTimelineProps {
  events: TimelineEvent[];
  loading: boolean;
  onRefresh: () => void;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events, loading, onRefresh }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, all
  const [groupedEvents, setGroupedEvents] = useState<Record<string, TimelineEvent[]>>({});

  // Filter and group events
  useEffect(() => {
    let filteredEvents = events.filter(event => {
      // Type filter
      if (activeFilter !== 'all' && event.type !== activeFilter) return false;
      
      // Search filter
      if (searchQuery && !event.action.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !event.details.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(event.profile_name && event.profile_name.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }
      
      // Date range filter
      if (dateRange !== 'all') {
        const eventDate = new Date(event.timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateRange) {
          case '7d': if (diffDays > 7) return false; break;
          case '30d': if (diffDays > 30) return false; break;
          case '90d': if (diffDays > 90) return false; break;
        }
      }
      
      return true;
    });

    // Group events by time period
    const grouped: Record<string, TimelineEvent[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());

    filteredEvents.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      if (eventDay.getTime() === today.getTime()) {
        grouped['Today'].push(event);
      } else if (eventDay.getTime() === yesterday.getTime()) {
        grouped['Yesterday'].push(event);
      } else if (eventDay.getTime() >= weekAgo.getTime()) {
        grouped['This Week'].push(event);
      } else if (eventDay.getTime() >= monthAgo.getTime()) {
        grouped['This Month'].push(event);
      } else {
        grouped['Older'].push(event);
      }
    });

    // Sort events within each group by timestamp (newest first)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    setGroupedEvents(grouped);
  }, [events, activeFilter, searchQuery, dateRange]);

  // Get event icon
  const getEventIcon = (type: string, action: string) => {
    if (action.includes('start')) return '▶️';
    if (action.includes('stop')) return '⏹️';
    if (action.includes('config') || action.includes('update')) return '⚙️';
    if (action.includes('error') || action.includes('fail')) return '❌';
    if (action.includes('create')) return '➕';
    if (action.includes('delete')) return '🗑️';
    
    switch (type) {
      case 'proxy_action': return '🔗';
      case 'configuration': return '⚙️';
      case 'system': return '🖥️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  // Get event color
  const getEventColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-slate-300 bg-slate-50';
    }
  };

  // Get status indicator
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'success': return '🟢';
      case 'warning': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Export timeline
  const exportTimeline = () => {
    const data = Object.entries(groupedEvents)
      .filter(([_, events]) => events.length > 0)
      .map(([period, events]) => ({
        period,
        events: events.map(event => ({
          timestamp: event.timestamp,
          type: event.type,
          action: event.action,
          details: event.details,
          profile_name: event.profile_name || '',
          status: event.status,
          user: event.user || '',
          duration: event.duration || ''
        }))
      }));

    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gostly-timeline-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get total event count
  const totalEvents = Object.values(groupedEvents).reduce((sum, events) => sum + events.length, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Activity Timeline</h3>
          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
            <span>{totalEvents} events</span>
            <span className="text-blue-600">{events.filter(e => e.type === 'proxy_action').length} Proxy Actions</span>
            <span className="text-purple-600">{events.filter(e => e.type === 'configuration').length} Config Changes</span>
            <span className="text-red-600">{events.filter(e => e.type === 'error').length} Errors</span>
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
          
          <button
            onClick={exportTimeline}
            disabled={totalEvents === 0}
            className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors duration-200 disabled:opacity-50"
          >
            📥 Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center space-x-4">
          {/* Event Type Filter */}
          <div className="flex space-x-1">
            {['all', 'proxy_action', 'configuration', 'system', 'error'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                  activeFilter === filter
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {filter === 'all' ? 'All Events' : 
                 filter === 'proxy_action' ? 'Proxy Actions' :
                 filter === 'configuration' ? 'Configuration' :
                 filter === 'system' ? 'System' : 'Errors'}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
          <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([period, events]) => {
          if (events.length === 0) return null;
          
          return (
            <div key={period} className="relative">
              {/* Period Header */}
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <h4 className="text-md font-medium text-slate-700">{period}</h4>
                <span className="ml-2 text-sm text-slate-500">({events.length} events)</span>
              </div>

              {/* Events */}
              <div className="space-y-3 ml-6">
                {events.map((event, index) => (
                  <div key={event.id} className="relative">
                    {/* Timeline Line */}
                    {index < events.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-8 bg-slate-200"></div>
                    )}
                    
                    {/* Event Dot */}
                    <div className="absolute left-3 top-2 w-2 h-2 bg-slate-400 rounded-full"></div>
                    
                    {/* Event Content */}
                    <div className={`ml-8 p-4 border-l-4 rounded-lg ${getEventColor(event.status)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{getEventIcon(event.type, event.action)}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-slate-900">{event.action}</span>
                              <span className="text-sm text-slate-500">{formatTimestamp(event.timestamp)}</span>
                              <span className="text-sm">{getStatusIndicator(event.status)}</span>
                            </div>
                            
                            <p className="text-slate-700 mb-2">{event.details}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              {event.profile_name && (
                                <span className="flex items-center space-x-1">
                                  <span>🔗</span>
                                  <span>{event.profile_name}</span>
                                </span>
                              )}
                              {event.user && (
                                <span className="flex items-center space-x-1">
                                  <span>👤</span>
                                  <span>{event.user}</span>
                                </span>
                              )}
                              {event.duration && (
                                <span className="flex items-center space-x-1">
                                  <span>⏱️</span>
                                  <span>{event.duration}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {totalEvents === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No activity yet</h3>
          <p className="text-slate-600">
            {searchQuery || activeFilter !== 'all' || dateRange !== 'all' 
              ? 'No events match your current filters. Try adjusting your criteria.'
              : 'Activity events will appear here as you manage profiles and configurations.'
            }
          </p>
        </div>
      )}

      {/* Footer Info */}
      {totalEvents > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
          Showing {totalEvents} of {events.length} total events
          {searchQuery && ` • Filtered by "${searchQuery}"`}
          {activeFilter !== 'all' && ` • Type: ${activeFilter}`}
          {dateRange !== 'all' && ` • Range: ${dateRange}`}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
