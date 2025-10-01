package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3" // SQLite driver registration
)

// Profile represents a GOST proxy profile
type Profile struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"` // "forward" or "reverse"
	Listen   string `json:"listen"`
	Remote   string `json:"remote"`
	Username string `json:"username"`
	Password string `json:"password"`
	Status   string `json:"status"` // "running" or "stopped"
}

// ActivityLog represents a profile operation log entry
type ActivityLog struct {
	ID          int64  `json:"id"`
	ProfileID   int64  `json:"profile_id"`
	ProfileName string `json:"profile_name"`
	Action      string `json:"action"` // "created", "updated", "deleted", "started", "stopped"
	Details     string `json:"details"`
	Timestamp   string `json:"timestamp"` // ISO 8601 format
	Status      string `json:"status"`    // "success", "error"
}

// DB handles database operations
type DB struct {
	conn *sql.DB
}

// New creates a new database connection
func New() (*DB, error) {
	// Try multiple writable locations in order
	locations := []struct {
		desc string
		prep func() (string, error)
	}{
		{desc: "user config dir", prep: os.UserConfigDir},
		{desc: "user cache dir", prep: os.UserCacheDir},
		{desc: "user home dir", prep: os.UserHomeDir},
		{desc: "temp dir", prep: func() (string, error) { return os.TempDir(), nil }},
		{desc: "current working dir", prep: func() (string, error) { return os.Getwd() }},
	}

	var lastErr error
	for _, loc := range locations {
		base, err := loc.prep()
		if err != nil || base == "" {
			if err == nil {
				err = fmt.Errorf("empty base path")
			}
			lastErr = fmt.Errorf("get %s failed: %w", loc.desc, err)
			continue
		}

		// Ensure app directory exists
		dbDir := filepath.Join(base, "gostly")
		if mkErr := os.MkdirAll(dbDir, 0755); mkErr != nil {
			lastErr = fmt.Errorf("mkdir %s failed: %w", dbDir, mkErr)
			continue
		}

		dbPath := filepath.Join(dbDir, "gostly.db")
		conn, openErr := sql.Open("sqlite3", dbPath)
		if openErr != nil {
			lastErr = fmt.Errorf("open sqlite at %s failed: %w", dbPath, openErr)
			continue
		}

		// Verify connection is usable
		if pingErr := conn.Ping(); pingErr != nil {
			conn.Close()
			lastErr = fmt.Errorf("ping sqlite at %s failed: %w", dbPath, pingErr)
			continue
		}

		db := &DB{conn: conn}
		if schemaErr := db.createSchema(); schemaErr != nil {
			conn.Close()
			lastErr = fmt.Errorf("create schema at %s failed: %w", dbPath, schemaErr)
			continue
		}

		// Log chosen path for visibility
		fmt.Printf("DB initialized at: %s (location: %s)\n", dbPath, loc.desc)
		return db, nil
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("unknown error creating database")
	}
	return nil, lastErr
}

// createSchema creates the database schema if it doesn't exist
func (db *DB) createSchema() error {
	// Create the profiles table
	_, err := db.conn.Exec(`
		CREATE TABLE IF NOT EXISTS profiles (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			type TEXT NOT NULL,
			listen TEXT NOT NULL,
			remote TEXT NOT NULL,
			username TEXT,
			password TEXT
		)
	`)
	if err != nil {
		return err
	}

	// Create the activity_logs table
	_, err = db.conn.Exec(`
		CREATE TABLE IF NOT EXISTS activity_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			profile_id INTEGER,
			profile_name TEXT NOT NULL,
			action TEXT NOT NULL,
			details TEXT,
			timestamp TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'success',
			FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE SET NULL
		)
	`)
	if err != nil {
		return err
	}

	// Create the host_mappings table
	_, err = db.conn.Exec(`
		CREATE TABLE IF NOT EXISTS host_mappings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			hostname TEXT NOT NULL UNIQUE,
			ip TEXT NOT NULL,
			port INTEGER NOT NULL,
			protocol TEXT NOT NULL,
			active INTEGER NOT NULL DEFAULT 1
		)
	`)
	if err != nil {
		return err
	}

	// Add default profiles if none exist
	if err := db.addDefaultProfiles(); err != nil {
		fmt.Printf("Warning: Failed to add default profiles: %v\n", err)
	}

	return nil
}

