export interface Profile {
  id: number;
  name: string;
  type: string;
  listen: string;
  remote: string;
  username: string;
  password: string;
  status: string;
}

export interface GostStatus {
  available: boolean;
  version: string;
  autoInstalled: boolean;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
  profile_id?: number;
  profile_name?: string;
}

export interface ActivityLog {
  id: number;
  profile_id: number;
  profile_name: string;
  action: string;
  details: string;
  timestamp: string;
  status: string;
}

export interface LogFilter {
  level: string;
  source: string;
  searchQuery: string;
  profileId?: number;
}

export interface TimelineEvent {
  id: number;
  type: 'proxy_action' | 'configuration' | 'system' | 'error' | 'host_mapping';
  action: string;
  details: string;
  timestamp: string;
  profile_name?: string;
  status: 'success' | 'warning' | 'error';
  user?: string;
  duration?: string;
}

export interface ConfigurationTemplate {
  name: string;
  description: string;
  config: string;
  type: 'http' | 'socks5' | 'shadowsocks' | 'vmess' | 'trojan';
}

// Extend Window interface to include Wails go property
declare global {
  interface Window {
    go?: {
      main?: {
        App?: any;
      };
    };
  }
}