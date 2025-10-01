package api

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/imansprn/gostly/pkg/database"
)

// API handles the application's business logic
type API struct {
	db            *database.DB
	processes     map[int64]*exec.Cmd
	mutex         sync.Mutex
	logs          []LogEntry
	logMutex      sync.RWMutex
	gostAvailable bool
	gostVersion   string

	// Host Mapping router (custom HTTP server)
	hostRouterAddr    string
	hostRouterCmd     *exec.Cmd
	hostRouterServer  *http.Server
	hostRouterRunning bool

	// Timeline events
	timelineEvents []TimelineEvent
	timelineMutex  sync.RWMutex
	nextEventID    int64
}

// LogEntry represents a log entry from GOST or system
type LogEntry struct {
	ID          int64  `json:"id"`
	Timestamp   string `json:"timestamp"` // ISO 8601 format string for Wails compatibility
	Level       string `json:"level"`     // "INFO", "WARN", "ERROR", "DEBUG"
	Source      string `json:"source"`    // "gost", "system", "api"
	Message     string `json:"message"`
	ProfileID   *int64 `json:"profile_id,omitempty"`
	ProfileName string `json:"profile_name,omitempty"`
}

// TimelineEvent represents an activity timeline event
type TimelineEvent struct {
	ID          int64  `json:"id"`
	Type        string `json:"type"` // "proxy_action", "configuration", "system", "error", "host_mapping"
	Action      string `json:"action"`
	Details     string `json:"details"`
	Timestamp   string `json:"timestamp"`
	ProfileName string `json:"profile_name,omitempty"`
	Status      string `json:"status"` // "success", "warning", "error"
	User        string `json:"user,omitempty"`
	Duration    string `json:"duration,omitempty"`
}

// New creates a new API instance
func New() (*API, error) {
	fmt.Printf("API.New: start\n")
	// Initialize database
	db, err := database.New()
	if err != nil {
		return nil, err
	}

	api := &API{
		db:        db,
		processes: make(map[int64]*exec.Cmd),
		logs:      []LogEntry{},
	}

	// Check GOST availability asynchronously to avoid blocking init
	go api.checkGostAvailability()

	// Add initial system log
	api.addLog("INFO", "system", "Gostly API initialized successfully", nil, "")

	// Create timeline event for API initialization
	api.addTimelineEvent("system", "API Initialized",
		"Gostly API initialized successfully",
		"success", "system", "1s", "")

	fmt.Printf("API.New: done\n")
	return api, nil
}

// checkGostAvailability checks if GOST is available (no installation)
func (a *API) checkGostAvailability() {
	// Check if GOST is available
	if a.isGostAvailable() {
		a.gostAvailable = true
		version, err := a.getGostVersion()
		if err == nil {
			a.gostVersion = version
		}
		a.addLog("INFO", "system", fmt.Sprintf("GOST detected: %s", version), nil, "")

		// Create timeline event for GOST detection
		a.addTimelineEvent("system", "GOST Detected",
			fmt.Sprintf("GOST binary detected: %s", version),
			"success", "system", "1s", "")
	} else {
		a.gostAvailable = false
		a.addLog("INFO", "system", "GOST not found - manual installation required", nil, "")
		a.addLog("INFO", "system", "To install GOST: brew install gost (macOS) or download from GitHub releases", nil, "")
	}
}

// GetGostDebugInfo returns debug information about GOST detection
func (a *API) GetGostDebugInfo() map[string]interface{} {
	info := make(map[string]interface{})

	// Get current PATH
	info["PATH"] = os.Getenv("PATH")

	// Check GOST in PATH
	if path, err := exec.LookPath("gost"); err == nil {
		info["gost_in_path"] = path
	} else {
		info["gost_in_path"] = "not found"
	}

	// Check common locations
	commonPaths := []string{
		"/usr/local/bin/gost",
		"/usr/bin/gost",
		"/opt/homebrew/bin/gost",
		"/usr/local/opt/gost/bin/gost",
		"./gost",
	}

	locationResults := make(map[string]interface{})
	for _, path := range commonPaths {
		if _, err := os.Stat(path); err == nil {
			if info, err := os.Stat(path); err == nil {
				locationResults[path] = map[string]interface{}{
					"exists":     true,
					"executable": info.Mode()&0111 != 0,
					"size":       info.Size(),
				}
			}
		} else {
			locationResults[path] = map[string]interface{}{
				"exists": false,
				"error":  err.Error(),
			}
		}
	}
	info["common_locations"] = locationResults

	// Current GOST status
	info["gost_available"] = a.gostAvailable
	info["gost_version"] = a.gostVersion

	return info
}

// getGostPath returns the full path to the GOST binary
func (a *API) getGostPath() string {
	// First try the current PATH
	if path, err := exec.LookPath("gost"); err == nil {
		return path
	}

	// If not found in PATH, check common locations
	commonPaths := []string{
		"/usr/local/bin/gost",
		"/usr/bin/gost",
		"/opt/homebrew/bin/gost",       // Apple Silicon Homebrew
		"/usr/local/opt/gost/bin/gost", // Homebrew formula
		"./gost",                       // Current directory
	}

	for _, path := range commonPaths {
		if _, err := os.Stat(path); err == nil {
			// Check if it's executable
			if info, err := os.Stat(path); err == nil {
				if info.Mode()&0111 != 0 {
					return path
				}
			}
		}
	}

	// Fallback to "gost" if nothing else works
	return "gost"
}