// addDefaultProfiles adds some default profiles if the profiles table is empty
func (db *DB) addDefaultProfiles() error {
	// Check if profiles table is empty
	var count int
	err := db.conn.QueryRow("SELECT COUNT(*) FROM profiles").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Already has profiles
	}

	// Add default profiles
	defaultProfiles := []Profile{
		{
			Name:     "Local SOCKS5",
			Type:     "forward",
			Listen:   ":1080",
			Remote:   "127.0.0.1:1080",
			Username: "",
			Password: "",
		},
		{
			Name:     "HTTP Proxy",
			Type:     "http",
			Listen:   ":8080",
			Remote:   "example.com:80",
			Username: "demo-user",
			Password: "demo-password",
		},
	}

	for _, profile := range defaultProfiles {
		if err := db.AddProfile(&profile); err != nil {
			fmt.Printf("Warning: Failed to add default profile %s: %v\n", profile.Name, err)
		}
	}

	fmt.Printf("Added %d default profiles\n", len(defaultProfiles))
	return nil
}

// HostMapping represents a hostname to destination mapping
type HostMapping struct {
	ID       int64  `json:"id"`
	Hostname string `json:"hostname"`
	IP       string `json:"ip"`
	Port     int    `json:"port"`
	Protocol string `json:"protocol"` // HTTP | HTTPS | TCP
	Active   bool   `json:"active"`
}

// GetHostMappings returns all host mappings
func (db *DB) GetHostMappings() ([]HostMapping, error) {
	rows, err := db.conn.Query("SELECT id, hostname, ip, port, protocol, active FROM host_mappings ORDER BY hostname ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mappings []HostMapping
	for rows.Next() {
		var m HostMapping
		var activeInt int
		if err := rows.Scan(&m.ID, &m.Hostname, &m.IP, &m.Port, &m.Protocol, &activeInt); err != nil {
			return nil, err
		}
		m.Active = activeInt == 1
		mappings = append(mappings, m)
	}
	return mappings, nil
}

// UpsertHostMapping inserts or updates a host mapping by hostname
func (db *DB) UpsertHostMapping(m *HostMapping) error {
	// Try update first
	res, err := db.conn.Exec(
		"UPDATE host_mappings SET ip = ?, port = ?, protocol = ?, active = ? WHERE hostname = ?",
		m.IP, m.Port, m.Protocol, boolToInt(m.Active), m.Hostname,
	)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		// Insert
		res, err = db.conn.Exec(
			"INSERT INTO host_mappings (hostname, ip, port, protocol, active) VALUES (?, ?, ?, ?, ?)",
			m.Hostname, m.IP, m.Port, m.Protocol, boolToInt(m.Active),
		)
		if err != nil {
			return err
		}
		id, err := res.LastInsertId()
		if err == nil {
			m.ID = id
		}
	}
	return nil
}

// DeleteHostMapping deletes a host mapping by hostname or id
func (db *DB) DeleteHostMappingByHostname(hostname string) error {
	_, err := db.conn.Exec("DELETE FROM host_mappings WHERE hostname = ?", hostname)
	return err
}

func (db *DB) DeleteHostMappingByID(id int64) error {
	_, err := db.conn.Exec("DELETE FROM host_mappings WHERE id = ?", id)
	return err
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}

// GetProfiles returns all profiles
func (db *DB) GetProfiles() ([]Profile, error) {
	fmt.Printf("DB: GetProfiles called\n")

	rows, err := db.conn.Query("SELECT id, name, type, listen, remote, username, password FROM profiles")
	if err != nil {
		fmt.Printf("DB: GetProfiles query error: %v\n", err)
		return nil, err
	}
	defer rows.Close()

	fmt.Printf("DB: GetProfiles query executed, scanning rows\n")

	var profiles []Profile
	for rows.Next() {
		var p Profile
		err := rows.Scan(&p.ID, &p.Name, &p.Type, &p.Listen, &p.Remote, &p.Username, &p.Password)
		if err != nil {
			fmt.Printf("DB: GetProfiles scan error: %v\n", err)
			return nil, err
		}
		// Default status is stopped
		p.Status = "stopped"
		profiles = append(profiles, p)
		fmt.Printf("DB: GetProfiles scanned profile: %s (ID: %d)\n", p.Name, p.ID)
	}

	if err = rows.Err(); err != nil {
		fmt.Printf("DB: GetProfiles rows error: %v\n", err)
		return nil, err
	}

	fmt.Printf("DB: GetProfiles returning %d profiles\n", len(profiles))
	return profiles, nil
}

