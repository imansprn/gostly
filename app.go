package main

import (
	"context"
	"fmt"
	"sync"

	"github.com/imansprn/gostly/pkg/api"
	"github.com/imansprn/gostly/pkg/database"
)

var (
	globalApiOnce sync.Once
	globalApi     *api.API
	globalApiErr  error
)

// App struct
type App struct {
	ctx      context.Context
	api      *api.API
	apiMutex sync.Mutex
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// ensureAPI lazily initializes the API if it isn't ready yet
func (a *App) ensureAPI() error {
	if a.api != nil {
		fmt.Printf("ensureAPI: already initialized\n")
		return nil
	}
	// Guard concurrent init per-process (not just per-instance)
	globalApiOnce.Do(func() {
		fmt.Printf("ensureAPI: creating API instance...\n")
		ap, err := api.New()
		if err != nil {
			fmt.Printf("ensureAPI: api.New error: %v\n", err)
			globalApiErr = err
			return
		}
		globalApi = ap
		fmt.Printf("ensureAPI: API initialized\n")
	})
	if globalApiErr != nil {
		return globalApiErr
	}
	a.api = globalApi
	return nil
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize API (non-fatal if it fails; ensureAPI will retry via global once result)
	if err := a.ensureAPI(); err != nil {
		fmt.Printf("Error initializing API on startup: %v\n", err)
		a.api = nil
	}
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	// Close API
	if a.api != nil {
		a.api.Close()
	}
}

// GetProfiles returns all profiles
func (a *App) GetProfiles() ([]database.Profile, error) {
	fmt.Printf("App.GetProfiles: called\n")
	if err := a.ensureAPI(); err != nil {
		fmt.Printf("App.GetProfiles: ensureAPI error: %v\n", err)
		return nil, fmt.Errorf("API not initialized - %v", err)
	}
	profiles, err := a.api.GetProfiles()
	if err != nil {
		fmt.Printf("App.GetProfiles: api.GetProfiles error: %v\n", err)
		return nil, err
	}
	fmt.Printf("App.GetProfiles: returning %d profiles\n", len(profiles))
	return profiles, nil
}

// GetProfile returns a profile by ID
func (a *App) GetProfile(id int64) (*database.Profile, error) {
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetProfile(id)
}

// AddProfile adds a new profile
func (a *App) AddProfile(profile database.Profile) (int64, error) {
	if a.api == nil {
		return 0, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.AddProfile(profile)
}

// UpdateProfile updates an existing profile
func (a *App) UpdateProfile(profile database.Profile) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.UpdateProfile(profile)
}

// DeleteProfile deletes a profile
func (a *App) DeleteProfile(id int64) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.DeleteProfile(id)
}

// StartProfile starts a profile
func (a *App) StartProfile(id int64) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.StartProfile(id)
}

// StopProfile stops a profile
func (a *App) StopProfile(id int64) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.StopProfile(id)
}

// GetActivityLogs returns all activity logs
func (a *App) GetActivityLogs() ([]database.ActivityLog, error) {
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetActivityLogs()
}

// GetRecentActivityLogs returns the most recent activity logs
func (a *App) GetRecentActivityLogs(limit int) ([]database.ActivityLog, error) {
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetRecentActivityLogs(limit)
}

// GetLogs returns all logs
func (a *App) GetLogs() ([]api.LogEntry, error) {
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetLogs()
}

// GetRecentLogs returns the most recent logs
func (a *App) GetRecentLogs(limit int) ([]api.LogEntry, error) {
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetRecentLogs(limit)
}

// GetLogsByLevel returns logs filtered by a specific level
func (a *App) GetLogsByLevel(level string) ([]api.LogEntry, error) {
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetLogsByLevel(level)
}

// GetLogsBySource returns logs filtered by a specific source
func (a *App) GetLogsBySource(source string) ([]api.LogEntry, error) {
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetLogsBySource(source)
}

// SetGostLogLevel sets the GOST logging level
func (a *App) SetGostLogLevel(level string) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	a.api.SetGostLogLevel(level)
	return nil
}

// GetGostLogLevel returns the current GOST logging level
func (a *App) GetGostLogLevel() (string, error) {
	if a.api == nil {
		return "", fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetGostLogLevel(), nil
}

// ClearLogs clears all logs
func (a *App) ClearLogs() error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.ClearLogs()
}

// GetGostDebugInfo returns debug information about GOST detection
func (a *App) GetGostDebugInfo() map[string]interface{} {
	if a.api == nil {
		return map[string]interface{}{
			"error": "API not initialized - database connection failed",
		}
	}
	return a.api.GetGostDebugInfo()
}

// IsGostAvailable returns whether GOST is available
func (a *App) IsGostAvailable() bool {
	if a.api == nil {
		return false
	}
	return a.api.IsGostAvailable()
}

// GetGostVersion returns the GOST version if available
func (a *App) GetGostVersion() string {
	if a.api == nil {
		return ""
	}
	return a.api.GetGostVersion()
}

// Host Router controls
func (a *App) StartHostRouter(addr string) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.StartHostRouter(addr)
}

func (a *App) StopHostRouter() error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.StopHostRouter()
}

// Host Mapping bindings
func (a *App) GetHostMappings() ([]database.HostMapping, error) {
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetHostMappings()
}

func (a *App) UpsertHostMapping(mapping database.HostMapping) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.UpsertHostMapping(mapping)
}

func (a *App) DeleteHostMappingByHostname(hostname string) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.DeleteHostMappingByHostname(hostname)
}

func (a *App) DeleteHostMappingByID(id int64) error {
	if a.api == nil {
		return fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.DeleteHostMappingByID(id)
}

// IsHostRouterRunning returns whether the host router is running
func (a *App) IsHostRouterRunning() (bool, string) {
	if a.api == nil {
		return false, ""
	}
	return a.api.IsHostRouterRunning()
}

// GetTimelineEvents returns all timeline events
func (a *App) GetTimelineEvents() ([]api.TimelineEvent, error) {
	if err := a.ensureAPI(); err != nil {
		return nil, fmt.Errorf("API not initialized - %v", err)
	}
	return a.api.GetTimelineEvents(), nil
}

// TestConnection is a simple test method to verify Wails binding works
func (a *App) TestConnection() string {
	return "Wails backend is working!"
}

// GetProfilesCount returns the count of profiles (for debugging binding/marshalling)
func (a *App) GetProfilesCount() (int, error) {
	if err := a.ensureAPI(); err != nil {
		return 0, fmt.Errorf("API not initialized - %v", err)
	}
	profiles, err := a.api.GetProfiles()
	if err != nil {
		return 0, err
	}
	return len(profiles), nil
}
