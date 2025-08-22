package api

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/gobliggg/gostly/pkg/database"
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

// New creates a new API instance
func New() (*API, error) {
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

	// Check GOST availability and try to install if needed
	api.checkAndInstallGost()

	// Add initial system log
	api.addLog("INFO", "system", "Gostly API initialized successfully", nil, "")

	return api, nil
}

// checkAndInstallGost checks if GOST is available and tries to install it if missing
func (a *API) checkAndInstallGost() {
	// Check if GOST is available
	if a.isGostAvailable() {
		a.gostAvailable = true
		version, err := a.getGostVersion()
		if err == nil {
			a.gostVersion = version
		}
		a.addLog("INFO", "system", fmt.Sprintf("GOST detected: %s", version), nil, "")
		return
	}

	// Try to install GOST
	a.addLog("INFO", "system", "GOST not found, attempting to install...", nil, "")
	if a.installGost() {
		a.gostAvailable = true
		version, err := a.getGostVersion()
		if err == nil {
			a.gostVersion = version
		}
		a.addLog("INFO", "system", fmt.Sprintf("GOST installed successfully: %s", a.gostVersion), nil, "")
	} else {
		a.gostAvailable = false
		a.addLog("WARN", "system", "GOST installation failed, running in fallback mode", nil, "")
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

// installGost attempts to install GOST using the appropriate package manager
func (a *API) installGost() bool {
	switch runtime.GOOS {
	case "darwin":
		return a.installGostOnMac()
	case "linux":
		return a.installGostOnLinux()
	case "windows":
		return a.installGostOnWindows()
	default:
		return false
	}
}

// installGostOnMac installs GOST on macOS using Homebrew
func (a *API) installGostOnMac() bool {
	// Check if Homebrew is available
	if _, err := exec.LookPath("brew"); err != nil {
		a.addLog("WARN", "system", "Homebrew not found, cannot install GOST automatically", nil, "")
		return false
	}

	// Try to install GOST using Homebrew
	cmd := exec.Command("brew", "install", "gost")
	if err := cmd.Run(); err != nil {
		a.addLog("ERROR", "system", fmt.Sprintf("Failed to install GOST via Homebrew: %v", err), nil, "")
		return false
	}

	return true
}

// installGostOnLinux installs GOST on Linux
func (a *API) installGostOnLinux() bool {
	// Try different package managers
	packageManagers := []string{"apt", "yum", "dnf", "pacman"}

	for _, pm := range packageManagers {
		if _, err := exec.LookPath(pm); err == nil {
			switch pm {
			case "apt":
				cmd := exec.Command("sudo", "apt", "update")
				cmd.Run() // Ignore errors for update
				cmd = exec.Command("sudo", "apt", "install", "-y", "gost")
				if err := cmd.Run(); err == nil {
					return true
				}
			case "yum", "dnf":
				cmd := exec.Command("sudo", pm, "install", "-y", "gost")
				if err := cmd.Run(); err == nil {
					return true
				}
			case "pacman":
				cmd := exec.Command("sudo", "pacman", "-S", "--noconfirm", "gost")
				if err := cmd.Run(); err == nil {
					return true
				}
			}
		}
	}

	a.addLog("ERROR", "system", "No supported package manager found for GOST installation", nil, "")
	return false
}

// installGostOnWindows installs GOST on Windows
func (a *API) installGostOnWindows() bool {
	// On Windows, we'll try to download and install GOST manually
	// This is more complex and would require downloading from GitHub releases
	a.addLog("WARN", "system", "Automatic GOST installation on Windows not yet implemented", nil, "")
	return false
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
	profiles, err := a.db.GetProfiles()
	if err != nil {
		return nil, err
	}

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

	// Create config file
	configPath, err := a.createConfigFile(profile)
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
			a.addLog("ERROR", "gost", line, &id, profile.Name)
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

// addLog adds a new log entry
func (a *API) addLog(level, source, message string, profileID *int64, profileName string) {
	a.logMutex.Lock()
	defer a.logMutex.Unlock()

	log := LogEntry{
		ID:          time.Now().UnixNano(),
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Level:       level,
		Source:      source,
		Message:     message,
		ProfileID:   profileID,
		ProfileName: profileName,
	}

	// Keep only last 1000 logs to prevent memory issues
	if len(a.logs) >= 1000 {
		a.logs = a.logs[1:]
	}

	a.logs = append(a.logs, log)

	// Also log to console for debugging
	fmt.Printf("[%s] %s: %s\n", level, source, message)
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
