package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/app"
)

const (
	version         = "0.1.0"
	protocolVersion = 1
)

type bootstrap struct {
	ProtocolVersion int    `json:"protocolVersion"`
	BaseURL         string `json:"baseUrl"`
	Token           string `json:"token"`
}

func main() {
	logger := log.New(os.Stderr, "oss-sidecar ", log.LstdFlags|log.Lmsgprefix)

	token, err := newSessionToken()
	if err != nil {
		logger.Fatalf("create session token: %v", err)
	}

	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		logger.Fatalf("listen on loopback: %v", err)
	}

	dataDir, err := app.DefaultDataDir()
	if err != nil {
		logger.Fatalf("resolve app data directory: %v", err)
	}
	application, err := app.New(token, version, dataDir, logger)
	if err != nil {
		logger.Fatalf("initialize app: %v", err)
	}
	defer func() {
		if err := application.Close(); err != nil {
			logger.Printf("close app: %v", err)
		}
	}()
	server := &http.Server{
		Handler:           application.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    16 << 10,
	}

	if err := json.NewEncoder(os.Stdout).Encode(bootstrap{
		ProtocolVersion: protocolVersion,
		BaseURL:         "http://" + listener.Addr().String(),
		Token:           token,
	}); err != nil {
		logger.Fatalf("write bootstrap message: %v", err)
	}

	ctx, stop := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	go func() {
		_, _ = io.Copy(io.Discard, os.Stdin)
		stop()
	}()

	serverError := make(chan error, 1)
	go func() {
		serverError <- server.Serve(listener)
	}()

	select {
	case <-ctx.Done():
	case err := <-serverError:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Printf("http server stopped: %v", err)
		}
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Printf("graceful shutdown failed: %v", err)
	}
}

func newSessionToken() (string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}
