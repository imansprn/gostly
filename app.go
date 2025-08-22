package main

import (
	"context"
	"fmt"

	"github.com/gobliggg/gostly/pkg/api"
	"github.com/gobliggg/gostly/pkg/database"
)

// App struct
type App struct {
	ctx context.Context
	api *api.API
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize API
	api, err := api.New()
	if err != nil {
		fmt.Printf("Error initializing API: %v\n", err)
		// Don't return, set api to nil so we can handle errors gracefully
		a.api = nil
		return
	}
	a.api = api
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
	if a.api == nil {
		return nil, fmt.Errorf("API not initialized - database connection failed")
	}
	return a.api.GetProfiles()
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
