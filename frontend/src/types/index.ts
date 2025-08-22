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