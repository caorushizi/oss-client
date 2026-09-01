package app

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultDataDirUsesOverride(t *testing.T) {
	want := filepath.Join(t.TempDir(), "custom-data")
	t.Setenv("OSS_CLIENT_DATA_DIR", want)

	got, err := DefaultDataDir()
	if err != nil {
		t.Fatal(err)
	}
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestAppUsesSingleSQLiteDatabase(t *testing.T) {
	dataDir := t.TempDir()
	application, err := New("test-token", "test-version", dataDir, log.New(io.Discard, "", 0))
	if err != nil {
		t.Fatal(err)
	}
	application.Close()

	databasePath := filepath.Join(dataDir, databaseFileName)
	if _, err := os.Stat(databasePath); err != nil {
		t.Fatalf("expected shared database at %q: %v", databasePath, err)
	}
	for _, legacyName := range []string{"profiles.db", "transfers.db"} {
		if _, err := os.Stat(filepath.Join(dataDir, legacyName)); !os.IsNotExist(err) {
			t.Fatalf("legacy database %q should not be created", legacyName)
		}
	}

	db, err := sql.Open("sqlite", databasePath)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	var tableCount int
	if err := db.QueryRow(`
SELECT COUNT(*)
FROM sqlite_master
WHERE type = 'table' AND name IN ('profiles', 'transfers')`).Scan(&tableCount); err != nil {
		t.Fatal(err)
	}
	if tableCount != 2 {
		t.Fatalf("expected profiles and transfers tables in shared database, got %d", tableCount)
	}
}

func TestAppConnectsToRustFSThroughS3API(t *testing.T) {
	rustfs := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet || r.URL.Path != "/" {
			http.Error(w, "unexpected request", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/xml")
		_, _ = io.WriteString(w, `<?xml version="1.0" encoding="UTF-8"?>
<ListAllMyBucketsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Buckets><Bucket><Name>integration</Name><CreationDate>2026-01-01T00:00:00Z</CreationDate></Bucket></Buckets>
</ListAllMyBucketsResult>`)
	}))
	defer rustfs.Close()

	const token = "integration-session-token"
	application, err := New(token, "test", t.TempDir(), log.New(io.Discard, "", 0))
	if err != nil {
		t.Fatal(err)
	}
	defer application.Close()

	body, err := json.Marshal(map[string]any{
		"name":     "RustFS",
		"provider": "rustfs",
		"endpoint": rustfs.URL,
		"credentials": map[string]string{
			"accessKeyId":     "access-key",
			"accessKeySecret": "secret-key",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	create := httptest.NewRequest(http.MethodPost, "/api/v1/profiles", bytes.NewReader(body))
	create.Header.Set("Authorization", "Bearer "+token)
	create.Header.Set("Content-Type", "application/json")
	createResponse := httptest.NewRecorder()
	application.Handler().ServeHTTP(createResponse, create)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("create profile failed: %d %s", createResponse.Code, createResponse.Body)
	}
	var created struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(createResponse.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}

	list := httptest.NewRequest(http.MethodGet, "/api/v1/profiles/"+created.Data.ID+"/buckets", nil)
	list.Header.Set("Authorization", "Bearer "+token)
	listResponse := httptest.NewRecorder()
	application.Handler().ServeHTTP(listResponse, list)
	if listResponse.Code != http.StatusOK || !bytes.Contains(listResponse.Body.Bytes(), []byte("integration")) {
		t.Fatalf("list RustFS buckets failed: %d %s", listResponse.Code, listResponse.Body)
	}
}