// isGostAvailable checks if GOST is available in the system
func (a *API) isGostAvailable() bool {
	// First try the current PATH
	if _, err := exec.LookPath("gost"); err == nil {
		return true
	}

	// If not found in PATH, check common locations
	commonPaths := []string{
		"/usr/local/bin/gost",
		"/usr/bin/gost",
		"/opt/homebrew/bin/gost",       // Apple Silicon Homebrew
		"/usr/local/opt/gost/bin/gost", // Homebrew formula
		"./gost",                       // Current directory
	}

	for _, path := range commonPaths {
		if _, err := os.Stat(path); err == nil {
			// Check if it's executable
			if info, err := os.Stat(path); err == nil {
				if info.Mode()&0111 != 0 {
					return true
				}
			}
		}
	}

	return false
}

// getGostVersion gets the GOST version if available
func (a *API) getGostVersion() (string, error) {
	// First try the current PATH
	if path, err := exec.LookPath("gost"); err == nil {
		cmd := exec.Command(path, "-V")
		output, err := cmd.Output()
		if err == nil {
			return strings.TrimSpace(string(output)), nil
		}
	}

	// If not found in PATH, check common locations
	commonPaths := []string{
		"/usr/local/bin/gost",
		"/usr/bin/gost",
		"/opt/homebrew/bin/gost",       // Apple Silicon Homebrew
		"/usr/local/opt/gost/bin/gost", // Homebrew formula
		"./gost",                       // Current directory
	}

	for _, path := range commonPaths {
		if _, err := os.Stat(path); err == nil {
			// Check if it's executable
			if info, err := os.Stat(path); err == nil {
				if info.Mode()&0111 != 0 {
					cmd := exec.Command(path, "-V")
					output, err := cmd.Output()
					if err == nil {
						return strings.TrimSpace(string(output)), nil
					}
				}
			}
		}
	}

	return "", fmt.Errorf("GOST not found in any common location")
}

// IsGostAvailable returns whether GOST is available
func (a *API) IsGostAvailable() bool {
	return a.gostAvailable
}

// GetGostVersion returns the GOST version if available
func (a *API) GetGostVersion() string {
	return a.gostVersion
}

// Close closes the API and releases resources
func (a *API) Close() error {
	fmt.Printf("API: Closing API, stopping all GOST processes...\n")

	// Stop all running processes
	a.mutex.Lock()
	processCount := len(a.processes)
	fmt.Printf("API: Found %d running GOST processes to stop\n", processCount)

	for id, cmd := range a.processes {
		if cmd != nil && cmd.Process != nil {
			fmt.Printf("API: Stopping GOST process for profile ID %d (PID: %d)\n", id, cmd.Process.Pid)

			// Try graceful shutdown first
			err := cmd.Process.Signal(os.Interrupt)
			if err != nil {
				fmt.Printf("API: Failed to send interrupt to process %d: %v\n", cmd.Process.Pid, err)
			}

			// Wait a bit for graceful shutdown
			done := make(chan error, 1)
			go func() {
				done <- cmd.Wait()
			}()

			select {
			case <-done:
				fmt.Printf("API: Process %d stopped gracefully\n", cmd.Process.Pid)
			case <-time.After(3 * time.Second):
				fmt.Printf("API: Process %d didn't stop gracefully, killing it\n", cmd.Process.Pid)
				cmd.Process.Kill()
			}
		}
		delete(a.processes, id)
	}
	a.mutex.Unlock()

	fmt.Printf("API: All GOST processes stopped\n")

	// Close database connection
	if a.db != nil {
		return a.db.Close()
	}

	return nil
}

// GetProfiles returns all profiles
func (a *API) GetProfiles() ([]database.Profile, error) {
	fmt.Printf("API: GetProfiles called\n")

	profiles, err := a.db.GetProfiles()
	if err != nil {
		fmt.Printf("API: GetProfiles database error: %v\n", err)
		a.addLog("ERROR", "api", fmt.Sprintf("GetProfiles failed: %v", err), nil, "")
		return nil, err
	}

	fmt.Printf("API: GetProfiles got %d profiles from DB\n", len(profiles))

	// Update status for each profile
	a.mutex.Lock()
	for i := range profiles {
		if _, ok := a.processes[profiles[i].ID]; ok {
			profiles[i].Status = "running"
		} else {
			profiles[i].Status = "stopped"
		}
	}
	a.mutex.Unlock()

	fmt.Printf("API: GetProfiles returning %d profiles\n", len(profiles))
	return profiles, nil
}

