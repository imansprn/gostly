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