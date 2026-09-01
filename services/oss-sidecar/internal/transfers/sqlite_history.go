package transfers

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

type SQLiteHistoryStore struct {
	db *sql.DB
}

func NewSQLiteHistoryStore(path string) (*SQLiteHistoryStore, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, fmt.Errorf("create transfer data directory: %w", err)
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open transfer database: %w", err)
	}
	db.SetMaxOpenConns(1)
	for _, statement := range []string{
		"PRAGMA busy_timeout = 5000",
		"PRAGMA journal_mode = WAL",
		`CREATE TABLE IF NOT EXISTS transfers (
  id TEXT PRIMARY KEY,
  direction TEXT NOT NULL,
  status TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  bucket TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  object_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  transferred INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`,
	} {
		if _, err := db.Exec(statement); err != nil {
			_ = db.Close()
			return nil, fmt.Errorf("initialize transfer database: %w", err)
		}
	}
	if err := os.Chmod(path, 0o600); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("restrict transfer database permissions: %w", err)
	}
	return &SQLiteHistoryStore{db: db}, nil
}

func (s *SQLiteHistoryStore) List() ([]Task, error) {
	rows, err := s.db.Query(`
SELECT id, direction, status, profile_id, bucket, region, object_key, file_name,
       transferred, total, error, created_at, updated_at
FROM transfers ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list transfers: %w", err)
	}
	defer rows.Close()
	result := make([]Task, 0)
	for rows.Next() {
		var task Task
		var createdAt, updatedAt string
		if err := rows.Scan(
			&task.ID, &task.Direction, &task.Status, &task.ProfileID, &task.Bucket,
			&task.Region, &task.ObjectKey, &task.FileName, &task.Transferred,
			&task.Total, &task.Error, &createdAt, &updatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan transfer: %w", err)
		}
		task.CreatedAt, err = time.Parse(time.RFC3339Nano, createdAt)
		if err != nil {
			return nil, fmt.Errorf("parse transfer created time: %w", err)
		}
		task.UpdatedAt, err = time.Parse(time.RFC3339Nano, updatedAt)
		if err != nil {
			return nil, fmt.Errorf("parse transfer updated time: %w", err)
		}
		result = append(result, task)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read transfers: %w", err)
	}
	return result, nil
}

func (s *SQLiteHistoryStore) Save(task Task) error {
	_, err := s.db.Exec(`
INSERT INTO transfers (
  id, direction, status, profile_id, bucket, region, object_key, file_name,
  transferred, total, error, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  status = excluded.status,
  transferred = excluded.transferred,
  total = excluded.total,
  error = excluded.error,
  updated_at = excluded.updated_at`,
		task.ID, task.Direction, task.Status, task.ProfileID, task.Bucket, task.Region,
		task.ObjectKey, task.FileName, task.Transferred, task.Total, task.Error,
		task.CreatedAt.Format(time.RFC3339Nano), task.UpdatedAt.Format(time.RFC3339Nano),
	)
	if err != nil {
		return fmt.Errorf("save transfer: %w", err)
	}
	return nil
}

func (s *SQLiteHistoryStore) DeleteCompleted() error {
	_, err := s.db.Exec("DELETE FROM transfers WHERE status IN (?, ?, ?)", StatusCompleted, StatusFailed, StatusCanceled)
	if err != nil {
		return fmt.Errorf("delete completed transfers: %w", err)
	}
	return nil
}

func (s *SQLiteHistoryStore) Close() error {
	return s.db.Close()
}