// GetProfile returns a profile by ID
func (a *API) GetProfile(id int64) (*database.Profile, error) {
	profile, err := a.db.GetProfile(id)
	if err != nil {
		return nil, err
	}

	// Update status
	a.mutex.Lock()
	if _, ok := a.processes[profile.ID]; ok {
		profile.Status = "running"
	} else {
		profile.Status = "stopped"
	}
	a.mutex.Unlock()

	return profile, nil
}

// AddProfile adds a new profile
func (a *API) AddProfile(profile database.Profile) (int64, error) {
	fmt.Printf("API: AddProfile called with profile: %+v\n", profile)

	err := a.db.AddProfile(&profile)
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to add profile %s: %v", profile.Name, err), nil, profile.Name)
		fmt.Printf("API: AddProfile database error: %v\n", err)
		return 0, err
	}

	a.addLog("INFO", "api", fmt.Sprintf("Profile created successfully: %s (ID: %d)", profile.Name, profile.ID), &profile.ID, profile.Name)

	// Create timeline event for profile creation
	a.addTimelineEvent("configuration", "Profile Created",
		fmt.Sprintf("New proxy profile '%s' created (%s on %s)", profile.Name, profile.Type, profile.Listen),
		"success", "admin", "1s", profile.Name)

	// Log the activity
	a.logActivity(profile.ID, profile.Name, "created", fmt.Sprintf("Profile created with type: %s, listen: %s, remote: %s", profile.Type, profile.Listen, profile.Remote))

	fmt.Printf("API: AddProfile successful, returned ID: %d\n", profile.ID)
	return profile.ID, nil
}

// UpdateProfile updates an existing profile
func (a *API) UpdateProfile(profile database.Profile) error {
	// Check if profile is running
	a.mutex.Lock()
	if _, ok := a.processes[profile.ID]; ok {
		a.mutex.Unlock()
		a.addLog("WARN", "api", fmt.Sprintf("Cannot update running profile %s (ID: %d)", profile.Name, profile.ID), &profile.ID, profile.Name)
		return fmt.Errorf("cannot update a running profile, stop it first")
	}
	a.mutex.Unlock()

	err := a.db.UpdateProfile(&profile)
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to update profile %s: %v", profile.Name, err), &profile.ID, profile.Name)
	} else {
		a.addLog("INFO", "api", fmt.Sprintf("Profile updated successfully: %s (ID: %d)", profile.Name, profile.ID), &profile.ID, profile.Name)

		// Create timeline event for profile update
		a.addTimelineEvent("configuration", "Profile Updated",
			fmt.Sprintf("Proxy profile '%s' updated (%s on %s)", profile.Name, profile.Type, profile.Listen),
			"success", "admin", "1s", profile.Name)

		// Log the activity
		a.logActivity(profile.ID, profile.Name, "updated", fmt.Sprintf("Profile updated with type: %s, listen: %s, remote: %s", profile.Type, profile.Listen, profile.Remote))
	}
	return err
}

// DeleteProfile deletes a profile
func (a *API) DeleteProfile(id int64) error {
	// Get profile info before deletion for logging
	profile, err := a.db.GetProfile(id)
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to get profile for deletion (ID: %d): %v", id, err), &id, "")
		return err
	}

	// Check if profile is running
	a.mutex.Lock()
	if _, ok := a.processes[id]; ok {
		a.mutex.Unlock()
		a.addLog("WARN", "api", fmt.Sprintf("Cannot delete running profile %s (ID: %d)", profile.Name, id), &id, profile.Name)
		return fmt.Errorf("cannot delete a running profile, stop it first")
	}
	a.mutex.Unlock()

	err = a.db.DeleteProfile(id)
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to delete profile %s: %v", profile.Name, err), &id, profile.Name)
	} else {
		a.addLog("INFO", "api", fmt.Sprintf("Profile deleted successfully: %s (ID: %d)", profile.Name, id), &id, profile.Name)

		// Create timeline event for profile deletion
		a.addTimelineEvent("configuration", "Profile Deleted",
			fmt.Sprintf("Proxy profile '%s' deleted", profile.Name),
			"success", "admin", "1s", profile.Name)

		// Log the activity
		a.logActivity(id, profile.Name, "deleted", fmt.Sprintf("Profile deleted: %s", profile.Name))
	}
	return err
}

// GostConfig represents the GOST configuration
type GostConfig struct {
	Services []struct {
		Name    string `json:"name"`
		Addr    string `json:"addr"`
		Handler struct {
			Type string `json:"type"`
			Auth struct {
				Username string `json:"username,omitempty"`
				Password string `json:"password,omitempty"`
			} `json:"auth,omitempty"`
		} `json:"handler"`
		Forwarder struct {
			Nodes []struct {
				Addr string `json:"addr"`
			} `json:"nodes"`
		} `json:"forwarder"`
	} `json:"services"`
}

