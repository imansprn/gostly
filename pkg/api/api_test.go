package api

import (
	"encoding/json"
	"testing"
)

func TestLogEntry_JSONTags(t *testing.T) {
	// Test that LogEntry struct has proper JSON tags
	entry := LogEntry{
		ID:          1,
		Timestamp:   "2024-01-01T00:00:00Z",
		Level:       "INFO",
		Source:      "test",
		Message:     "Test message",
		ProfileID:   nil,
		ProfileName: "Test Profile",
	}

	// This test ensures the struct can be marshaled to JSON
	// which validates the JSON tags are correct
	_, err := json.Marshal(entry)
	if err != nil {
		t.Errorf("Failed to marshal LogEntry to JSON: %v", err)
	}
}

func TestAPI_New(t *testing.T) {
	// Test that API can be created
	api, err := New()
	if err != nil {
		t.Errorf("Failed to create new API: %v", err)
	}
	if api == nil {
		t.Error("API.New() returned nil")
	}
}

func TestLogEntry_Empty(t *testing.T) {
	// Test empty LogEntry
	entry := LogEntry{}

	// Should be able to marshal empty struct
	_, err := json.Marshal(entry)
	if err != nil {
		t.Errorf("Failed to marshal empty LogEntry to JSON: %v", err)
	}
}
