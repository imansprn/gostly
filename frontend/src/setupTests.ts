import '@testing-library/jest-dom'

// Mock window.go for Wails testing
Object.defineProperty(window, 'go', {
  value: {
    main: {
      App: {
        GetProfiles: () => Promise.resolve([]),
        GetProfile: () => Promise.resolve(null),
        AddProfile: () => Promise.resolve({ id: 1 }),
        UpdateProfile: () => Promise.resolve(true),
        DeleteProfile: () => Promise.resolve(true),
        StartProfile: () => Promise.resolve(true),
        StopProfile: () => Promise.resolve(true),
        GetActivityLogs: () => Promise.resolve([]),
        GetRecentActivityLogs: () => Promise.resolve([]),
        GetLogs: () => Promise.resolve([]),
        GetRecentLogs: () => Promise.resolve([]),
        ClearLogs: () => Promise.resolve(true),
        GetGostDebugInfo: () => Promise.resolve({}),
        IsGostAvailable: () => Promise.resolve(true),
        GetGostVersion: () => Promise.resolve('3.2.4')
      }
    }
  },
  writable: true
})