// StartProfile starts a profile
func (a *API) StartProfile(id int64) error {
	// Check if GOST is available
	if !a.gostAvailable {
		a.addLog("ERROR", "api", fmt.Sprintf("Cannot start profile %d: GOST is not available", id), &id, "")
		return fmt.Errorf("GOST is not available. Please install GOST or restart the application to auto-install")
	}

	// Check if profile is already running
	a.mutex.Lock()
	if _, ok := a.processes[id]; ok {
		a.mutex.Unlock()
		a.addLog("WARN", "api", fmt.Sprintf("Profile %d is already running", id), &id, "")
		return fmt.Errorf("profile is already running")
	}
	a.mutex.Unlock()

	// Get profile
	profile, err := a.db.GetProfile(id)
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to get profile %d: %v", id, err), &id, "")
		return err
	}

	a.addLog("INFO", "api", fmt.Sprintf("Starting profile: %s (ID: %d)", profile.Name, id), &id, profile.Name)

	// Create config file with logging configuration
	configPath, err := a.createGostConfigWithLogging(profile)
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to create config for profile %s: %v", profile.Name, err), &id, profile.Name)
		return err
	}

	a.addLog("DEBUG", "api", fmt.Sprintf("Config file created: %s", configPath), &id, profile.Name)

	// Start GOST process with output capture
	gostPath := a.getGostPath()
	cmd := exec.Command(gostPath, "-C", configPath)

	// Capture stdout and stderr
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to create stdout pipe: %v", err), &id, profile.Name)
		os.Remove(configPath)
		return err
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to create stderr pipe: %v", err), &id, profile.Name)
		os.Remove(configPath)
		return err
	}

	err = cmd.Start()
	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to start GOST process: %v", err), &id, profile.Name)
		os.Remove(configPath)
		return err
	}

	// Store process
	a.mutex.Lock()
	a.processes[id] = cmd
	a.mutex.Unlock()

	// Create timeline event for profile start
	a.addTimelineEvent("proxy_action", "Profile Started",
		fmt.Sprintf("Proxy profile '%s' started on %s", profile.Name, profile.Listen),
		"success", "admin", "2s", profile.Name)

	a.addLog("INFO", "gost", fmt.Sprintf("GOST process started for profile %s (PID: %d)", profile.Name, cmd.Process.Pid), &id, profile.Name)

	// Capture GOST output in goroutines
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			a.addLog("INFO", "gost", line, &id, profile.Name)
		}
	}()

	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			level := a.detectGostLogLevel(line)
			a.addLog(level, "gost", line, &id, profile.Name)
		}
	}()

	// Clean up when process exits
	go func() {
		cmd.Wait()
		os.Remove(configPath)

		a.mutex.Lock()
		delete(a.processes, id)
		a.mutex.Unlock()

		a.addLog("INFO", "gost", fmt.Sprintf("GOST process exited for profile %s", profile.Name), &id, profile.Name)
	}()

	// Log the activity
	a.logActivity(id, profile.Name, "started", fmt.Sprintf("Profile started: %s", profile.Name))

	return nil
}

// StopProfile stops a profile
func (a *API) StopProfile(id int64) error {
	// Check if profile is running
	a.mutex.Lock()
	cmd, ok := a.processes[id]
	if !ok {
		a.mutex.Unlock()
		a.addLog("WARN", "api", fmt.Sprintf("Profile %d is not running", id), &id, "")
		return fmt.Errorf("profile is not running")
	}

	// Kill process
	err := cmd.Process.Kill()
	delete(a.processes, id)
	a.mutex.Unlock()

	if err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed to kill process for profile %d: %v", id, err), &id, "")
	} else {
		a.addLog("INFO", "api", fmt.Sprintf("Profile %d stopped successfully", id), &id, "")

		// Create timeline event for profile stop
		profile, err := a.db.GetProfile(id)
		if err == nil {
			a.addTimelineEvent("proxy_action", "Profile Stopped",
				fmt.Sprintf("Proxy profile '%s' stopped", profile.Name),
				"success", "admin", "1s", profile.Name)
		}
	}

	// Log the activity
	profile, err := a.db.GetProfile(id)
	if err == nil {
		a.logActivity(id, profile.Name, "stopped", fmt.Sprintf("Profile stopped: %s", profile.Name))
	}
	return err
}

