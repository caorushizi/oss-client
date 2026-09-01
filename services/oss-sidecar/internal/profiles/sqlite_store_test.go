package profiles

import (
	"database/sql"
	"errors"
	"path/filepath"
	"testing"
)

func TestSQLiteStorePersistsCredentials(t *testing.T) {
	path := filepath.Join(t.TempDir(), "profiles.db")
	store, err := NewSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}

	want := Profile{
		ID:       "profile-1",
		Name:     "Aliyun Production",
		Provider: "aliyun",
		Region:   "cn-hangzhou",
		Endpoint: "https://oss.example.com",
		Credentials: Credentials{
			AccessKeyID:     "access-key",
			AccessKeySecret: "stored-in-sqlite",
		},
	}
	if _, err := store.Create(want); err != nil {
		t.Fatal(err)
	}
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}

	reopened, err := NewSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()

	got, err := reopened.Get(want.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got != want {
		t.Fatalf("persisted profile mismatch: got %#v", got)
	}
}

func TestSQLiteStoreMigratesLegacyProfilesAndScopesKeysByEndpoint(t *testing.T) {
	path := filepath.Join(t.TempDir(), "profiles.db")
	db, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Exec(`
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  provider TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  access_key_id TEXT NOT NULL,
  access_key_secret TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, access_key_id)
);
INSERT INTO profiles (
  id, name, provider, region, access_key_id, access_key_secret
) VALUES ('legacy', 'Legacy', 'qiniu', '', 'legacy-key', 'legacy-secret');`)
	if err != nil {
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}

	store, err := NewSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()

	legacy, err := store.Get("legacy")
	if err != nil {
		t.Fatal(err)
	}
	if legacy.Endpoint != "" || legacy.Credentials.AccessKeySecret != "legacy-secret" {
		t.Fatalf("legacy profile was not preserved: %#v", legacy)
	}

	first := Profile{
		ID:       "rustfs-1",
		Name:     "RustFS One",
		Provider: "rustfs",
		Region:   "us-east-1",
		Endpoint: "http://127.0.0.1:9000",
		Credentials: Credentials{
			AccessKeyID:     "rustfsadmin",
			AccessKeySecret: "secret",
		},
	}
	if _, err := store.Create(first); err != nil {
		t.Fatal(err)
	}
	second := first
	second.ID = "rustfs-2"
	second.Name = "RustFS Two"
	second.Endpoint = "http://127.0.0.1:9100"
	if _, err := store.Create(second); err != nil {
		t.Fatalf("same key on another endpoint should be allowed: %v", err)
	}
	duplicate := first
	duplicate.ID = "rustfs-3"
	duplicate.Name = "RustFS Duplicate"
	if _, err := store.Create(duplicate); !errors.Is(err, ErrAccessKeyUsed) {
		t.Fatalf("expected ErrAccessKeyUsed, got %v", err)
	}
}

func TestSQLiteStoreRejectsDuplicateNameAndAccessKey(t *testing.T) {
	store, err := NewSQLiteStore(filepath.Join(t.TempDir(), "profiles.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()

	base := Profile{
		ID:       "profile-1",
		Name:     "Production",
		Provider: "qiniu",
		Credentials: Credentials{
			AccessKeyID:     "access-key",
			AccessKeySecret: "secret",
		},
	}
	if _, err := store.Create(base); err != nil {
		t.Fatal(err)
	}

	duplicateName := base
	duplicateName.ID = "profile-2"
	duplicateName.Name = "production"
	duplicateName.Credentials.AccessKeyID = "another-key"
	if _, err := store.Create(duplicateName); !errors.Is(err, ErrNameExists) {
		t.Fatalf("expected ErrNameExists, got %v", err)
	}

	duplicateKey := base
	duplicateKey.ID = "profile-3"
	duplicateKey.Name = "Another"
	if _, err := store.Create(duplicateKey); !errors.Is(err, ErrAccessKeyUsed) {
		t.Fatalf("expected ErrAccessKeyUsed, got %v", err)
	}
}

func TestSQLiteStoreUpdatesProfileConfiguration(t *testing.T) {
	store, err := NewSQLiteStore(filepath.Join(t.TempDir(), "profiles.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()

	profile := Profile{
		ID: "profile-1", Name: "Before", Provider: "qiniu",
		Credentials: Credentials{AccessKeyID: "key", AccessKeySecret: "secret"},
	}
	if _, err := store.Create(profile); err != nil {
		t.Fatal(err)
	}
	profile.Name = "After"
	profile.UploadBucket = "assets"
	profile.UploadPrefix = "images/"
	profile.DefaultDomain = "https://cdn.example.com"
	if _, err := store.Update(profile); err != nil {
		t.Fatal(err)
	}
	got, err := store.Get(profile.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got != profile {
		t.Fatalf("updated profile mismatch: got %#v", got)
	}
}
