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
	// Get the application directory
	appDir, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}

	// Create the application directory if it doesn't exist
	dbDir := filepath.Join(appDir, "gostly")
	err = os.MkdirAll(dbDir, 0755)
	if err != nil {
		return nil, err
	}

	// Connect to the database
	dbPath := filepath.Join(dbDir, "gostly.db")
	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	// Create the database schema if it doesn't exist
	db := &DB{conn: conn}
	err = db.createSchema()
	if err != nil {
		conn.Close()
		return nil, err
	}

	return db, nil
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

	return nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}

// GetProfiles returns all profiles
func (db *DB) GetProfiles() ([]Profile, error) {
	rows, err := db.conn.Query("SELECT id, name, type, listen, remote, username, password FROM profiles")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var profiles []Profile
	for rows.Next() {
		var p Profile
		err := rows.Scan(&p.ID, &p.Name, &p.Type, &p.Listen, &p.Remote, &p.Username, &p.Password)
		if err != nil {
			return nil, err
		}
		// Default status is stopped
		p.Status = "stopped"
		profiles = append(profiles, p)
	}

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
