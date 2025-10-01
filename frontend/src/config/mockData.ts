import { Profile, TimelineEvent, LogEntry } from '../types';

export const mockProfiles: Profile[] = [
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
    username: 'demo-user',
    password: 'demo-password',
    status: 'running'
  }
];

export const mockTimelineEvents = [
  {
    id: 1,
    type: 'configuration' as const,
    action: 'Profile Created',
    details: 'New SOCKS5 proxy profile created',
    timestamp: '2024-01-01T10:00:00Z',
    profile_name: 'SOCKS5 Proxy',
    status: 'success' as const,
    user: 'admin',
    duration: '2s'
  },
  {
    id: 2,
    type: 'proxy_action' as const,
    action: 'Service Started',
    details: 'SOCKS5 proxy service started on port 1080',
    timestamp: '2024-01-01T10:05:00Z',
    profile_name: 'SOCKS5 Proxy',
    status: 'success' as const,
    user: 'admin',
    duration: '1s'
  },
  {
    id: 3,
    type: 'host_mapping' as const,
    action: 'Host Router Started',
    details: 'Custom host mapping router started on port 8080',
    timestamp: '2024-01-01T10:10:00Z',
    status: 'success' as const,
    user: 'admin',
    duration: '3s'
  },
  {
    id: 4,
    type: 'host_mapping' as const,
    action: 'Host Mapping Added',
    details: 'Added host mapping: example.local -> 127.0.0.1:3000',
    timestamp: '2024-01-01T10:12:00Z',
    status: 'success' as const,
    user: 'admin',
    duration: '1s'
  },
  {
    id: 5,
    type: 'system' as const,
    action: 'GOST Installation',
    details: 'GOST binary automatically installed',
    timestamp: '2024-01-01T09:55:00Z',
    status: 'success' as const,
    user: 'system',
    duration: '5s'
  }
];

export const mockLogEntries = [
  {
    id: 1,
    timestamp: '2024-01-01T10:00:00Z',
    level: 'INFO' as const,
    source: 'gost',
    message: 'Starting SOCKS5 proxy on :1080',
    profile_id: 1,
    profile_name: 'SOCKS5 Proxy'
  },
  {
    id: 2,
    timestamp: '2024-01-01T10:00:01Z',
    level: 'INFO' as const,
    source: 'gost',
    message: 'SOCKS5 proxy started successfully',
    profile_id: 1,
    profile_name: 'SOCKS5 Proxy'
  },
  {
    id: 3,
    timestamp: '2024-01-01T10:05:00Z',
    level: 'INFO' as const,
    source: 'system',
    message: 'Profile SOCKS5 Proxy activated',
    profile_id: 1,
    profile_name: 'SOCKS5 Proxy'
  }
];
