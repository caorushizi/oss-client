package profiles

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  provider TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  endpoint TEXT NOT NULL DEFAULT '',
  upload_bucket TEXT NOT NULL DEFAULT '',
  upload_prefix TEXT NOT NULL DEFAULT '',
  default_domain TEXT NOT NULL DEFAULT '',
  access_key_id TEXT NOT NULL,
  access_key_secret TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, endpoint, access_key_id)
);`

const profileSchemaVersion = 2

type SQLiteStore struct {
	db *sql.DB
}

func NewSQLiteStore(path string) (*SQLiteStore, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, fmt.Errorf("create profile data directory: %w", err)
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open profile database: %w", err)
	}
	db.SetMaxOpenConns(1)

	for _, statement := range []string{
		"PRAGMA busy_timeout = 5000",
		"PRAGMA journal_mode = WAL",
		"PRAGMA foreign_keys = ON",
		schema,
	} {
		if _, err := db.Exec(statement); err != nil {
			_ = db.Close()
			return nil, fmt.Errorf("initialize profile database: %w", err)
		}
	}
	if err := migrateProfileSchema(db); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("migrate profile database: %w", err)
	}

	if err := os.Chmod(path, 0o600); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("restrict profile database permissions: %w", err)
	}

	return &SQLiteStore{db: db}, nil
}

func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

func (s *SQLiteStore) List() ([]Profile, error) {
	rows, err := s.db.Query(`
SELECT id, name, provider, region, endpoint, upload_bucket, upload_prefix, default_domain,
       access_key_id, access_key_secret
FROM profiles
ORDER BY name COLLATE NOCASE`)
	if err != nil {
		return nil, fmt.Errorf("list profiles: %w", err)
	}
	defer rows.Close()

	result := make([]Profile, 0)
	for rows.Next() {
		profile, err := scanProfile(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, profile)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read profiles: %w", err)
	}
	return result, nil
}

func (s *SQLiteStore) Get(id string) (Profile, error) {
	profile, err := scanProfile(s.db.QueryRow(`
SELECT id, name, provider, region, endpoint, upload_bucket, upload_prefix, default_domain,
       access_key_id, access_key_secret
FROM profiles
WHERE id = ?`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return Profile{}, ErrNotFound
	}
	return profile, err
}

func (s *SQLiteStore) Create(profile Profile) (Profile, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return Profile{}, fmt.Errorf("begin profile transaction: %w", err)
	}
	defer tx.Rollback()

	var existingID string
	err = tx.QueryRow(
		"SELECT id FROM profiles WHERE name = ? COLLATE NOCASE",
		profile.Name,
	).Scan(&existingID)
	if err == nil {
		return Profile{}, ErrNameExists
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Profile{}, fmt.Errorf("check profile name: %w", err)
	}

	err = tx.QueryRow(
		"SELECT id FROM profiles WHERE provider = ? AND endpoint = ? AND access_key_id = ?",
		profile.Provider,
		profile.Endpoint,
		profile.Credentials.AccessKeyID,
	).Scan(&existingID)
	if err == nil {
		return Profile{}, ErrAccessKeyUsed
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Profile{}, fmt.Errorf("check profile access key: %w", err)
	}

	_, err = tx.Exec(`
INSERT INTO profiles (
  id, name, provider, region, endpoint, upload_bucket, upload_prefix, default_domain,
  access_key_id, access_key_secret
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		profile.ID,
		profile.Name,
		profile.Provider,
		profile.Region,
		profile.Endpoint,
		profile.UploadBucket,
		profile.UploadPrefix,
		profile.DefaultDomain,
		profile.Credentials.AccessKeyID,
		profile.Credentials.AccessKeySecret,
	)
	if err != nil {
		return Profile{}, fmt.Errorf("insert profile: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return Profile{}, fmt.Errorf("commit profile: %w", err)
	}
	return profile, nil
}

