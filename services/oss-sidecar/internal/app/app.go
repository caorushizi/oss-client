package app

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/httpapi"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/profiles"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage/aliyun"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage/qiniu"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage/s3compatible"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage/tencent"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/transfers"
)

type App struct {
	handler http.Handler
	server  *httpapi.Server
	store   *profiles.SQLiteStore
}

const databaseFileName = "oss-client.db"

func DefaultDataDir() (string, error) {
	if configured := strings.TrimSpace(os.Getenv("OSS_CLIENT_DATA_DIR")); configured != "" {
		absolute, err := filepath.Abs(configured)
		if err != nil {
			return "", fmt.Errorf("resolve configured data directory: %w", err)
		}
		return absolute, nil
	}
	root, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("resolve user config directory: %w", err)
	}
	return filepath.Join(root, "oss-client"), nil
}

func New(token string, version string, dataDir string, logger *log.Logger) (*App, error) {
	databasePath := filepath.Join(dataDir, databaseFileName)
	profileStore, err := profiles.NewSQLiteStore(databasePath)
	if err != nil {
		return nil, err
	}
	s3Provider := s3compatible.New()
	providers := storage.NewRegistry(map[string]storage.Provider{
		"aliyun":  aliyun.New(),
		"qiniu":   qiniu.New(),
		"rustfs":  s3Provider,
		"s3":      s3Provider,
		"tencent": tencent.New(),
	})
	transferManager, err := transfers.NewPersistentManager(
		profileStore,
		providers,
		databasePath,
	)
	if err != nil {
		_ = profileStore.Close()
		return nil, err
	}
	server := httpapi.NewWithTransfers(token, version, profileStore, providers, transferManager, logger)
	return &App{handler: server.Handler(), server: server, store: profileStore}, nil
}

func (a *App) Handler() http.Handler {
	return a.handler
}

func (a *App) Close() error {
	a.server.Close()
	return a.store.Close()
}