// createConfigFile creates a temporary config file for GOST
func (a *API) createConfigFile(profile *database.Profile) (string, error) {
	// Create config directory if it doesn't exist
	configDir, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	configDir = filepath.Join(configDir, "gostly")
	err = os.MkdirAll(configDir, 0755)
	if err != nil {
		return "", err
	}

	// Create config file
	configPath := filepath.Join(configDir, fmt.Sprintf("config_%d.json", profile.ID))

	// Determine handler type based on profile type
	handlerType := "socks5" // default fallback
	fmt.Printf("DEBUG: Profile type from DB: '%s'\n", profile.Type)
	switch profile.Type {
	case "forward":
		handlerType = "socks5"
		fmt.Printf("DEBUG: Selected handler type: socks5\n")
	case "reverse":
		handlerType = "tcp"
		fmt.Printf("DEBUG: Selected handler type: tcp\n")
	case "http":
		handlerType = "http"
		fmt.Printf("DEBUG: Selected handler type: http\n")
	case "tcp":
		handlerType = "tcp"
		fmt.Printf("DEBUG: Selected handler type: tcp\n")
	case "udp":
		handlerType = "udp"
		fmt.Printf("DEBUG: Selected handler type: udp\n")
	case "ss":
		handlerType = "ss"
		fmt.Printf("DEBUG: Selected handler type: ss\n")
	default:
		// For unknown types, default to socks5
		handlerType = "socks5"
		fmt.Printf("DEBUG: Unknown profile type, defaulting to socks5\n")
	}
	fmt.Printf("DEBUG: Final handler type: '%s'\n", handlerType)

	// Create config
	config := GostConfig{}
	config.Services = []struct {
		Name    string `json:"name"`
		Addr    string `json:"addr"`
		Handler struct {
			Type string `json:"type"`
			Auth struct {
				Username string `json:"username,omitempty"`
				Password string `json:"password,omitempty"`
			} `json:"auth,omitempty"`
		} `json:"handler"`
		Forwarder struct {
			Nodes []struct {
				Addr string `json:"addr"`
			} `json:"nodes"`
		} `json:"forwarder"`
	}{
		{
			Name: profile.Name,
			Addr: profile.Listen,
			Handler: struct {
				Type string `json:"type"`
				Auth struct {
					Username string `json:"username,omitempty"`
					Password string `json:"password,omitempty"`
				} `json:"auth,omitempty"`
			}{
				Type: handlerType, // Use dynamic handler type
			},
			Forwarder: struct {
				Nodes []struct {
					Addr string `json:"addr"`
				} `json:"nodes"`
			}{
				Nodes: []struct {
					Addr string `json:"addr"`
				}{
					{
						Addr: profile.Remote,
					},
				},
			},
		},
	}

	// Add auth if provided (only for protocols that support it)
	if profile.Username != "" && profile.Password != "" {
		// Only add auth for protocols that support it
		switch handlerType {
		case "socks5", "http":
			config.Services[0].Handler.Auth.Username = profile.Username
			config.Services[0].Handler.Auth.Password = profile.Password
		}
	}

	// Write config to file
	configData, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return "", err
	}

	err = os.WriteFile(configPath, configData, 0644)
	if err != nil {
		return "", err
	}

	return configPath, nil
}

// logActivity logs a profile operation to the activity log
func (a *API) logActivity(profileID int64, profileName, action, details string) {
	log := &database.ActivityLog{
		ProfileID:   profileID,
		ProfileName: profileName,
		Action:      action,
		Details:     details,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Status:      "success",
	}

	err := a.db.AddActivityLog(log)
	if err != nil {
		fmt.Printf("API: Failed to log activity: %v\n", err)
	}
}

// GetActivityLogs returns all activity logs
func (a *API) GetActivityLogs() ([]database.ActivityLog, error) {
	return a.db.GetActivityLogs(nil)
}

// GetRecentActivityLogs returns the most recent activity logs
func (a *API) GetRecentActivityLogs(limit int) ([]database.ActivityLog, error) {
	return a.db.GetRecentActivityLogs(limit)
}

// addLog adds a log entry to the in-memory logs
func (a *API) addLog(level, source, message string, profileID *int64, profileName string) {
	a.logMutex.Lock()
	defer a.logMutex.Unlock()

	entry := LogEntry{
		ID:          a.getNextLogID(),
		Timestamp:   time.Now().Format(time.RFC3339),
		Level:       level,
		Source:      source,
		Message:     message,
		ProfileID:   profileID,
		ProfileName: profileName,
	}

	a.logs = append(a.logs, entry)
	// Keep only last 1000 logs to prevent memory issues
	if len(a.logs) > 1000 {
		a.logs = a.logs[len(a.logs)-1000:]
	}
	fmt.Printf("[%s] %s: %s\n", level, source, message)
}

// getNextLogID returns the next available log ID without locking (caller should hold lock if needed)
func (a *API) getNextLogID() int64 {
	return time.Now().UnixNano()
}

// addTimelineEvent adds a timeline event
func (a *API) addTimelineEvent(eventType, action, details, status, user, duration string, profileName string) {
	a.timelineMutex.Lock()
	defer a.timelineMutex.Unlock()

	event := TimelineEvent{
		ID:          a.nextEventID,
		Type:        eventType,
		Action:      action,
		Details:     details,
		Timestamp:   time.Now().Format(time.RFC3339),
		ProfileName: profileName,
		Status:      status,
		User:        user,
		Duration:    duration,
	}

	a.timelineEvents = append(a.timelineEvents, event)
	a.nextEventID++
}

// GetTimelineEvents returns all timeline events
func (a *API) GetTimelineEvents() []TimelineEvent {
	a.timelineMutex.RLock()
	defer a.timelineMutex.RUnlock()

	// Return a copy to avoid race conditions
	events := make([]TimelineEvent, len(a.timelineEvents))
	copy(events, a.timelineEvents)
	return events
}

// GetLogs returns all logs
func (a *API) GetLogs() ([]LogEntry, error) {
	a.logMutex.RLock()
	defer a.logMutex.RUnlock()

	// Return a copy to avoid race conditions
	logs := make([]LogEntry, len(a.logs))
	copy(logs, a.logs)

	return logs, nil
}

