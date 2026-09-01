package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/profiles"
	"github.com/caorushizi/oss-client/services/oss-sidecar/internal/storage"
)

const testToken = "test-session-token"

type fakeProvider struct{}

func (fakeProvider) ListBuckets(
	context.Context,
	storage.Credentials,
) ([]storage.Bucket, error) {
	return []storage.Bucket{{Name: "demo"}}, nil
}

func (fakeProvider) ListDomains(context.Context, storage.Credentials, string) ([]string, error) {
	return []string{"cdn.example.com"}, nil
}

func (fakeProvider) ListObjects(
	context.Context,
	storage.Credentials,
	storage.ListObjectsInput,
) (storage.ObjectPage, error) {
	return storage.ObjectPage{Items: []storage.Object{}}, nil
}

func (fakeProvider) UploadFile(
	context.Context,
	storage.Credentials,
	storage.FileTransferInput,
) error {
	return nil
}

func (fakeProvider) DownloadFile(
	context.Context,
	storage.Credentials,
	storage.FileTransferInput,
) error {
	return nil
}

func testServer() *Server {
	provider := fakeProvider{}
	return New(
		testToken,
		"test",
		profiles.NewMemoryStore(),
		storage.NewRegistry(map[string]storage.Provider{
			"qiniu":  provider,
			"rustfs": provider,
			"s3":     provider,
		}),
		log.New(io.Discard, "", 0),
	)
}

func TestCreateRustFSProfileNormalizesEndpointAndRegion(t *testing.T) {
	body, err := json.Marshal(map[string]any{
		"name":     "Local RustFS",
		"provider": "rustfs",
		"endpoint": "http://127.0.0.1:9000/",
		"credentials": map[string]string{
			"accessKeyId":     "rustfsadmin",
			"accessKeySecret": "secret",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest(http.MethodPost, "/api/v1/profiles", bytes.NewReader(body))
	request.Header.Set("Authorization", "Bearer "+testToken)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	testServer().Handler().ServeHTTP(response, request)

	if response.Code != http.StatusCreated {
		t.Fatalf("expected %d, got %d: %s", http.StatusCreated, response.Code, response.Body)
	}
	var payload struct {
		Data profileResponse `json:"data"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Data.Endpoint != "http://127.0.0.1:9000" {
		t.Fatalf("unexpected endpoint %q", payload.Data.Endpoint)
	}
	if payload.Data.Region != storage.DefaultS3Region {
		t.Fatalf("unexpected region %q", payload.Data.Region)
	}
}

func TestCreateRustFSProfileRejectsInvalidEndpoint(t *testing.T) {
	body, err := json.Marshal(map[string]any{
		"name":     "Invalid RustFS",
		"provider": "rustfs",
		"endpoint": "file:///private/data",
		"credentials": map[string]string{
			"accessKeyId":     "key",
			"accessKeySecret": "secret",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest(http.MethodPost, "/api/v1/profiles", bytes.NewReader(body))
	request.Header.Set("Authorization", "Bearer "+testToken)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	testServer().Handler().ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d: %s", http.StatusBadRequest, response.Code, response.Body)
	}
	if !bytes.Contains(response.Body.Bytes(), []byte("ENDPOINT_INVALID")) {
		t.Fatalf("expected ENDPOINT_INVALID response, got %s", response.Body)
	}
}

func TestHealthRequiresSession(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	response := httptest.NewRecorder()

	testServer().Handler().ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", http.StatusUnauthorized, response.Code)
	}
}

func TestCreateProfileNeverReturnsSecret(t *testing.T) {
	body, err := json.Marshal(map[string]any{
		"name":     "demo",
		"provider": "qiniu",
		"credentials": map[string]string{
			"accessKeyId":     "access-key-1234",
			"accessKeySecret": "must-not-leak",
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/profiles",
		bytes.NewReader(body),
	)
	request.Header.Set("Authorization", "Bearer "+testToken)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	testServer().Handler().ServeHTTP(response, request)

	if response.Code != http.StatusCreated {
		t.Fatalf("expected %d, got %d: %s", http.StatusCreated, response.Code, response.Body)
	}
	if bytes.Contains(response.Body.Bytes(), []byte("must-not-leak")) {
		t.Fatal("response leaked access key secret")
	}
}

func TestAliyunProfileRequiresRegion(t *testing.T) {
	body, err := json.Marshal(map[string]any{
		"name":     "aliyun",
		"provider": "aliyun",
		"credentials": map[string]string{
			"accessKeyId":     "access-key-1234",
			"accessKeySecret": "secret",
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/profiles",
		bytes.NewReader(body),
	)
	request.Header.Set("Authorization", "Bearer "+testToken)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	testServer().Handler().ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d: %s", http.StatusBadRequest, response.Code, response.Body)
	}
	if !bytes.Contains(response.Body.Bytes(), []byte("REGION_REQUIRED")) {
		t.Fatalf("expected REGION_REQUIRED response, got %s", response.Body)
	}
}

func TestStartTransferNeverReturnsLocalPath(t *testing.T) {
	store := profiles.NewMemoryStore()
	_, err := store.Create(profiles.Profile{
		ID:       "profile-1",
		Name:     "test",
		Provider: "qiniu",
		Credentials: profiles.Credentials{
			AccessKeyID:     "key",
			AccessKeySecret: "secret",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	server := New(
		testToken,
		"test",
		store,
		storage.NewRegistry(map[string]storage.Provider{"qiniu": fakeProvider{}}),
		log.New(io.Discard, "", 0),
	)
	defer server.Close()

	localPath := filepath.Join(t.TempDir(), "private-local-name.txt")
	if err := os.WriteFile(localPath, []byte("test"), 0o600); err != nil {
		t.Fatal(err)
	}
	body, err := json.Marshal(map[string]string{
		"direction": "upload",
		"profileId": "profile-1",
		"bucket":    "bucket",
		"objectKey": "remote.txt",
		"localPath": localPath,
	})
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest(http.MethodPost, "/api/v1/transfers", bytes.NewReader(body))
	request.Header.Set("Authorization", "Bearer "+testToken)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	server.Handler().ServeHTTP(response, request)

	if response.Code != http.StatusAccepted {
		t.Fatalf("expected %d, got %d: %s", http.StatusAccepted, response.Code, response.Body)
	}
	if bytes.Contains(response.Body.Bytes(), []byte(localPath)) {
		t.Fatalf("response leaked local path: %s", response.Body)
	}
}