func (s *SQLiteStore) Update(profile Profile) (Profile, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return Profile{}, fmt.Errorf("begin profile transaction: %w", err)
	}
	defer tx.Rollback()

	var existingID string
	err = tx.QueryRow(
		"SELECT id FROM profiles WHERE id <> ? AND name = ? COLLATE NOCASE",
		profile.ID,
		profile.Name,
	).Scan(&existingID)
	if err == nil {
		return Profile{}, ErrNameExists
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Profile{}, fmt.Errorf("check profile name: %w", err)
	}

	err = tx.QueryRow(
		"SELECT id FROM profiles WHERE id <> ? AND provider = ? AND endpoint = ? AND access_key_id = ?",
		profile.ID,
		profile.Provider,
		profile.Endpoint,
		profile.Credentials.AccessKeyID,
	).Scan(&existingID)
	if err == nil {
		return Profile{}, ErrAccessKeyUsed
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Profile{}, fmt.Errorf("check profile access key: %w", err)
	}

	result, err := tx.Exec(`
UPDATE profiles SET
  name = ?,
  provider = ?,
  region = ?,
  endpoint = ?,
  upload_bucket = ?,
  upload_prefix = ?,
  default_domain = ?,
  access_key_id = ?,
  access_key_secret = ?
WHERE id = ?`,
		profile.Name,
		profile.Provider,
		profile.Region,
		profile.Endpoint,
		profile.UploadBucket,
		profile.UploadPrefix,
		profile.DefaultDomain,
		profile.Credentials.AccessKeyID,
		profile.Credentials.AccessKeySecret,
		profile.ID,
	)
	if err != nil {
		return Profile{}, fmt.Errorf("update profile: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return Profile{}, fmt.Errorf("read updated profile count: %w", err)
	}
	if affected == 0 {
		return Profile{}, ErrNotFound
	}
	if err := tx.Commit(); err != nil {
		return Profile{}, fmt.Errorf("commit profile: %w", err)
	}
	return profile, nil
}

func (s *SQLiteStore) Delete(id string) error {
	result, err := s.db.Exec("DELETE FROM profiles WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("delete profile: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("read deleted profile count: %w", err)
	}
	if affected == 0 {
		return ErrNotFound
	}
	return nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanProfile(row scanner) (Profile, error) {
	var profile Profile
	err := row.Scan(
		&profile.ID,
		&profile.Name,
		&profile.Provider,
		&profile.Region,
		&profile.Endpoint,
		&profile.UploadBucket,
		&profile.UploadPrefix,
		&profile.DefaultDomain,
		&profile.Credentials.AccessKeyID,
		&profile.Credentials.AccessKeySecret,
	)
	if err != nil {
		return Profile{}, err
	}
	return profile, nil
}

func migrateProfileSchema(db *sql.DB) error {
	var version int
	if err := db.QueryRow("PRAGMA user_version").Scan(&version); err != nil {
		return err
	}
	if version > profileSchemaVersion {
		return fmt.Errorf("profile database version %d is newer than supported version %d", version, profileSchemaVersion)
	}
	if version == profileSchemaVersion {
		return nil
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	rows, err := tx.Query("PRAGMA table_info(profiles)")
	if err != nil {
		return err
	}
	columns := make(map[string]bool)
	for rows.Next() {
		var cid, notNull, primaryKey int
		var name, columnType string
		var defaultValue any
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultValue, &primaryKey); err != nil {
			_ = rows.Close()
			return err
		}
		columns[name] = true
	}
	if err := rows.Err(); err != nil {
		_ = rows.Close()
		return err
	}
	if err := rows.Close(); err != nil {
		return err
	}
	for _, column := range []string{"endpoint", "upload_bucket", "upload_prefix", "default_domain"} {
		if columns[column] {
			continue
		}
		if _, err := tx.Exec(fmt.Sprintf("ALTER TABLE profiles ADD COLUMN %s TEXT NOT NULL DEFAULT ''", column)); err != nil {
			return err
		}
	}

	if _, err := tx.Exec("DROP TABLE IF EXISTS profiles_v2"); err != nil {
		return err
	}
	if _, err := tx.Exec(`
CREATE TABLE profiles_v2 (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  provider TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  endpoint TEXT NOT NULL DEFAULT '',
  upload_bucket TEXT NOT NULL DEFAULT '',
  upload_prefix TEXT NOT NULL DEFAULT '',
  default_domain TEXT NOT NULL DEFAULT '',
  access_key_id TEXT NOT NULL,
  access_key_secret TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, endpoint, access_key_id)
)`); err != nil {
		return err
	}
	if _, err := tx.Exec(`
INSERT INTO profiles_v2 (
  id, name, provider, region, endpoint, upload_bucket, upload_prefix, default_domain,
  access_key_id, access_key_secret, created_at
)
SELECT id, name, provider, region, endpoint, upload_bucket, upload_prefix, default_domain,
       access_key_id, access_key_secret, created_at
FROM profiles`); err != nil {
		return err
	}
	if _, err := tx.Exec("DROP TABLE profiles"); err != nil {
		return err
	}
	if _, err := tx.Exec("ALTER TABLE profiles_v2 RENAME TO profiles"); err != nil {
		return err
	}
	if _, err := tx.Exec("PRAGMA user_version = 2"); err != nil {
		return err
	}
	return tx.Commit()
}
