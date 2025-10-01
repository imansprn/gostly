import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { TimelineEvent } from '../types';

// Error Boundary Component
class ActivityTimelineErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ActivityTimeline Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">Something went wrong with the Activity Timeline</div>
            <div className="text-sm text-slate-500">Please refresh the page or try again later</div>
            <button 
              onClick={() => this.setState({ hasError: false })} 
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  loading: boolean;
  onRefresh: () => void;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events, loading, onRefresh }) => {
  console.log('ActivityTimeline: Component rendering with props:', { events, loading, onRefresh });
  
  // Validate props to prevent React errors
  if (typeof loading !== 'boolean') {
    console.error('ActivityTimeline: loading prop is not boolean:', loading);
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center py-12">
          <div className="text-red-500">Error: Invalid loading prop</div>
        </div>
      </div>
    );
  }
  
  if (typeof onRefresh !== 'function') {
    console.error('ActivityTimeline: onRefresh prop is not function:', onRefresh);
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center py-12">
          <div className="text-red-500">Error: Invalid onRefresh prop</div>
        </div>
      </div>
    );
  }
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 30d, 90d, all
  const [groupedEvents, setGroupedEvents] = useState<Record<string, TimelineEvent[]>>({});

  // Ensure events is always an array and handle edge cases
  const safeEvents = React.useMemo(() => {
    if (!events) return [];
    if (!Array.isArray(events)) return [];
    return events.filter(event => event && typeof event === 'object');
  }, [events]);

  // Filter and group events
  useEffect(() => {
    console.log('ActivityTimeline: useEffect triggered with:', { safeEvents, activeFilter, searchQuery, dateRange });
    
    try {
      // Validate events array
      if (!Array.isArray(safeEvents)) {
        console.warn('ActivityTimeline: events is not an array:', safeEvents);
        setGroupedEvents({});
        return;
      }
      
      let filteredEvents = safeEvents.filter(event => {
        try {
          // Validate event object
          if (!event || typeof event !== 'object') {
            console.warn('ActivityTimeline: invalid event:', event);
            return false;
          }
          
          // Type filter
          if (activeFilter !== 'all' && event.type !== activeFilter) return false;
          
          // Search filter
          if (searchQuery && !event.action?.toLowerCase().includes(searchQuery.toLowerCase()) && 
              !event.details?.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !(event.profile_name && event.profile_name.toLowerCase().includes(searchQuery.toLowerCase()))) {
            return false;
          }
          
          // Date range filter
          if (dateRange !== 'all') {
            try {
              const eventDate = new Date(event.timestamp);
              if (isNaN(eventDate.getTime())) {
                console.warn('ActivityTimeline: invalid timestamp:', event.timestamp);
                return false;
              }
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
              
              switch (dateRange) {
                case '7d': if (diffDays > 7) return false; break;
                case '30d': if (diffDays > 30) return false; break;
                case '90d': if (diffDays > 90) return false; break;
              }
            } catch (error) {
              console.warn('ActivityTimeline: error processing timestamp:', error);
              return false;
            }
          }
          
          return true;
        } catch (error) {
          console.warn('ActivityTimeline: error filtering event:', error, event);
          return false;
        }
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
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      filteredEvents.forEach(event => {
        try {
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
        } catch (error) {
          console.warn('ActivityTimeline: error processing event:', error, event);
        }
      });

      // Sort events within each group by timestamp (newest first)
      Object.keys(grouped).forEach(key => {
        try {
          grouped[key].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
          console.warn('ActivityTimeline: error sorting events for period:', key, error);
        }
      });

      console.log('ActivityTimeline: Setting grouped events:', grouped);
      setGroupedEvents(grouped);
    } catch (error) {
      console.error('ActivityTimeline: error in useEffect:', error);
      setGroupedEvents({});
    }
  }, [safeEvents, activeFilter, searchQuery, dateRange]);

  // Get event icon - minimalist approach
  const getEventIcon = React.useCallback((type: string, action: string) => {
    try {
      // Only show icons for critical actions
      if (action?.includes('error') || action?.includes('fail')) return '•';
      if (action?.includes('start')) return '•';
      if (action?.includes('stop')) return '•';
      
      return '';
    } catch (error) {
      console.warn('ActivityTimeline: error getting event icon:', error);
      return '';
    }
  }, []);

  // Get event color
  const getEventColor = React.useCallback((status: string) => {
    try {
      switch (status) {
        case 'success': return 'border-green-500 bg-green-50';
        case 'warning': return 'border-yellow-500 bg-yellow-50';
        case 'error': return 'border-red-500 bg-red-50';
        default: return 'border-slate-300 bg-slate-50';
      }
    } catch (error) {
      console.warn('ActivityTimeline: error getting event color:', error);
      return 'border-slate-300 bg-slate-50';
    }
  }, []);

  // Format timestamp
  const formatTimestamp = React.useCallback((timestamp: string) => {
    try {
      if (!timestamp) return 'Invalid time';
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid time';
      
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
    } catch (error) {
      console.warn('ActivityTimeline: error formatting timestamp:', error);
      return 'Invalid time';
    }
  }, []);

  // Export timeline
  const exportTimeline = React.useCallback(() => {
    try {
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
    } catch (error) {
      console.error('ActivityTimeline: error exporting timeline:', error);
    }
  }, [groupedEvents]);

  // Get total event count
  const totalEvents = React.useMemo(() => {
    try {
      return Object.values(groupedEvents).reduce((sum, events) => sum + events.length, 0);
    } catch (error) {
      console.warn('ActivityTimeline: error calculating total events:', error);
      return 0;
    }
  }, [groupedEvents]);

  // Add safety check
  if (!safeEvents) {
    console.log('ActivityTimeline: No safe events, showing loading state');
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center py-12">
          <div className="text-slate-500">Loading activity timeline...</div>
        </div>
      </div>
    );
  }

  console.log('ActivityTimeline: Rendering with totalEvents:', totalEvents);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-medium text-slate-900">Activity Timeline</h3>
          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
            <span>{totalEvents} events</span>
            <span>{safeEvents.filter(e => e.type === 'proxy_action').length} proxy</span>
            <span>{safeEvents.filter(e => e.type === 'configuration').length} config</span>
            <span>{safeEvents.filter(e => e.type === 'host_mapping').length} host</span>
            <span>{safeEvents.filter(e => e.type === 'error').length} errors</span>
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
          
          <button
            onClick={exportTimeline}
            disabled={totalEvents === 0}
            className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors disabled:opacity-50"
          >
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4 p-2 bg-slate-50 rounded">
        <div className="flex items-center space-x-2">
          {/* Event Type Filter */}
          <div className="flex space-x-1">
            {['all', 'proxy_action', 'configuration', 'host_mapping', 'system', 'error'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeFilter === filter
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {filter === 'all' ? 'All' : 
                 filter === 'proxy_action' ? 'Proxy' :
                 filter === 'configuration' ? 'Config' :
                 filter === 'host_mapping' ? 'Host' :
                 filter === 'system' ? 'System' : 'Errors'}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:border-slate-300 pr-8"
          >
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-6 pr-2 py-1 text-xs border border-slate-200 rounded bg-white focus:border-slate-300 w-32"
          />
          <svg className="absolute left-1.5 top-1.5 h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Timeline Display */}
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([period, events]) => {
          if (events.length === 0) return null;
          
          return (
            <div key={period} className="relative">
              {/* Period Header */}
              <div className="flex items-center mb-3">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-2"></div>
                <h4 className="text-sm font-medium text-slate-600">{period}</h4>
                <span className="ml-2 text-xs text-slate-400">({events.length})</span>
              </div>

              {/* Events Timeline */}
              <div className="space-y-2 ml-4">
                {events.map((event, index) => (
                  <div key={event.id} className="relative">
                    {/* Timeline Line */}
                    {index < events.length - 1 && (
                      <div className="absolute left-2 top-6 w-px h-4 bg-slate-200"></div>
                    )}
                    
                    {/* Event Dot */}
                    <div className="absolute left-1.5 top-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    
                    {/* Event Content */}
                    <div className="ml-6 p-3 border-l border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-start space-x-3 mb-1">
                        <span className="text-xs text-slate-500 w-16">{formatTimestamp(event.timestamp)}</span>
                        <span className="text-xs text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded">
                          {event.type?.replace('_', ' ') || 'unknown'}
                        </span>
                        <span className="text-sm text-slate-700 font-medium">{event.action}</span>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-2">{event.details}</p>
                      
                      {/* Event Metadata - Only show if exists */}
                      {(event.profile_name || event.user || event.duration) && (
                        <div className="flex items-center space-x-3 text-xs text-slate-400">
                          {event.profile_name && event.profile_name.trim() !== '' && (
                            <span>{event.profile_name}</span>
                          )}
                          {event.user && (
                            <span>{event.user}</span>
                          )}
                          {event.duration && (
                            <span>{event.duration}</span>
                          )}
                        </div>
                      )}
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
        <div className="text-center py-8">
          {searchQuery || activeFilter !== 'all' || dateRange !== 'all' ? (
            <div>
              <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-slate-500">No events match your filters</p>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-500">No activity events available</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      {totalEvents > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
          Showing {totalEvents} of {safeEvents.length} total events
          {searchQuery && ` • Filtered by "${searchQuery}"`}
          {activeFilter !== 'all' && ` • Type: ${activeFilter}`}
          {dateRange !== 'all' && ` • Range: ${dateRange}`}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
