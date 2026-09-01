package transfers

import (
	"path/filepath"
	"testing"
	"time"
)

func TestSQLiteHistoryPersistsAndClearsTerminalTasks(t *testing.T) {
	path := filepath.Join(t.TempDir(), "transfers.db")
	store, err := NewSQLiteHistoryStore(path)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC().Truncate(time.Microsecond)
	task := Task{
		ID: "transfer-1", Direction: DirectionUpload, Status: StatusCompleted,
		ProfileID: "profile-1", Bucket: "assets", ObjectKey: "logo.png",
		FileName: "logo.png", Transferred: 42, Total: 42, CreatedAt: now, UpdatedAt: now,
	}
	if err := store.Save(task); err != nil {
		t.Fatal(err)
	}
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}

	reopened, err := NewSQLiteHistoryStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	tasks, err := reopened.List()
	if err != nil {
		t.Fatal(err)
	}
	if len(tasks) != 1 || tasks[0] != task {
		t.Fatalf("persisted transfer mismatch: %#v", tasks)
	}
	if err := reopened.DeleteCompleted(); err != nil {
		t.Fatal(err)
	}
	tasks, err = reopened.List()
	if err != nil {
		t.Fatal(err)
	}
	if len(tasks) != 0 {
		t.Fatalf("expected cleared history, got %#v", tasks)
	}
}