// GetRecentLogs returns the most recent logs
func (a *API) GetRecentLogs(limit int) ([]LogEntry, error) {
	a.logMutex.RLock()
	defer a.logMutex.RUnlock()

	if limit >= len(a.logs) {
		logs := make([]LogEntry, len(a.logs))
		copy(logs, a.logs)
		return logs, nil
	}

	logs := make([]LogEntry, limit)
	copy(logs, a.logs[len(a.logs)-limit:])
	return logs, nil
}

// ClearLogs clears all logs
func (a *API) ClearLogs() error {
	a.logMutex.Lock()
	defer a.logMutex.Unlock()

	a.logs = []LogEntry{}
	return nil
}

// GetLogsByLevel returns logs filtered by a specific level
func (a *API) GetLogsByLevel(level string) ([]LogEntry, error) {
	a.logMutex.RLock()
	defer a.logMutex.RUnlock()

	var filteredLogs []LogEntry
	levelUpper := strings.ToUpper(level)

	for _, log := range a.logs {
		if levelUpper == "ALL" || log.Level == levelUpper {
			filteredLogs = append(filteredLogs, log)
		}
	}

	return filteredLogs, nil
}

// GetLogsBySource returns logs filtered by a specific source
func (a *API) GetLogsBySource(source string) ([]LogEntry, error) {
	a.logMutex.RLock()
	defer a.logMutex.RUnlock()

	var filteredLogs []LogEntry
	sourceLower := strings.ToLower(source)

	for _, log := range a.logs {
		if sourceLower == "all" || strings.ToLower(log.Source) == sourceLower {
			filteredLogs = append(filteredLogs, log)
		}
	}

	return filteredLogs, nil
}

// Host Mapping API passthroughs
func (a *API) GetHostMappings() ([]database.HostMapping, error) {
	return a.db.GetHostMappings()
}

func (a *API) UpsertHostMapping(m database.HostMapping) error {
	// Create timeline event for host mapping change
	action := "Host Mapping Added"
	if m.ID > 0 {
		action = "Host Mapping Updated"
	}

	a.addTimelineEvent("host_mapping", action,
		fmt.Sprintf("Host mapping: %s -> %s:%d (%s)", m.Hostname, m.IP, m.Port, m.Protocol),
		"success", "admin", "1s", "")

	return a.db.UpsertHostMapping(&m)
}

func (a *API) DeleteHostMappingByHostname(hostname string) error {
	// Create timeline event for host mapping deletion
	a.addTimelineEvent("host_mapping", "Host Mapping Deleted",
		fmt.Sprintf("Host mapping removed: %s", hostname),
		"success", "admin", "1s", "")

	return a.db.DeleteHostMappingByHostname(hostname)
}

func (a *API) DeleteHostMappingByID(id int64) error {
	// Create timeline event for host mapping deletion
	a.addTimelineEvent("host_mapping", "Host Mapping Deleted",
		fmt.Sprintf("Host mapping removed (ID: %d)", id),
		"success", "admin", "1s", "")

	return a.db.DeleteHostMappingByID(id)
}

// StartHostRouter starts a custom HTTP server that routes by Host header
func (a *API) StartHostRouter(addr string) error {
	// Auto-stop any existing router first
	if a.hostRouterCmd != nil && a.hostRouterCmd.Process != nil {
		a.addLog("INFO", "api", "Stopping existing host router before starting new one", nil, "")
		if err := a.StopHostRouter(); err != nil {
			a.addLog("WARN", "api", fmt.Sprintf("Failed to stop existing router: %v", err), nil, "")
		}
		// Give it a moment to fully stop
		time.Sleep(500 * time.Millisecond)
	}

	// Also check for any processes using the same port and kill them
	if err := a.killGostProcessesOnPort(addr); err != nil {
		a.addLog("WARN", "api", fmt.Sprintf("Failed to kill processes on port %s: %v", addr, err), nil, "")
	}

	mappings, err := a.db.GetHostMappings()
	if err != nil {
		return err
	}

	// Create a simple HTTP proxy configuration for GOST v3
	// For now, let's use a single forwarder to test basic functionality
	var forwarderNodes []map[string]interface{}

	// Use the first active mapping, or create a default
	var targetMapping *database.HostMapping
	for _, m := range mappings {
		if m.Active && !strings.EqualFold(m.Protocol, "TCP") {
			targetMapping = &m
			break
		}
	}

	if targetMapping != nil {
		scheme := "http"
		if strings.EqualFold(targetMapping.Protocol, "HTTPS") {
			scheme = "https"
		}
		upstreamAddr := fmt.Sprintf("%s://%s:%d", scheme, targetMapping.IP, targetMapping.Port)

		forwarderNodes = append(forwarderNodes, map[string]interface{}{
			"name": targetMapping.Hostname,
			"addr": upstreamAddr,
		})
	} else {
		// Default fallback
		forwarderNodes = append(forwarderNodes, map[string]interface{}{
			"name": "default",
			"addr": "http://127.0.0.1:8082", // Point to your order-api
		})
	}

	// Start a custom HTTP server for host-based routing
	// This gives us full control over the routing logic
	port := strings.TrimPrefix(addr, ":")
	if port == "" {
		port = "8080"
	}

	// Create HTTP server
	mux := http.NewServeMux()

	// Add host routing handler
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		host := r.Host
		if host == "" {
			host = r.Header.Get("Host")
		}

		// Find the matching host mapping
		var targetURL string
		for _, m := range mappings {
			if m.Active && !strings.EqualFold(m.Protocol, "TCP") && m.Hostname == host {
				scheme := "http"
				if strings.EqualFold(m.Protocol, "HTTPS") {
					scheme = "https"
				}
				targetURL = fmt.Sprintf("%s://%s:%d", scheme, m.IP, m.Port)
				break
			}
		}

		if targetURL == "" {
			// Default fallback
			targetURL = "http://127.0.0.1:8082"
		}

		// Forward the request
		a.forwardRequest(w, r, targetURL)
	})

	// Start the server in a goroutine
	server := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	// Store server reference
	a.hostRouterServer = server
	a.hostRouterAddr = addr
	a.hostRouterRunning = true

	// Create timeline event
	a.addTimelineEvent("host_mapping", "Host Router Started",
		fmt.Sprintf("Custom host mapping router started on %s", addr),
		"success", "admin", "3s", "")

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			a.addLog("ERROR", "api", fmt.Sprintf("Host router error: %v", err), nil, "")
		}
	}()

	a.addLog("INFO", "api", fmt.Sprintf("Custom host router started on %s", addr), nil, "")

	return nil
}