// GetProfile returns a profile by ID
func (db *DB) GetProfile(id int64) (*Profile, error) {
	var p Profile
	err := db.conn.QueryRow(
		"SELECT id, name, type, listen, remote, username, password FROM profiles WHERE id = ?",
		id,
	).Scan(&p.ID, &p.Name, &p.Type, &p.Listen, &p.Remote, &p.Username, &p.Password)
	if err != nil {
		return nil, err
	}

	// Default status is stopped
	p.Status = "stopped"
	return &p, nil
}

// AddProfile adds a new profile
func (db *DB) AddProfile(p *Profile) error {
	fmt.Printf("DB: AddProfile called with profile: %+v\n", p)

	res, err := db.conn.Exec(
		"INSERT INTO profiles (name, type, listen, remote, username, password) VALUES (?, ?, ?, ?, ?, ?)",
		p.Name, p.Type, p.Listen, p.Remote, p.Username, p.Password,
	)
	if err != nil {
		fmt.Printf("DB: AddProfile exec error: %v\n", err)
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		fmt.Printf("DB: AddProfile LastInsertId error: %v\n", err)
		return err
	}

	fmt.Printf("DB: AddProfile successful, inserted ID: %d\n", id)
	p.ID = id
	return nil
}

// UpdateProfile updates an existing profile
func (db *DB) UpdateProfile(p *Profile) error {
	_, err := db.conn.Exec(
		"UPDATE profiles SET name = ?, type = ?, listen = ?, remote = ?, username = ?, password = ? WHERE id = ?",
		p.Name, p.Type, p.Listen, p.Remote, p.Username, p.Password, p.ID,
	)
	return err
}

// DeleteProfile deletes a profile
func (db *DB) DeleteProfile(id int64) error {
	_, err := db.conn.Exec("DELETE FROM profiles WHERE id = ?", id)
	return err
}

// AddActivityLog adds a new activity log entry
func (db *DB) AddActivityLog(log *ActivityLog) error {
	_, err := db.conn.Exec(
		"INSERT INTO activity_logs (profile_id, profile_name, action, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
		log.ProfileID, log.ProfileName, log.Action, log.Details, log.Timestamp, log.Status,
	)
	return err
}

// GetActivityLogs returns all activity logs, optionally filtered by profile ID
func (db *DB) GetActivityLogs(profileID *int64) ([]ActivityLog, error) {
	var query string
	var args []interface{}

	if profileID != nil {
		query = "SELECT id, profile_id, profile_name, action, details, timestamp, status FROM activity_logs WHERE profile_id = ? ORDER BY timestamp DESC"
		args = append(args, *profileID)
	} else {
		query = "SELECT id, profile_id, profile_name, action, details, timestamp, status FROM activity_logs ORDER BY timestamp DESC"
	}

	rows, err := db.conn.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []ActivityLog
	for rows.Next() {
		var log ActivityLog
		err := rows.Scan(&log.ID, &log.ProfileID, &log.ProfileName, &log.Action, &log.Details, &log.Timestamp, &log.Status)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}

	return logs, nil
}

// GetRecentActivityLogs returns the most recent activity logs (limited count)
func (db *DB) GetRecentActivityLogs(limit int) ([]ActivityLog, error) {
	rows, err := db.conn.Query(
		"SELECT id, profile_id, profile_name, action, details, timestamp, status FROM activity_logs ORDER BY timestamp DESC LIMIT ?",
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []ActivityLog
	for rows.Next() {
		var log ActivityLog
		err := rows.Scan(&log.ID, &log.ProfileID, &log.ProfileName, &log.Action, &log.Details, &log.Timestamp, &log.Status)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}

	return logs, nil
}