// StopHostRouter stops the custom host router
func (a *API) StopHostRouter() error {
	if a.hostRouterServer == nil {
		return fmt.Errorf("host router not running")
	}

	// Gracefully shutdown the HTTP server
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := a.hostRouterServer.Shutdown(ctx); err != nil {
		a.addLog("ERROR", "api", fmt.Sprintf("Failed stopping host router: %v", err), nil, "")
		return err
	}

	// Update status
	a.hostRouterRunning = false
	a.hostRouterServer = nil
	a.hostRouterAddr = ""

	// Create timeline event
	a.addTimelineEvent("host_mapping", "Host Router Stopped",
		"Custom host mapping router stopped",
		"success", "admin", "1s", "")

	a.addLog("INFO", "api", "Host router stopped", nil, "")
	return nil
}

// IsHostRouterRunning returns whether the host router is running and its addr
func (a *API) IsHostRouterRunning() (bool, string) {
	return a.hostRouterRunning, a.hostRouterAddr
}

// detectGostLogLevel analyzes GOST log output to determine the actual log level
func (a *API) detectGostLogLevel(line string) string {
	// GOST typically outputs JSON logs with a "level" field
	// Try to parse as JSON first
	var logData map[string]interface{}
	if err := json.Unmarshal([]byte(line), &logData); err == nil {
		if level, ok := logData["level"].(string); ok {
			// Convert GOST levels to our levels
			switch strings.ToLower(level) {
			case "debug":
				return "DEBUG"
			case "info":
				return "INFO"
			case "warn", "warning":
				return "WARN"
			case "error":
				return "ERROR"
			default:
				return "INFO" // Default to INFO for unknown levels
			}
		}
	}

	// If not JSON, try to detect level from common patterns
	lineLower := strings.ToLower(line)

	// Error indicators
	if strings.Contains(lineLower, "error") ||
		strings.Contains(lineLower, "failed") ||
		strings.Contains(lineLower, "fatal") ||
		strings.Contains(lineLower, "panic") {
		return "ERROR"
	}

	// Warning indicators
	if strings.Contains(lineLower, "warn") ||
		strings.Contains(lineLower, "deprecated") ||
		strings.Contains(lineLower, "notice") {
		return "WARN"
	}

	// Debug indicators
	if strings.Contains(lineLower, "debug") ||
		strings.Contains(lineLower, "trace") {
		return "DEBUG"
	}

	// GOST-specific connection patterns - these are typically INFO level
	if strings.Contains(lineLower, "127.0.0.1") &&
		(strings.Contains(lineLower, "<>") || strings.Contains(lineLower, "><")) {
		return "INFO"
	}

	// Connection established/closed patterns
	if strings.Contains(lineLower, "connection") ||
		strings.Contains(lineLower, "established") ||
		strings.Contains(lineLower, "closed") {
		return "INFO"
	}

	// Default to INFO for normal operational messages
	return "INFO"
}

// createGostConfigWithLogging creates a GOST config with proper logging configuration
func (a *API) createGostConfigWithLogging(profile *database.Profile) (string, error) {
	// Create config directory if it doesn't exist
	configDir, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	configDir = filepath.Join(configDir, "gostly")
	err = os.MkdirAll(configDir, 0755)
	if err != nil {
		return "", err
	}

	// Create config file
	configPath := filepath.Join(configDir, fmt.Sprintf("config_%d.json", profile.ID))

	// Determine handler type based on profile type
	handlerType := "socks5" // default fallback
	fmt.Printf("DEBUG: Profile type from DB: '%s'\n", profile.Type)
	switch profile.Type {
	case "forward":
		handlerType = "socks5"
		fmt.Printf("DEBUG: Selected handler type: socks5\n")
	case "reverse":
		handlerType = "tcp"
		fmt.Printf("DEBUG: Selected handler type: tcp\n")
	case "http":
		handlerType = "http"
		fmt.Printf("DEBUG: Selected handler type: http\n")
	case "tcp":
		handlerType = "tcp"
		fmt.Printf("DEBUG: Selected handler type: tcp\n")
	case "udp":
		handlerType = "udp"
		fmt.Printf("DEBUG: Selected handler type: udp\n")
	case "ss":
		handlerType = "ss"
		fmt.Printf("DEBUG: Selected handler type: ss\n")
	default:
		// For unknown types, default to socks5
		handlerType = "socks5"
		fmt.Printf("DEBUG: Unknown profile type, defaulting to socks5\n")
	}
	fmt.Printf("DEBUG: Final handler type: '%s'\n", handlerType)

	// Create config with logging configuration
	config := GostConfig{}
	config.Services = []struct {
		Name    string `json:"name"`
		Addr    string `json:"addr"`
		Handler struct {
			Type string `json:"type"`
			Auth struct {
				Username string `json:"username,omitempty"`
				Password string `json:"password,omitempty"`
			} `json:"auth,omitempty"`
		} `json:"handler"`
		Forwarder struct {
			Nodes []struct {
				Addr string `json:"addr"`
			} `json:"nodes"`
		} `json:"forwarder"`
	}{
		{
			Name: profile.Name,
			Addr: profile.Listen,
			Handler: struct {
				Type string `json:"type"`
				Auth struct {
					Username string `json:"username,omitempty"`
					Password string `json:"password,omitempty"`
				} `json:"auth,omitempty"`
			}{
				Type: handlerType,
				Auth: struct {
					Username string `json:"username,omitempty"`
					Password string `json:"password,omitempty"`
				}{
					Username: profile.Username,
					Password: profile.Password,
				},
			},
			Forwarder: struct {
				Nodes []struct {
					Addr string `json:"addr"`
				} `json:"nodes"`
			}{
				Nodes: []struct {
					Addr string `json:"addr"`
				}{
					{Addr: profile.Remote},
				},
			},
		},
	}

	// Add logging configuration to reduce verbose output
	configData := map[string]interface{}{
		"services": config.Services,
		"log": map[string]interface{}{
			"level":  "info", // Set GOST log level to info to reduce noise
			"format": "json",
			"output": "stderr",
		},
	}

	// Write config to file
	data, err := json.MarshalIndent(configData, "", "  ")
	if err != nil {
		return "", err
	}

	err = os.WriteFile(configPath, data, 0644)
	if err != nil {
		return "", err
	}

	return configPath, nil
}

// SetGostLogLevel sets the logging level for GOST processes
func (a *API) SetGostLogLevel(level string) {
	// Validate log level
	validLevels := map[string]bool{
		"debug": true,
		"info":  true,
		"warn":  true,
		"error": true,
	}

	if !validLevels[strings.ToLower(level)] {
		level = "info" // Default to info if invalid
	}

	a.addLog("INFO", "api", fmt.Sprintf("GOST log level set to: %s", level), nil, "")
}

// GetGostLogLevel returns the current GOST log level
func (a *API) GetGostLogLevel() string {
	// For now, return a default level - this could be enhanced to store in config
	return "info"
}

// killGostProcessesOnPort kills any GOST processes using the specified port
func (a *API) killGostProcessesOnPort(addr string) error {
	// Extract port from addr (e.g., ":8080" -> "8080")
	port := strings.TrimPrefix(addr, ":")
	if port == "" {
		return fmt.Errorf("invalid address format: %s", addr)
	}

	// Use lsof to find processes using the port
	cmd := exec.Command("lsof", "-ti", fmt.Sprintf(":%s", port))
	output, err := cmd.Output()
	if err != nil {
		// No processes found on this port
		return nil
	}

	// Parse PIDs and kill them
	pids := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, pidStr := range pids {
		pidStr = strings.TrimSpace(pidStr)
		if pidStr == "" {
			continue
		}

		// Kill the process
		killCmd := exec.Command("kill", pidStr)
		if err := killCmd.Run(); err != nil {
			a.addLog("WARN", "api", fmt.Sprintf("Failed to kill process %s: %v", pidStr, err), nil, "")
		} else {
			a.addLog("INFO", "api", fmt.Sprintf("Killed GOST process %s on port %s", pidStr, port), nil, "")
		}
	}

	return nil
}

// forwardRequest forwards an HTTP request to the target URL
func (a *API) forwardRequest(w http.ResponseWriter, r *http.Request, targetURL string) {
	// Create reverse proxy
	proxy := httputil.NewSingleHostReverseProxy(&url.URL{
		Scheme: "http",
		Host:   strings.TrimPrefix(targetURL, "http://"),
	})

	// Update request URL for the proxy
	r.URL.Host = strings.TrimPrefix(targetURL, "http://")
	r.URL.Scheme = "http"

	// Forward the request
	proxy.ServeHTTP(w, r)
}
